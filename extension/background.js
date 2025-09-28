// background.js
const tabState = new Map(); // tabId => { status, lastUpdated, details }

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (!message || message.type !== "PAGE_RECORDING_EVENT") return;

  const tabId = sender.tab ? sender.tab.id : null;
  const payload = message.payload || {};
  const status = payload.status || "unknown";

  if (tabId !== null) {
    const prev = tabState.get(tabId) || { status: "safe", details: [] };
    if (status === "recording") {
      prev.status = "recording";
      prev.details = prev.details || [];
      if (payload.detail) prev.details.push(payload.detail);
    } else if (status === "safe") {
      prev.status = "safe";
      prev.details = [];
    }
    prev.lastUpdated = payload.timestamp || Date.now();
    tabState.set(tabId, prev);

    // optionally notify popup or content scripts
    chrome.action.setBadgeText({ tabId, text: prev.status === "recording" ? "REC" : "" });
    chrome.action.setBadgeBackgroundColor({ color: "#d9534f", tabId });

    // respond
    sendResponse && sendResponse({ ok: true });
  } else {
    // global or unknown tab events — ignore for now
  }

  // keep worker alive if necessary
  return true;
});

// Clean up when tab is removed
chrome.tabs.onRemoved.addListener((tabId) => {
  tabState.delete(tabId);
});

// Provide an API for popup to query current state of active tab
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message && message.type === "QUERY_TAB_STATUS") {
    const tabId = message.tabId;
    const state = tabState.get(tabId) || { status: "safe", details: [] };
    sendResponse({ ok: true, state });
  }
});
