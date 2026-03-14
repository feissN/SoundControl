'use strict';

// Tracks the last-known volume per tab (reset when service worker is recycled)
const tabVolumes = {};

// Tracks which tabs currently have an active audio capture
const capturedTabs = new Set();

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    switch (message.name) {
        case 'get-tab-volume':
            sendResponse(tabVolumes[message.tabId] ?? 1);
            return false;

        case 'set-tab-volume':
            handleSetVolume(message.tabId, message.value)
                .then(() => sendResponse())
                .catch(err => {
                    console.error('[SoundControl] set-tab-volume failed:', err);
                    sendResponse({ error: err.message });
                });
            return true; // keep the message channel open for the async response

        default:
            return false;
    }
});

async function handleSetVolume(tabId, value) {
    tabVolumes[tabId] = value;

    if (!capturedTabs.has(tabId)) {
        const streamId = await chrome.tabCapture.getMediaStreamId({ tabId });
        await ensureOffscreenDocument();
        await sendToOffscreen({ name: 'capture-tab', tabId, streamId });
        capturedTabs.add(tabId);
    }

    await sendToOffscreen({ name: 'set-volume', tabId, value });
}

async function ensureOffscreenDocument() {
    const existing = await chrome.runtime.getContexts({
        contextTypes: ['OFFSCREEN_DOCUMENT'],
    });
    if (existing.length === 0) {
        await chrome.offscreen.createDocument({
            url: 'html/offscreen.html',
            reasons: ['USER_MEDIA'],
            justification: 'Capture tab audio stream for per-tab volume control',
        });
    }
}

function sendToOffscreen(message) {
    return chrome.runtime.sendMessage(message);
}

chrome.tabs.onRemoved.addListener(async (tabId) => {
    delete tabVolumes[tabId];

    if (capturedTabs.has(tabId)) {
        capturedTabs.delete(tabId);
        const existing = await chrome.runtime.getContexts({
            contextTypes: ['OFFSCREEN_DOCUMENT'],
        });
        if (existing.length > 0) {
            chrome.runtime.sendMessage({ name: 'dispose-tab', tabId });
        }
    }
});
