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
      className={`${variants[variant] || variants.primary} min-h-12 px-6 ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}
