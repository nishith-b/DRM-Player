export default function Card({ title, children, footer }) {
  return (
    <div className="p-5 bg-white border border-gray-200 shadow-sm rounded-2xl">
      {title && (
        <h3 className="mb-3 text-lg font-semibold text-gray-800">{title}</h3>
      )}
      <div>{children}</div>
      {footer && <div className="pt-4 mt-4 border-t">{footer}</div>}
    </div>
  );
}
