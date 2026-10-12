"use client";

import Link from "next/link";
import { Printer, ShieldCheck, FileText } from "lucide-react";

export default function KioskLayout({ children, step = 1 }) {
  return (
    <div className="min-h-screen bg-[#F1F6FC] text-slate-900">
      <header className="bg-[#1467C8] text-white">
        <div className="mx-auto flex min-h-20 max-w-6xl items-center justify-between gap-4 px-5 py-4 md:px-8">
          <Link href="/" className="flex items-center gap-3">
            <span className="rounded-2xl bg-white/15 p-3">
              <Printer size={27} />
            </span>

            <span>
              <span className="block text-xl font-bold">PMS Print Kiosk</span>
              <span className="block text-xs text-blue-100">
                Self-Service Printing
              </span>
            </span>
          </Link>

          <span className="hidden items-center gap-2 rounded-full bg-white/15 px-4 py-2 text-sm font-medium sm:flex">
            <ShieldCheck size={17} />
            Private Customer Session
          </span>
        </div>
      </header>

      {step > 1 && (
        <div className="mx-auto max-w-6xl px-5 pt-6 md:px-8">
          <div className="flex items-center justify-between gap-3 text-sm font-semibold text-slate-500">
            <span>Printing process</span>
            <span>Step {step} of 6</span>
          </div>

          <div className="mt-3 grid grid-cols-6 gap-2">
            {Array.from({ length: 6 }, (_, i) => (
              <div
                key={i}
                className={`h-2 rounded-full ${
                  i + 1 <= step ? "bg-[#1467C8]" : "bg-slate-200"
                }`}
              />
            ))}
          </div>
        </div>
      )}

      <main className="mx-auto w-full max-w-6xl px-5 py-8 md:px-8 md:py-12">
        {children}
      </main>

      <footer className="mx-auto flex max-w-6xl items-center justify-center gap-2 px-5 pb-8 text-center text-sm text-slate-500">
        <FileText size={16} />
        PDF printing · A4, Letter and Legal
      </footer>
    </div>
  );
}
