"use client";

import { useRef, useState } from "react";
import { FileText, FolderOpen } from "lucide-react";

export default function DocumentUpload({ file, onFileChange }) {
  const inputRef = useRef(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleFileChange(event) {
    const selected = event.target.files?.[0];
    event.target.value = "";

    if (!selected) return;

    setError("");

    const isPdf =
      selected.type === "application/pdf" ||
      selected.name.toLowerCase().endsWith(".pdf");

    if (!isPdf) {
      setError("Please select a PDF file.");
      return;
    }

    if (selected.size > 25 * 1024 * 1024) {
      setError("Maximum file size is 25 MB.");
      return;
    }

    setLoading(true);

    try {
      const pdfjs = await import("pdfjs-dist");

      pdfjs.GlobalWorkerOptions.workerSrc = new URL(
        "pdfjs-dist/build/pdf.worker.min.mjs",
        import.meta.url,
      ).toString();

      const data = new Uint8Array(await selected.arrayBuffer());

      const task = pdfjs.getDocument({ data });
      const pdf = await task.promise;

      const pages = pdf.numPages;

      await pdf.destroy();

      onFileChange({
        file: selected,
        name: selected.name,
        size: selected.size,
        pages,
      });
    } catch {
      setError("Unable to read this PDF. Try another file.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      <h2 className="mb-3 text-sm font-semibold text-text-primary">Document</h2>

      <input
        ref={inputRef}
        type="file"
        accept=".pdf,application/pdf"
        onChange={handleFileChange}
        className="hidden"
        aria-label="Choose PDF document"
      />

      <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border bg-white p-4">
        <div className="flex min-w-0 items-center gap-3">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-red-50">
            <FileText size={24} className="text-red-500" />
          </div>

          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-text-primary">
              {file ? file.name : "No document selected"}
            </p>

            <p className="mt-1 text-xs text-text-secondary">
              {file
                ? `${file.pages} pages • ${(file.size / 1024 / 1024).toFixed(2)} MB`
                : "PDF files only • Maximum 25 MB"}
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={loading}
          className="inline-flex cursor-pointer items-center gap-2 rounded-lg bg-primary-light px-4 py-2.5 text-xs font-semibold text-primary transition-colors hover:bg-blue-100 disabled:opacity-50"
        >
          <FolderOpen size={16} />
          {loading ? "Reading..." : "Choose PDF"}
        </button>
      </div>

      {error && (
        <p role="alert" className="mt-2 text-xs text-error">
          {error}
        </p>
      )}
    </div>
  );
}
