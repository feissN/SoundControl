'use strict';

let getActiveTab = function (cb) {
    chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
        cb(tabs);
    })
}

let getAllTabsAudible = function (cb) {
    chrome.tabs.query({ audible: true }, function (tabs) {
        cb(tabs);
    });
};


const slider = document.querySelector(".slider");

(() => {
    getActiveTab(function (tabs) {
        const message = { name: 'get-tab-volume', tabId: tabs[0].id };

        chrome.runtime.sendMessage(message, response => {
            slider.value = response * 100;
            document.querySelector(".sliderContainer").querySelector("p").innerText = `${slider.value}%`
        });
    });
})();

slider.addEventListener("input", e => {
    const value = slider.value;
    document.querySelector(".sliderContainer").querySelector("p").innerText = `${value}%`;

    getActiveTab(function (tabs) {
        const message = { name: 'set-tab-volume', tabId: tabs[0].id, value: value / 100 };

        chrome.runtime.sendMessage(message, response => {
            document.querySelector(".sliderContainer").querySelector("p").innerText = `${slider.value}%`;
        });
    });
});



/**
 * Render a list of all audible tabs
 */
async function renderTabsAudible() {
    getAllTabsAudible(function (tabs) {
        for (let tab of tabs) {
            const message = { name: 'get-tab-volume', tabId: tab.id };
            chrome.runtime.sendMessage(message, response => {
                let html = `
                    <div class="tab" data-tab-id="${tab.id}" data-window-id="${tab.windowId}">
                        <div class="tab_item" title="${tab.title}">${tab.title}</div>
                        <div class="tab_item tab_value">${parseInt(response * 100)}%</div>
                    </div>`;
                document.querySelector('.js-tabs-audible').innerHTML += html;
            });
        }
    });
};


/**
 * RUN
 */
renderTabsAudible();


/**
 * Event listeners
 */
document.querySelector('.js-tabs-audible').addEventListener('click', function (e) {
    let targetEl = e.target;

    // React to clicks on tab items only
    if (targetEl.matches('.tab_item')) {
        let tabEl = targetEl.closest('.tab');
        let tabId = parseInt(tabEl.dataset.tabId);
        let windowId = parseInt(tabEl.dataset.windowId);

        chrome.windows.update(windowId, { focused: true });
        chrome.tabs.update(tabId, { active: true });
    }
});
