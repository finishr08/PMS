export default function PageContainer({ children, className = "" }) {
  return (
    <main className="app-background flex min-h-screen items-center justify-center px-4 py-10 sm:px-6">
      <div className={`relative z-10 w-full ${className}`}>{children}</div>
    </main>
  );
}
