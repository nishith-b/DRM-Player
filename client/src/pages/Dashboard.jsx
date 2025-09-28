import { useEffect, useRef, useState } from "react";
import Card from "../components/common/Card";
import Button from "../components/common/Button";
import { toast } from "react-hot-toast";

export default function Dashboard() {
  const [loading, setLoading] = useState(false);
  const hasShownToast = useRef(false); // Prevent duplicate toasts

  useEffect(() => {
    if (!hasShownToast.current) {
      toast.success("Welcome to your dashboard!");
      hasShownToast.current = true;
    }
  }, []);

  return (
    <div className="p-6">
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
