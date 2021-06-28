'use strict';

// Handle messages from popup
chrome.runtime.onMessage.addListener(async (message, sender, respond) => {
    switch (message.name) {
        case 'get-tab-volume':
            respond(await getTabVolume(message.tabId))
            break
        case 'set-tab-volume':
            respond(undefined) // Nothing to send here.
            console.log(message.tabId, message.value);
            await setTabVolume(message.tabId, message.value)
            break
        default:
            throw Error(`Unknown message received: ${message}`)
    }
})

const tabs = {}

async function getTabVolume(tabId) {
    return tabId in tabs ? (await tabs[tabId]).gainNode.gain.value : 1
}

async function setTabVolume(tabId, value) {
    if (!(tabId in tabs)) {
        captureTab(tabId)
    }

    (await tabs[tabId]).gainNode.gain.value = value
}

function captureTab(tabId) {
    tabs[tabId] = new Promise(async resolve => {
        chrome.tabCapture.capture({ audio: true, video: false }, stream => {
            const audioContext = new AudioContext()
            const streamSource = audioContext.createMediaStreamSource(stream)
            const gainNode = audioContext.createGain()

            streamSource.connect(gainNode)
            gainNode.connect(audioContext.destination)

            resolve({ audioContext, streamSource, gainNode })
        })
    })
}

// Clean everything up once the tab is closed
chrome.tabs.onRemoved.addListener(disposeTab)

async function disposeTab(tabId) {
    if (tabId in tabs) {
        (await tabs[tabId]).audioContext.close()
        delete tabs[tabId]
    }
}