'use strict';

const slider = document.querySelector('.slider');
const valueDisplay = document.querySelector('.slider-value');
const tabsList = document.querySelector('.js-tabs-audible');

async function getActiveTab() {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    return tab;
}

async function getTabVolume(tabId) {
    return chrome.runtime.sendMessage({ name: 'get-tab-volume', tabId });
}

async function setTabVolume(tabId, value) {
    return chrome.runtime.sendMessage({ name: 'set-tab-volume', tabId, value });
}

// Initialize slider with the active tab's current volume
(async () => {
    const tab = await getActiveTab();
    const volume = await getTabVolume(tab.id);
    slider.value = volume * 100;
    valueDisplay.textContent = `${Math.round(volume * 100)}%`;
})();

slider.addEventListener('input', async () => {
    const value = Number(slider.value);
    valueDisplay.textContent = `${Math.round(value)}%`;

    const tab = await getActiveTab();
    await setTabVolume(tab.id, value / 100);
});

// Render the list of all currently audible tabs
(async () => {
    const tabs = await chrome.tabs.query({ audible: true });

    for (const tab of tabs) {
        const volume = await getTabVolume(tab.id);

        const tabEl = document.createElement('div');
        tabEl.className = 'tab';
        tabEl.dataset.tabId = tab.id;
        tabEl.dataset.windowId = tab.windowId;

        const titleEl = document.createElement('div');
        titleEl.className = 'tab_item';
        titleEl.title = tab.title;
        titleEl.textContent = tab.title;

        const valueEl = document.createElement('div');
        valueEl.className = 'tab_value';
        valueEl.textContent = `${Math.round(volume * 100)}%`;

        tabEl.append(titleEl, valueEl);
        tabsList.append(tabEl);
    }
})();

// Switch to a tab when its title is clicked
tabsList.addEventListener('click', e => {
    const tabItem = e.target.closest('.tab_item');
    if (!tabItem) return;

    const tabEl = tabItem.closest('.tab');
    const tabId = parseInt(tabEl.dataset.tabId);
    const windowId = parseInt(tabEl.dataset.windowId);

    chrome.windows.update(windowId, { focused: true });
    chrome.tabs.update(tabId, { active: true });
});
