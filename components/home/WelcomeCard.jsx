import Link from "next/link";
import { Printer, FileText } from "lucide-react";

import PageContainer from "@/components/ui/PageContainer";
import Button from "@/components/ui/Button";
import PrinterStatus from "./PrinterStatus";
import LiveClock from "./LiveClock";

export default function WelcomeCard() {
  return (
    <PageContainer className="max-w-130">
      {/* Live clock */}
      <LiveClock />

      {/* Welcome card */}
      <section className="app-card w-full px-7 py-12 text-center sm:px-12 sm:py-14">
        {/* Printer icon */}
        <div className="mx-auto flex h-22.5 w-22.5 items-center justify-center rounded-full bg-primary-light">
          <Printer size={48} strokeWidth={1.8} className="text-primary" />
        </div>

        {/* Heading */}
        <h1 className="mt-7 text-[34px] font-bold tracking-tight text-text-primary">
          Welcome
        </h1>

        {/* Subtitle */}
        <p className="mt-2 text-[15px] text-text-secondary">
          Ready to print your documents
        </p>

        {/* Printer status */}
        <div className="mt-9">
          <PrinterStatus />
        </div>

        {/* Print button */}
        <Link href="/print" className="mt-5 block">
          <Button className="pointer-events-none w-full gap-2.5">
            <FileText size={19} />
            <span>Print Document</span>
          </Button>
        </Link>

        {/* Helper text */}
        <p className="mt-4 text-[13px] text-text-secondary">
          Upload and print PDF files
        </p>
      </section>
    </PageContainer>
  );
}
