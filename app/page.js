import { Suspense } from "react";
import { redirect } from "next/navigation";

import { auth } from "@/lib/auth";
import WelcomeCard from "@/components/home/WelcomeCard";
import LogoutButton from "@/components/auth/LogoutButton";

export const metadata = {
  title: "Welcome | Printing Management System",
};

// Authentication happens inside this component
async function ProtectedHome() {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  return (
    <>
      <WelcomeCard />

      <div className="fixed bottom-6 right-6 z-20">
        <LogoutButton />
      </div>
    </>
  );
}

// Suspense wraps the authentication check
export default function HomePage() {
  return (
    <Suspense
      fallback={
        <div className="app-background flex min-h-screen items-center justify-center">
          <p className="text-sm text-text-secondary">Loading...</p>
        </div>
      }
    >
      <ProtectedHome />
    </Suspense>
  );
}
