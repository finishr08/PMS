
import { forwardRef } from "react";

const Input = forwardRef(function Input(
  {
    label,
    id,
    icon: Icon,
    rightElement,
    className = "",
    ...props
  },
  ref
) {
  return (
    <div className="w-full">
      {label && (
        <label
          htmlFor={id}
          className="mb-2 block text-[13px] font-semibold text-text-primary"
        >
          {label}
        </label>
      )}

      <div className="relative">
        {Icon && (
          <Icon
            size={17}
            className="pointer-events-none absolute top-1/2 left-3.5 -translate-y-1/2 text-text-secondary"
          />
        )}

        <input
          id={id}
          ref={ref}
          className={`app-input h-11 w-full ${
            Icon ? "pl-10!" : ""
          } ${rightElement ? "pr-10!" : ""} ${className}`}
          {...props}
        />

        {rightElement && (
          <div className="absolute top-1/2 right-2.5 -translate-y-1/2">
            {rightElement}
          </div>
        )}
      </div>
    </div>
  );
});

export default Input;
