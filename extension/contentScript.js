// contentScript.js
(function () {
  // Inject the real page-level script so we can monkey-patch page APIs (runs in page's JS context)
  const script = document.createElement("script");
  script.src = chrome.runtime.getURL("injected.js");
  script.async = false;
  (document.documentElement || document.head || document.body).prepend(script);

  // Listen for messages from the injected page script
  window.addEventListener("message", (event) => {
    if (!event.source || event.source !== window) return;
    const data = event.data;
    if (!data || data.__PAGE_RECORDING_EVENT__ !== true) return;

    // Relay event to background
    chrome.runtime.sendMessage({
      type: "PAGE_RECORDING_EVENT",
      payload: {
        tabIdHint: data.tabIdHint || null,
        status: data.status,
        detail: data.detail || null,
        timestamp: Date.now()
      }
    });
  });

  // Provide an API for extension popup to request current page-stored hook state
  chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
    if (msg && msg.type === "REQUEST_PAGE_HOOK_STATE") {
      // ask page for current hook state; page will post a message back which we capture below
      // implement a short-lived relay
      const relayId = Math.random().toString(36).slice(2, 9);
      const onMessage = (event) => {
        if (!event.source || event.source !== window) return;
        const d = event.data;
        if (d && d.__PAGE_RECORDING_EVENT__ === true && d.relayId === relayId) {
          window.removeEventListener("message", onMessage);
          sendResponse({ ok: true, state: d.state });
        }
      };
      window.addEventListener("message", onMessage);
      // ask page to respond
      window.postMessage({ __PAGE_RECORDING_REQUEST__: true, relayId }, "*");

      // Indicate we will respond asynchronously
      return true;
    }
  });
})();
