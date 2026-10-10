import { Suspense } from "react";
import { redirect } from "next/navigation";

import { auth } from "@/lib/auth";
import LoginForm from "@/components/auth/LoginForm";

export const metadata = {
  title: "Login | Printing Management System",
};

async function LoginContent() {
  const session = await auth();

  if (session?.user) {
    redirect("/");
  }

  return <LoginForm />;
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="app-background flex min-h-screen items-center justify-center">
          <p className="text-sm text-text-secondary">Loading login...</p>
        </div>
      }
    >
      <LoginContent />
    </Suspense>
  );
}
