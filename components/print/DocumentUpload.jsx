
"use client";

import { useRef, useState } from "react";
import { FileText, FolderOpen } from "lucide-react";

const MAX_FILE_SIZE = 25 * 1024 * 1024;

export default function DocumentUpload({
  file,
  onFileChange,
}) {
  const inputRef = useRef(null);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleFileChange(event) {
    const selected = event.target.files?.[0];

    // Allows selecting the same file again
    event.target.value = "";

    if (!selected) return;

    setError("");

    // Validate file extension
    const isPdf =
      selected.name.toLowerCase().endsWith(".pdf") &&
      (!selected.type ||
        selected.type === "application/pdf");

    if (!isPdf) {
      setError("Please select a valid PDF file.");
      return;
    }

    // Check empty file
    if (selected.size === 0) {
      setError("The selected PDF file is empty.");
      return;
    }

    // Maximum 25 MB
    if (selected.size > MAX_FILE_SIZE) {
      setError("Maximum PDF file size is 25 MB.");
      return;
    }

    setLoading(true);

    let loadingTask = null;

    try {
      // Dynamically import PDF.js in the browser
      const pdfjs = await import("pdfjs-dist");

      // Use worker stored in the public folder
      pdfjs.GlobalWorkerOptions.workerSrc =
        "/pdf.worker.min.mjs";

      // Read selected PDF as bytes
      const arrayBuffer = await selected.arrayBuffer();

      const data = new Uint8Array(arrayBuffer);

      // Check basic PDF signature
      const signature = new TextDecoder("ascii").decode(
        data.slice(0, 5)
      );

      if (signature !== "%PDF-") {
        throw new Error(
          "The selected file is not a valid PDF."
        );
      }

      // Load PDF
      loadingTask = pdfjs.getDocument({
        data,
      });

      const pdf = await loadingTask.promise;

      // Extract total page count
      const pages = pdf.numPages;

      if (!pages || pages < 1) {
        throw new Error(
          "This PDF does not contain any pages."
        );
      }

      // Release PDF.js resources
      await loadingTask.destroy();
      loadingTask = null;

      // Pass the selected document to parent
      onFileChange({
        file: selected,
        name: selected.name,
        size: selected.size,
        pages,
      });

      console.log("PDF loaded successfully:", {
        name: selected.name,
        pages,
        size: selected.size,
      });
    } catch (err) {
      console.error("PDF loading error:", err);

      if (err?.name === "PasswordException") {
        setError(
          "This PDF is password protected. Please select an unlocked PDF."
        );
      } else {
        setError(
          err?.message ||
            "Unable to read this PDF. Try another file."
        );
      }
    } finally {
      if (loadingTask) {
        try {
          await loadingTask.destroy();
        } catch {
          // Ignore cleanup errors
        }
      }

      setLoading(false);
    }
  }

  return (
    <div>
      {/* Heading */}
      <h2 className="mb-3 text-sm font-semibold text-text-primary">
        Document
      </h2>

      {/* Hidden file input */}
      <input
        ref={inputRef}
        type="file"
        accept=".pdf,application/pdf"
        onChange={handleFileChange}
        className="hidden"
        aria-label="Choose PDF document"
      />

      {/* Upload box */}
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border bg-white p-4">
        {/* File information */}
        <div className="flex min-w-0 flex-1 items-center gap-3">
          {/* PDF icon */}
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-red-50">
            <FileText
              size={24}
              className="text-red-500"
            />
          </div>

          {/* File details */}
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-text-primary">
              {file
                ? file.name
                : "No document selected"}
            </p>

            <p className="mt-1 text-xs text-text-secondary">
              {file
                ? `${file.pages} pages • ${(
                    file.size /
                    1024 /
                    1024
                  ).toFixed(2)} MB`
                : "PDF files only • Maximum 25 MB"}
            </p>
          </div>
        </div>

        {/* Choose PDF button */}
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={loading}
          className="inline-flex shrink-0 cursor-pointer items-center gap-2 rounded-lg bg-primary-light px-4 py-2.5 text-xs font-semibold text-primary transition-colors hover:bg-blue-100 disabled:cursor-not-allowed disabled:opacity-50"
        >
          <FolderOpen size={16} />

          <span>
            {loading ? "Reading..." : "Choose PDF"}
          </span>
        </button>
      </div>

      {/* Error message */}
      {error && (
        <p
          role="alert"
          className="mt-2 text-xs text-error"
        >
          {error}
        </p>
      )}
    </div>
  );
}
