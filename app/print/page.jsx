import Link from "next/link";
import { ArrowLeft, Printer } from "lucide-react";

import PageContainer from "@/components/ui/PageContainer";

export const metadata = {
  title: "Print Document | PMS",
};

export default function PrintPage() {
  return (
    <PageContainer className="max-w-lg">
      <div className="app-card p-10 text-center">
        <Printer size={44} className="mx-auto text-primary" />

        <h1 className="mt-5 text-2xl font-bold text-text-primary">
          Print Document
        </h1>

        <p className="mt-3 text-sm text-text-secondary">
          The document printing form will be built in Step 3.3.
        </p>

        <Link
          href="/"
          className="btn-secondary mt-6 inline-flex min-h-11 items-center gap-2 px-5"
        >
          <ArrowLeft size={17} />
          Back to Welcome
        </Link>
      </div>
    </PageContainer>
  );
}
