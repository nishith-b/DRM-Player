// popup.js
document.addEventListener("DOMContentLoaded", () => {
  const statusEl = document.getElementById("status");
  const detailsEl = document.getElementById("details");
  const refreshBtn = document.getElementById("refresh");
  const askPageBtn = document.getElementById("askPage");

  async function update() {
    detailsEl.textContent = "";
    statusEl.textContent = "Checking...";
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (!tab) {
      statusEl.textContent = "No active tab";
      return;
    }
    chrome.runtime.sendMessage({ type: "QUERY_TAB_STATUS", tabId: tab.id }, (resp) => {
      if (!resp || !resp.ok) {
        statusEl.textContent = "No data";
        return;
      }
      const state = resp.state || { status: "safe", details: [] };
      if (state.status === "recording") {
        statusEl.className = "record";
        statusEl.textContent = "Recording detected";
        detailsEl.textContent = JSON.stringify(state.details || [], null, 2);
      } else {
        statusEl.className = "safe";
        statusEl.textContent = "Safe (no page-side capture detected)";
        detailsEl.textContent = "";
      }
    });
  }

  refreshBtn.addEventListener("click", update);

  askPageBtn.addEventListener("click", async () => {
    detailsEl.textContent = "Requesting page hook state...";
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (!tab) {
      detailsEl.textContent = "No active tab";
      return;
    }

    // Send message to content script to fetch page hook state via window.postMessage relay
    chrome.tabs.sendMessage(tab.id, { type: "REQUEST_PAGE_HOOK_STATE" }, (resp) => {
      if (!resp) {
        detailsEl.textContent = "No response (content script may not be injected)";
        return;
      }
      if (resp.ok) {
        detailsEl.textContent = JSON.stringify(resp.state, null, 2);
      } else {
        detailsEl.textContent = "Failed to get state";
      }
    });
  });

  update();
});
