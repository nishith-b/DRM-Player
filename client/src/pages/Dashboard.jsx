import { useEffect, useRef, useState } from "react";
import Card from "../components/common/Card";
import Button from "../components/common/Button";
import { toast } from "react-hot-toast";

export default function Dashboard() {
  const [loading, setLoading] = useState(false);
  const hasShownToast = useRef(false);
  const [devtoolsInstalled, setDevtoolsInstalled] = useState(false);

  // DevTools detection (supports modern + legacy)
  const isDevToolsActive = () => {
    if (typeof window === "undefined") return false; // SSR guard
    const hook = window.__REACT_DEVTOOLS_GLOBAL_HOOK__;
    if (!hook) return false;

    if (hook.renderers instanceof Map) {
      return hook.renderers.size > 0;
    }
    if (typeof hook.renderers === "object") {
      return Object.keys(hook.renderers).length > 0;
    }
    return false;
  };

  // Pick correct extension link by browser
  const getDevToolsLink = () => {
    const userAgent = navigator.userAgent;
    if (/Firefox/.test(userAgent)) {
      return "https://addons.mozilla.org/en-US/firefox/addon/react-devtools/";
    } else if (/Edg/.test(userAgent)) {
      return "https://microsoftedge.microsoft.com/addons/detail/react-developer-tools/gpphkfbcpidddadnkolkpfckpihlkkil";
    }
    return "https://chromewebstore.google.com/detail/react-developer-tools/fmkadmapgofadopljbjfkapdkoienihi";
  };

  // Welcome toast once
  useEffect(() => {
    if (!hasShownToast.current) {
      toast.success("Welcome to your dashboard!");
      hasShownToast.current = true;
    }
  }, []);

  // Extension detection polling (bi-directional)
  useEffect(() => {
    function checkDevTools() {
      const detected = isDevToolsActive();

      setDevtoolsInstalled((prev) => {
        if (prev !== detected) {
          if (detected) {
            toast.success("✅ React DevTools detected!");
          } else {
            toast.error("⚠️ React DevTools removed or disabled!");
          }
        }
        return detected;
      });
    }

    checkDevTools(); // run immediately
    const interval = setInterval(checkDevTools, 5000); // check every 5s
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="p-6">
      {/* Show only when NOT installed */}
      {!devtoolsInstalled && (
        <div
          role="alert"
          aria-live="polite"
          className="fixed z-50 max-w-sm p-4 text-black bg-yellow-300 rounded shadow-lg bottom-4 right-4"
        >
          <p className="mb-2 font-semibold">React DevTools Not Detected</p>
          <p className="mb-4 text-sm">
            For the best experience, please install the React Developer Tools
            browser extension and reload the page.
          </p>
          <a
            href={getDevToolsLink()}
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-700 underline"
          >
            Install React DevTools
          </a>
        </div>
      )}

      <h1 className="mb-4 text-3xl font-semibold">Dashboard</h1>

      <Card>
        <p className="text-lg">Welcome to your dashboard 🎉</p>
        <p className="mt-2 text-sm text-gray-600">
          Here you can manage your settings, view statistics, and take actions.
        </p>
      </Card>

      <div className="flex items-center gap-4 mt-6">
        <Button
          onClick={() => toast.success("Button clicked!")}
          disabled={loading}
        >
          Click Me
        </Button>
      </div>
    </div>
  );
}
