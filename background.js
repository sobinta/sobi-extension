// Service Worker to open index.html in a new tab when clicking the extension icon
chrome.action.onClicked.addListener((tab) => {
    chrome.tabs.create({
        url: chrome.runtime.getURL("index.html")
    });
});
