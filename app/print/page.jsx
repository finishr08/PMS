import { Suspense } from "react";
import { redirect } from "next/navigation";

import { auth } from "@/lib/auth";
import PrintDocumentForm from "@/components/print/PrintDocumentForm";

export const metadata = {
  title: "Print Document | PMS",
};

// Protected print page
async function ProtectedPrint() {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  return <PrintDocumentForm />;
}

// Page with Suspense
export default function PrintPage() {
  return (
    <Suspense
      fallback={
        <div className="app-background flex min-h-screen items-center justify-center">
          <p className="text-sm text-text-secondary">Loading print page...</p>
        </div>
      }
    >
      <ProtectedPrint />
    </Suspense>
  );
}
