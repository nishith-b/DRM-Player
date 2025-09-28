const cls = (...c) => c.filter(Boolean).join(" ");

export default function Button({
  children,
  onClick,
  type = "button",
  variant = "primary",
  disabled,
}) {
  const base =
    "rounded-2xl px-4 py-2 font-medium shadow-sm transition hover:shadow disabled:opacity-50 disabled:cursor-not-allowed";
  const styles = {
    primary: "bg-indigo-600 text-white hover:bg-indigo-700",
    ghost: "bg-white text-gray-800 border border-gray-300 hover:bg-gray-50",
    danger: "bg-red-600 text-white hover:bg-red-700",
  };
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={cls(base, styles[variant])}
    >
      {children}
    </button>
  );
}
