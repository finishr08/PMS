export default function Input({ label, id, className = "", ...props }) {
  return (
    <div className="w-full">
      {label && (
        <label
          htmlFor={id}
          className="mb-2 block text-sm font-semibold text-text-primary"
        >
          {label}
        </label>
      )}

      <input id={id} className={`app-input ${className}`} {...props} />
    </div>
  );
}
