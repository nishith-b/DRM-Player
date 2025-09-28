// injected.js
(function () {
  console.log("Injected script is running");

  if (
    window.__PAGE_RECORDING_HOOK__ &&
    window.__PAGE_RECORDING_HOOK__._isOurHook
  )
    return;

  const hook = {
    _isOurHook: true,
    status: "safe", // "safe" or "recording"
    details: [], // array of { type, reason }
    isRecording() {
      return this.status === "recording";
    },
    getState() {
      return { status: this.status, details: this.details.slice() };
    },
    _setRecording(detail) {
      this.status = "recording";
      this.details.push(detail);
      this._emit({ status: "recording", detail });
    },
    _setSafe(reason) {
      this.status = "safe";
      this.details = [];
      this._emit({ status: "safe", detail: reason });
    },
    _emit(payload) {
      try {
        window.postMessage(
          Object.assign(
            { __PAGE_RECORDING_EVENT__: true, tabIdHint: null },
            payload
          ),
          "*"
        );
      } catch (e) {}
    },
  };

  Object.defineProperty(window, "__PAGE_RECORDING_HOOK__", {
    configurable: true,
    enumerable: false,
    writable: false,
    value: hook,
  });

  // respond to explicit state requests from content script
  window.addEventListener("message", (event) => {
    const d = event.data;
    if (d?.__PAGE_RECORDING_REQUEST__ && d.relayId) {
      window.postMessage({
        __PAGE_RECORDING_EVENT__: true,
        relayId: d.relayId,
        state: hook.getState(),
      });
    }
  });

  // patch helpers
  function patchGetUserMedia() {
    if (!navigator.mediaDevices?.getUserMedia) return;
    const orig = navigator.mediaDevices.getUserMedia.bind(
      navigator.mediaDevices
    );
    navigator.mediaDevices.getUserMedia = function (constraints) {
      hook._setRecording({ type: "getUserMedia", constraints });
      const p = orig(constraints);
      p.then((stream) => {
        const cleanup = () => {
          if (stream.getTracks().every((t) => t.readyState === "ended")) {
            setTimeout(() => hook._setSafe("getUserMedia tracks ended"), 100);
          }
        };
        stream.getTracks().forEach((t) => t.addEventListener("ended", cleanup));
      }).catch(() => {});
      return p;
    };
  }

  function patchGetDisplayMedia() {
    if (!navigator.mediaDevices?.getDisplayMedia) return;
    const orig = navigator.mediaDevices.getDisplayMedia.bind(
      navigator.mediaDevices
    );
    navigator.mediaDevices.getDisplayMedia = function (constraints) {
      hook._setRecording({ type: "getDisplayMedia", constraints });
      const p = orig(constraints);
      p.then((stream) => {
        const cleanup = () => {
          if (stream.getTracks().every((t) => t.readyState === "ended")) {
            setTimeout(
              () => hook._setSafe("getDisplayMedia tracks ended"),
              100
            );
          }
        };
        stream.getTracks().forEach((t) => t.addEventListener("ended", cleanup));
      }).catch(() => {});
      return p;
    };
  }

  function patchMediaRecorder() {
    if (!window.MediaRecorder) return;
    const Orig = window.MediaRecorder;
    function NewMediaRecorder(stream, options) {
      hook._setRecording({
        type: "MediaRecorder.created",
        options,
        streamType: describeStream(stream),
      });
      const recorder = new Orig(stream, options);
      recorder.addEventListener?.("stop", () => {
        setTimeout(() => {
          if (
            !stream ||
            stream.getTracks().every((t) => t.readyState === "ended") ||
            recorder.state === "inactive"
          ) {
            hook._setSafe("MediaRecorder stopped & tracks ended");
          }
        }, 50);
      });
      return recorder;
    }
    NewMediaRecorder.prototype = Orig.prototype;
    Object.getOwnPropertyNames(Orig).forEach((k) => {
      try {
        NewMediaRecorder[k] = Orig[k];
      } catch {}
    });
    window.MediaRecorder = NewMediaRecorder;
  }

  function patchCaptureStream() {
    if (HTMLMediaElement?.prototype?.captureStream) {
      const orig = HTMLMediaElement.prototype.captureStream;
      HTMLMediaElement.prototype.captureStream = function (...args) {
        hook._setRecording({ type: "captureStream", element: tagOrDesc(this) });
        return orig.apply(this, args);
      };
    }
  }

  function patchRTCPeerConnection() {
    if (!window.RTCPeerConnection?.prototype?.addTrack) return;
    const orig = window.RTCPeerConnection.prototype.addTrack;
    window.RTCPeerConnection.prototype.addTrack = function (track, ...streams) {
      hook._setRecording({
        type: "RTCPeerConnection.addTrack",
        trackKind: track.kind,
        streamsInfo: streams.length,
      });
      return orig.apply(this, [track, ...streams]);
    };
  }

  // helpers
  function describeStream(s) {
    try {
      return s?.getTracks
        ? s
            .getTracks()
            .map((t) => t.kind)
            .join(",")
        : "no-stream";
    } catch {
      return "stream-unknown";
    }
  }
  function tagOrDesc(el) {
    try {
      return (
        el.tagName +
        (el.id ? `#${el.id}` : "") +
        (el.className ? `.${el.className.split(" ").join(".")}` : "")
      );
    } catch {
      return "element";
    }
  }

  // apply patches
  patchGetUserMedia();
  patchGetDisplayMedia();
  patchMediaRecorder();
  patchCaptureStream();
  patchRTCPeerConnection();
})();
