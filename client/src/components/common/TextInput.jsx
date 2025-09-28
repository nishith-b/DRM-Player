export default function TextInput({
  label,
  type = "text",
  value,
  onChange,
  name,
  placeholder,
  required,
  autoComplete,
}) {
  return (
    <label className="block">
      <span className="text-sm font-medium text-gray-700">{label}</span>
      <input
        className="w-full px-4 py-2 mt-1 border border-gray-300 outline-none rounded-2xl focus:ring-2 focus:ring-indigo-500"
        type={type}
        name={name}
        placeholder={placeholder}
        value={value}
        onChange={onChange}
        required={required}
        autoComplete={autoComplete}
      />
    </label>
  );
}
