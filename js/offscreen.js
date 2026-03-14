'use strict';

// Holds active audio nodes per tab
const tabs = {};

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    switch (message.name) {
        case 'capture-tab':
            captureTab(message.tabId, message.streamId)
                .then(() => sendResponse())
                .catch(err => sendResponse({ error: err.message }));
            return true;

        case 'set-volume':
            setVolume(message.tabId, message.value);
            sendResponse();
            return false;

        case 'dispose-tab':
            disposeTab(message.tabId)
                .then(() => sendResponse())
                .catch(err => sendResponse({ error: err.message }));
            return true;

        default:
            return false;
    }
});

async function captureTab(tabId, streamId) {
    const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
            mandatory: {
                chromeMediaSource: 'tab',
                chromeMediaSourceId: streamId,
            },
        },
        video: false,
    });

    const audioContext = new AudioContext();
    const streamSource = audioContext.createMediaStreamSource(stream);
    const gainNode = audioContext.createGain();

    streamSource.connect(gainNode);
    gainNode.connect(audioContext.destination);

    tabs[tabId] = { audioContext, streamSource, gainNode };
}

function setVolume(tabId, value) {
    if (tabId in tabs) {
        tabs[tabId].gainNode.gain.value = value;
    }
}

async function disposeTab(tabId) {
    if (tabId in tabs) {
        await tabs[tabId].audioContext.close();
        delete tabs[tabId];
    }
}
