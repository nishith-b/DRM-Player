const cls = (...c) => c.filter(Boolean).join(" ");

export default function Toggle({ checked, onChange, label, disabled }) {
  return (
    <button
      type="button"
      onClick={() => !disabled && onChange(!checked)}
      className={cls(
        "inline-flex items-center gap-2 rounded-full border px-3 py-1 transition",
        checked
          ? "bg-indigo-600 text-white border-indigo-600"
          : "bg-white text-gray-800 border-gray-300",
        disabled && "opacity-50 cursor-not-allowed"
      )}
      aria-pressed={checked}
    >
      <span
        className={cls(
          "h-4 w-4 rounded-full border",
          checked ? "bg-white border-white" : "bg-gray-200 border-gray-300"
        )}
      />
      <span className="text-sm font-medium">{label}</span>
    </button>
  );
}
