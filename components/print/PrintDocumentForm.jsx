"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Printer, Info } from "lucide-react";

import PageContainer from "@/components/ui/PageContainer";
import DocumentUpload from "./DocumentUpload";
import CopiesSelector from "./CopiesSelector";
import PageSelector from "./PageSelector";
import PaperSizeSelector from "./PaperSizeSelector";
import PrintSummary from "./PrintSummary";

function parsePageRange(input, totalPages) {
  if (!Number.isInteger(totalPages) || totalPages < 1) {
    throw new Error("Please select a PDF first.");
  }

  if (!input.trim()) {
    throw new Error("Enter a page range.");
  }

  const pages = new Set();
  const parts = input.split(",");

  for (const part of parts) {
    const match = part.trim().match(/^(\d+)(?:\s*-\s*(\d+))?$/);

    if (!match) {
      throw new Error("Use a range like 1-3, 5, 8-10.");
    }

    const start = Number(match[1]);
    const end = match[2] ? Number(match[2]) : start;

    if (start < 1 || end > totalPages || start > end) {
      throw new Error(`Choose pages between 1 and ${totalPages}.`);
    }

    for (let page = start; page <= end; page++) {
      pages.add(page);
    }
  }

  return [...pages].sort((a, b) => a - b);
}

export default function PrintDocumentForm() {
  const [documentFile, setDocumentFile] = useState(null);
  const [copies, setCopies] = useState(1);
  const [pageMode, setPageMode] = useState("all");
  const [pageRange, setPageRange] = useState("");
  const [paperSize, setPaperSize] = useState("A4");
  const [showDemoNotice, setShowDemoNotice] = useState(false);

  const pageResult = useMemo(() => {
    if (!documentFile) {
      return { pages: [], error: "" };
    }

    if (pageMode === "all") {
      return {
        pages: Array.from(
          { length: documentFile.pages },
          (_, index) => index + 1,
        ),
        error: "",
      };
    }

    try {
      return {
        pages: parsePageRange(pageRange, documentFile.pages),
        error: "",
      };
    } catch (error) {
      return {
        pages: [],
        error: error.message,
      };
    }
  }, [documentFile, pageMode, pageRange]);

  const pagesPerCopy = documentFile
    ? pageResult.error
      ? null
      : pageResult.pages.length
    : null;

  const totalSheets = pagesPerCopy === null ? null : pagesPerCopy * copies;

  const canPrint = !!documentFile && !pageResult.error && pagesPerCopy > 0;

  function handleFileChange(nextFile) {
    setDocumentFile(nextFile);
    setPageMode("all");
    setPageRange("");
    setShowDemoNotice(false);
  }

  function handleDemoPrint() {
    if (!canPrint) return;

    // Frontend only: no API request or printer action.
    setShowDemoNotice(true);
  }

  return (
    <PageContainer className="max-w-265">
      <section className="app-card w-full px-5 py-8 sm:px-8 lg:px-10">
        {/* Header */}
        <header className="mb-9 text-center">
          <div className="mx-auto flex h-19 w-19 items-center justify-center rounded-full bg-primary-light">
            <Printer size={40} strokeWidth={1.8} className="text-primary" />
          </div>

          <h1 className="mt-4 text-2xl font-bold text-text-primary">
            Print Document
          </h1>

          <p className="mt-2 text-sm text-text-secondary">
            Choose your PDF and print settings
          </p>
        </header>

        {/* Main content */}
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-[minmax(0,1fr)_290px]">
          {/* Form controls */}
          <div className="min-w-0 space-y-7">
            <DocumentUpload
              file={documentFile}
              onFileChange={handleFileChange}
            />

            <CopiesSelector copies={copies} onChange={setCopies} />

            <PageSelector
              pageMode={pageMode}
              setPageMode={setPageMode}
              pageRange={pageRange}
              setPageRange={setPageRange}
              error={pageResult.error}
            />

            <PaperSizeSelector
              paperSize={paperSize}
              setPaperSize={setPaperSize}
            />
          </div>

          {/* Right summary */}
          <PrintSummary
            pagesPerCopy={pagesPerCopy}
            copies={copies}
            totalSheets={totalSheets}
          />
        </div>

        {/* Bottom Action Buttons */}
        <footer className="mt-8 border-t border-border pt-5">
          {showDemoNotice && (
            <div
              role="status"
              className="mb-5 rounded-lg border border-blue-200 bg-blue-50 p-4 text-sm text-blue-800"
            >
              Frontend preview only. No print job has been sent.
            </div>
          )}

          <div className="flex items-center justify-end gap-3">
            {/* Cancel */}
            <Link
              href="/"
              className="inline-flex h-11 min-w-27.5 items-center justify-center rounded-lg border border-border bg-white px-5 text-sm font-medium text-text-secondary transition-colors hover:bg-slate-50"
            >
              Cancel
            </Link>

            {/* Print */}
            <button
              type="button"
              onClick={handleDemoPrint}
              disabled={!canPrint}
              className="inline-flex h-11 min-w-32.5 flex-row items-center justify-center gap-2 whitespace-nowrap rounded-lg bg-[#2583F5] px-6 text-sm font-semibold text-white transition-colors hover:bg-[#1668DA] disabled:cursor-not-allowed disabled:opacity-50"
            >
              <Printer size={17} className="shrink-0" />
              <span>Print</span>
            </button>
          </div>
        </footer>
      </section>
    </PageContainer>
  );
}
