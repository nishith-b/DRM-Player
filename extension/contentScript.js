// contentScript.js
(function () {
  // Inject the real page-level script so we can monkey-patch page APIs
  const script = document.createElement("script");
  script.src = chrome.runtime.getURL("injected.js");
  script.async = false;

  // Debugging hooks
  script.onload = () => console.log("[Recorder Detector] injected.js loaded successfully");
  script.onerror = () => console.error("[Recorder Detector] Failed to load injected.js");

  (document.documentElement || document.head || document.body).prepend(script);
  console.log("[Recorder Detector] Script injected");

  // Listen for messages from the injected page script
  window.addEventListener("message", (event) => {
    if (event.source !== window) return;
    const data = event.data;
    if (!data || data.__PAGE_RECORDING_EVENT__ !== true) return;

    console.log("[Recorder Detector] Received page event:", data);

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
    if (msg?.type === "REQUEST_PAGE_HOOK_STATE") {
      console.log("[Recorder Detector] Received hook state request");

      const relayId = Math.random().toString(36).slice(2, 9);
      const onMessage = (event) => {
        if (event.source !== window) return;
        const d = event.data;
        if (d?.__PAGE_RECORDING_EVENT__ === true && d.relayId === relayId) {
          console.log("[Recorder Detector] Relaying hook state back to popup:", d.state);
          window.removeEventListener("message", onMessage);
          sendResponse({ ok: true, state: d.state });
        }
      };
      window.addEventListener("message", onMessage);

      // Ask page to respond
      window.postMessage({ __PAGE_RECORDING_REQUEST__: true, relayId }, "*");

      return true; // keep async response channel open
    }
  });

  console.log("[Recorder Detector] Content script initialized");
})();
