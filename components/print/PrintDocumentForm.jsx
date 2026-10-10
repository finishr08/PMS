"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Printer } from "lucide-react";

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

    if (
      !Number.isSafeInteger(start) ||
      !Number.isSafeInteger(end) ||
      start < 1 ||
      end > totalPages ||
      start > end
    ) {
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

  // Backend submission states
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [printError, setPrintError] = useState("");
  const [createdJob, setCreatedJob] = useState(null);

  // Validate and calculate pages
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

  // Clear previous submission messages
  function resetSubmission() {
    setPrintError("");
    setCreatedJob(null);
  }

  // Handle selected PDF
  function handleFileChange(nextFile) {
    setDocumentFile(nextFile);
    setPageMode("all");
    setPageRange("");
    resetSubmission();
  }

  function handleCopiesChange(value) {
    setCopies(value);
    resetSubmission();
  }

  function handlePageModeChange(value) {
    setPageMode(value);
    resetSubmission();
  }

  function handlePageRangeChange(value) {
    setPageRange(value);
    resetSubmission();
  }

  function handlePaperSizeChange(value) {
    setPaperSize(value);
    resetSubmission();
  }

  // Submit PDF and print settings to backend
  async function handlePrint() {
    if (!canPrint || isSubmitting || createdJob) return;

    setIsSubmitting(true);
    setPrintError("");

    try {
      const formData = new FormData();

      formData.append("file", documentFile.file);
      formData.append("copies", String(copies));
      formData.append("pageMode", pageMode);
      formData.append("pageRange", pageRange);
      formData.append("paperSize", paperSize);

      const response = await fetch("/api/print", {
        method: "POST",
        body: formData,
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.error || "Failed to create print job.");
      }

      setCreatedJob(result.job);
    } catch (error) {
      setPrintError(error.message || "Something went wrong.");
    } finally {
      setIsSubmitting(false);
    }
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

            <CopiesSelector copies={copies} onChange={handleCopiesChange} />

            <PageSelector
              pageMode={pageMode}
              setPageMode={handlePageModeChange}
              pageRange={pageRange}
              setPageRange={handlePageRangeChange}
              error={pageResult.error}
            />

            <PaperSizeSelector
              paperSize={paperSize}
              setPaperSize={handlePaperSizeChange}
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
          {/* Successful backend submission */}
          {createdJob && (
            <div
              role="status"
              className="mb-5 rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700"
            >
              <p className="font-semibold">Print job created successfully!</p>

              <p className="mt-1 text-xs">Job ID: {createdJob.id}</p>

              <p className="mt-1 text-xs">Status: {createdJob.status}</p>

              <p className="mt-1 text-xs">
                Document prepared. Awaiting printer integration.
              </p>
            </div>
          )}

          {/* Backend error */}
          {printError && (
            <div
              role="alert"
              className="mb-5 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600"
            >
              {printError}
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
              onClick={handlePrint}
              disabled={!canPrint || isSubmitting || !!createdJob}
              className="inline-flex h-11 min-w-32.5 flex-row items-center justify-center gap-2 whitespace-nowrap rounded-lg bg-[#2583F5] px-6 text-sm font-semibold text-white transition-colors hover:bg-[#1668DA] disabled:cursor-not-allowed disabled:opacity-50"
            >
              <Printer size={17} className="shrink-0" />

              <span>
                {isSubmitting
                  ? "Processing..."
                  : createdJob
                    ? "Queued"
                    : "Print"}
              </span>
            </button>
          </div>
        </footer>
      </section>
    </PageContainer>
  );
}
