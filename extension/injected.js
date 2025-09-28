// injected.js
(function () {
  if (window.__PAGE_RECORDING_HOOK__ && window.__PAGE_RECORDING_HOOK__._isOurHook) {
    // already injected
    return;
  }

  const hook = {
    _isOurHook: true,
    status: "safe", // "safe" or "recording"
    details: [], // array of { type, reason }
    isRecording() {
      return this.status === "recording";
    },
    _setRecording(detail) {
      if (this.status !== "recording") {
        this.status = "recording";
        this.details.push(detail);
        this._emit({ status: "recording", detail });
      } else {
        // add detail for further info
        this.details.push(detail);
        this._emit({ status: "recording", detail });
      }
    },
    _setSafe(reason) {
      // clear details and set safe
      this.status = "safe";
      this.details = [];
      this._emit({ status: "safe", detail: reason });
    },
    _emit(payload) {
      try {
        window.postMessage(
          Object.assign(
            {
              __PAGE_RECORDING_EVENT__: true,
              tabIdHint: null
            },
            payload
          ),
          "*"
        );
      } catch (e) {
        // ignore
      }
    }
  };

  // attach hook to window
  Object.defineProperty(window, "__PAGE_RECORDING_HOOK__", {
    configurable: true,
    enumerable: false,
    writable: false,
    value: hook
  });

  // respond to explicit state requests from content script
  window.addEventListener("message", (event) => {
    if (!event.data) return;
    const d = event.data;
    if (d.__PAGE_RECORDING_REQUEST__ && d.relayId) {
      window.postMessage({
        __PAGE_RECORDING_EVENT__: true,
        relayId: d.relayId,
        state: { status: hook.status, details: hook.details.slice() }
      });
    }
  });

  // Helpers to patch APIs
  function safeCall(fn, ...args) {
    try {
      return fn.apply(this, args);
    } catch (e) {
      return undefined;
    }
  }

  // Patch navigator.mediaDevices.getUserMedia
  if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
    const originalGetUserMedia = navigator.mediaDevices.getUserMedia.bind(navigator.mediaDevices);
    navigator.mediaDevices.getUserMedia = function (constraints) {
      // note: we cannot know if the stream will be recorded later, but presence of a stream suggests potential recording
      hook._setRecording({ type: "getUserMedia", constraints });
      const promise = originalGetUserMedia(constraints);
      // When the stream ends (all tracks end), we might set safe again if nothing else
      promise
        .then((stream) => {
          // listen for track end
          const cleanupWhenAllEnded = () => {
            const tracks = stream.getTracks();
            if (tracks.every((t) => t.readyState === "ended")) {
              // schedule microtask to avoid immediate flip-flop
              setTimeout(() => {
                // we don't know about other recorders, so set safe only if no tracks active
                if (stream.getTracks().every((t) => t.readyState === "ended")) {
                  hook._setSafe("getUserMedia tracks ended");
                }
              }, 100);
            }
          };
          stream.getTracks().forEach((t) => t.addEventListener("ended", cleanupWhenAllEnded));
          return stream;
        })
        .catch(() => {});
      return promise;
    };
  }

  // Patch navigator.mediaDevices.getDisplayMedia (screen capture)
  if (navigator.mediaDevices && navigator.mediaDevices.getDisplayMedia) {
    const origGetDisplayMedia = navigator.mediaDevices.getDisplayMedia.bind(navigator.mediaDevices);
    navigator.mediaDevices.getDisplayMedia = function (constraints) {
      hook._setRecording({ type: "getDisplayMedia", constraints });
      const p = origGetDisplayMedia(constraints);
      p.then((stream) => {
        const cleanup = () => {
          if (stream.getTracks().every((t) => t.readyState === "ended")) {
            setTimeout(() => {
              if (stream.getTracks().every((t) => t.readyState === "ended")) {
                hook._setSafe("getDisplayMedia tracks ended");
              }
            }, 100);
          }
        };
        stream.getTracks().forEach((t) => t.addEventListener("ended", cleanup));
      }).catch(() => {});
      return p;
    };
  }

  // Patch MediaRecorder constructor to detect actual recording
  try {
    const OriginalMediaRecorder = window.MediaRecorder;
    if (OriginalMediaRecorder) {
      const NewMediaRecorder = function (stream, options) {
        // When a MediaRecorder is created, it's likely a recording action
        hook._setRecording({ type: "MediaRecorder.created", options, streamType: describeStream(stream) });

        const recorder = new OriginalMediaRecorder(stream, options);

        // When recorder stops, announce safe (only if no other recording sources)
        const onStop = () => {
          setTimeout(() => {
            // heuristics only: if no active tracks in stream, mark safe
            if (stream && stream.getTracks && stream.getTracks().every((t) => t.readyState === "ended")) {
              hook._setSafe("MediaRecorder stopped & tracks ended");
            } else {
              // still mark safe if recorder state is inactive
              try {
                if (recorder && recorder.state === "inactive") {
                  hook._setSafe("MediaRecorder stopped");
                }
              } catch (e) {}
            }
          }, 50);
        };
        recorder.addEventListener && recorder.addEventListener("stop", onStop);

        return recorder;
      };

      // copy prototype and static props
      NewMediaRecorder.prototype = OriginalMediaRecorder.prototype;
      try {
        Object.getOwnPropertyNames(OriginalMediaRecorder).forEach((k) => {
          try {
            NewMediaRecorder[k] = OriginalMediaRecorder[k];
          } catch (e) {}
        });
      } catch (e) {}

      window.MediaRecorder = NewMediaRecorder;
    }
  } catch (e) {
    // ignore if cannot patch
  }

  // Patch HTMLMediaElement.prototype.captureStream (e.g., video.captureStream())
  try {
    if (HTMLMediaElement && HTMLMediaElement.prototype && HTMLMediaElement.prototype.captureStream) {
      const origCapture = HTMLMediaElement.prototype.captureStream;
      HTMLMediaElement.prototype.captureStream = function (...args) {
        hook._setRecording({ type: "captureStream", element: tagOrDesc(this) });
        return origCapture.apply(this, args);
      };
    }
  } catch (e) {}

  // Patch RTCPeerConnection.addTrack -> signaling that a track is being sent
  try {
    if (window.RTCPeerConnection && window.RTCPeerConnection.prototype) {
      const origAddTrack = window.RTCPeerConnection.prototype.addTrack;
      window.RTCPeerConnection.prototype.addTrack = function (track, ...streams) {
        hook._setRecording({ type: "RTCPeerConnection.addTrack", trackKind: track.kind, streamsInfo: streams.length });
        return origAddTrack.apply(this, [track, ...streams]);
      };
    }
  } catch (e) {}

  // Utility helpers
  function describeStream(s) {
    if (!s) return "no-stream";
    try {
      const kinds = s.getTracks ? s.getTracks().map((t) => t.kind) : [];
      return kinds.join(",");
    } catch (e) {
      return "stream-unknown";
    }
  }
  function tagOrDesc(el) {
    try {
      return el.tagName + (el.id ? `#${el.id}` : "") + (el.className ? `.${el.className.split(" ").join(".")}` : "");
    } catch (e) {
      return "element";
    }
  }

  // Basic heartbeat: if no events for some time, keep safe — but we rely on explicit events to be conservative
  // NOTE: we intentionally err on the side of marking recording when APIs are used.

})();
