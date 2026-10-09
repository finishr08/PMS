
export default function Button({
  children,
  variant = "primary",
  className = "",
  type = "button",
  ...props
}) {
  const variants = {
    primary: "btn-primary",
    secondary: "btn-secondary",
  };

  return (
    <button
      type={type}
      className={`
        ${variants[variant] || variants.primary}
        inline-flex min-h-12 items-center justify-center
        gap-2 px-6 text-sm font-semibold
        ${className}
      `}
      {...props}
    >
      {children}
    </button>
  );
}
