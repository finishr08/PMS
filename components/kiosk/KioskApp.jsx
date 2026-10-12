"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  FilePlus2,
  FileText,
  LoaderCircle,
  Printer,
  ShieldCheck,
  Trash2,
  UploadCloud,
  AlertCircle,
  ClipboardList,
  Settings2,
} from "lucide-react";

import KioskLayout from "./KioskLayout";

const STORAGE_KEY = "pms_kiosk_draft_v2";
const MAX_BYTES = 50 * 1024 * 1024;
const MAX_SESSION_BYTES = 250 * 1024 * 1024;
const MAX_FILES = 10;

const steps = {
  welcome: 1,
  select: 2,
  preview: 3,
  review: 4,
  printing: 5,
  finish: 6,
};

function formatBytes(bytes) {
  return `${(bytes / 1024 / 1024).toFixed(2)} MB`;
}

function readDraft() {
  try {
    const stored = sessionStorage.getItem(STORAGE_KEY);
    const parsed = stored ? JSON.parse(stored) : null;

    return parsed &&
      typeof parsed.sessionId === "string" &&
      Array.isArray(parsed.files)
      ? parsed
      : null;
  } catch {
    return null;
  }
}

function Button({
  children,
  onClick,
  disabled = false,
  secondary = false,
  className = "",
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={`inline-flex min-h-14 items-center justify-center gap-3 rounded-2xl px-7 py-4 text-base font-bold transition disabled:cursor-not-allowed disabled:opacity-50 ${
        secondary
          ? "border-2 border-[#1467C8] bg-white text-[#1467C8] hover:bg-blue-50"
          : "bg-[#1467C8] text-white shadow-sm hover:bg-[#0D56AC]"
      } ${className}`}
    >
      {children}
    </button>
  );
}

function Card({ children, className = "" }) {
  return (
    <section
      className={`rounded-3xl border border-blue-100 bg-white p-6 shadow-sm md:p-8 ${className}`}
    >
      {children}
    </section>
  );
}

function Message({ children, error = false }) {
  if (!children) return null;

  return (
    <div
      role={error ? "alert" : "status"}
      className={`flex items-start gap-2 rounded-2xl p-4 text-sm ${
        error ? "bg-red-50 text-red-700" : "bg-blue-50 text-blue-800"
      }`}
    >
      <AlertCircle size={18} className="shrink-0" />
      <span>{children}</span>
    </div>
  );
}

export default function KioskApp({ screen }) {
  const router = useRouter();

  const [sessionId, setSessionId] = useState(null);
  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [selectedFiles, setSelectedFiles] = useState([]);

  // Revalidate the session when visiting an internal screen.
  useEffect(() => {
    let alive = true;

    async function initialize() {
      if (screen === "welcome") {
        if (alive) setLoading(false);
        return;
      }

      try {
        const response = await fetch("/api/kiosk/sessions", {
          cache: "no-store",
        });

        if (!response.ok) {
          if (alive) router.replace("/");
          return;
        }

        const data = await response.json();
        const currentId = data.session.id;
        const saved = readDraft();

        if (!alive) return;

        setSessionId(currentId);

        if (saved?.sessionId === currentId) {
          setFiles(saved.files);
        } else {
          sessionStorage.setItem(
            STORAGE_KEY,
            JSON.stringify({
              sessionId: currentId,
              files: [],
            }),
          );
          setFiles([]);
        }
      } catch {
        if (alive) {
          setError("Could not connect to the kiosk server.");
        }
      } finally {
        if (alive) setLoading(false);
      }
    }

    initialize();

    return () => {
      alive = false;
    };
  }, [screen, router]);

  // Save UI draft metadata between page navigation.
  function updateFiles(nextFiles) {
    setFiles(nextFiles);

    if (sessionId) {
      sessionStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({
          sessionId,
          files: nextFiles,
        }),
      );
    }
  }

  function navigate(path) {
    setError("");
    setNotice("");
    router.push(path);
  }

  async function startSession() {
    setBusy(true);
    setError("");

    try {
      const response = await fetch("/api/kiosk/sessions", { method: "POST" });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || "Could not start session.");
      }

      const saved = readDraft();

      if (saved?.sessionId !== data.session.id) {
        sessionStorage.setItem(
          STORAGE_KEY,
          JSON.stringify({
            sessionId: data.session.id,
            files: [],
          }),
        );
      }

      router.push("/print");
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  async function uploadSelectedFiles() {
    if (!selectedFiles.length || !sessionId) return;

    setBusy(true);
    setError("");
    setNotice("");

    let workingFiles = [...files];
    let successful = 0;

    try {
      for (const file of selectedFiles) {
        if (!file.name.toLowerCase().endsWith(".pdf")) {
          throw new Error(`${file.name}: PDF files only.`);
        }

        if (file.size === 0 || file.size > MAX_BYTES) {
          throw new Error(`${file.name}: File must be 50 MiB or smaller.`);
        }

        if (workingFiles.length >= MAX_FILES) {
          throw new Error("Maximum 10 files per session.");
        }

        const usedBytes = workingFiles.reduce(
          (sum, item) => sum + item.sizeBytes,
          0,
        );

        if (usedBytes + file.size > MAX_SESSION_BYTES) {
          throw new Error("Maximum 250 MiB total per session.");
        }

        const formData = new FormData();
        formData.append("file", file);

        const response = await fetch("/api/kiosk/uploads", {
          method: "POST",
          body: formData,
        });

        const data = await response.json();

        if (!response.ok || !data.success) {
          throw new Error(data.error || `Could not upload ${file.name}`);
        }

        workingFiles = [
          ...workingFiles,
          {
            id: data.file.id,
            originalName: data.file.originalName,
            sizeBytes: data.file.sizeBytes,
            status: data.file.status,
            copies: 1,
            paperSize: "A4",
            pageRange: "all",
          },
        ];

        // Preserve each successful upload immediately.
        updateFiles(workingFiles);
        successful++;
      }

      setNotice(`${successful} PDF document(s) uploaded successfully.`);
    } catch (err) {
      setError(err.message);
    } finally {
      setSelectedFiles([]);
      setBusy(false);
    }
  }

  function updateSetting(fileId, key, value) {
    updateFiles(
      files.map((file) =>
        file.id === fileId ? { ...file, [key]: value } : file,
      ),
    );
  }

  async function endSession() {
    if (!sessionId) {
      router.replace("/");
      return;
    }

    setBusy(true);
    setError("");

    try {
      const response = await fetch(`/api/kiosk/sessions/${sessionId}/end`, {
        method: "POST",
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || "Could not end session.");
      }

      sessionStorage.removeItem(STORAGE_KEY);
      setFiles([]);
      setSessionId(null);
      router.replace("/");
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  if (loading) {
    return (
      <KioskLayout step={steps[screen]}>
        <div className="flex min-h-80 items-center justify-center gap-3 text-slate-600">
          <LoaderCircle className="animate-spin" size={28} />
          Loading kiosk...
        </div>
      </KioskLayout>
    );
  }

  return (
    <KioskLayout step={steps[screen]}>
      {screen === "welcome" && (
        <div className="mx-auto max-w-3xl py-8 text-center">
          <div className="mx-auto flex h-28 w-28 items-center justify-center rounded-4xl bg-blue-100 text-[#1467C8]">
            <Printer size={55} strokeWidth={1.8} />
          </div>

          <h1 className="mt-8 text-4xl font-extrabold tracking-tight md:text-6xl">
            Welcome to
            <span className="block text-[#1467C8]">Self-Service Printing</span>
          </h1>

          <p className="mx-auto mt-6 max-w-xl text-lg text-slate-600">
            Upload your PDF documents, choose your print settings, and get ready
            to print in a few steps.
          </p>

          <div className="mt-10">
            <Button
              onClick={startSession}
              disabled={busy}
              className="w-full max-w-sm text-xl"
            >
              {busy ? <LoaderCircle className="animate-spin" /> : <Printer />}
              Start Printing
              <ArrowRight />
            </Button>
          </div>

          <div className="mx-auto mt-10 grid max-w-xl gap-3 sm:grid-cols-2">
            <div className="rounded-2xl bg-white p-5">
              <FileText className="mx-auto mb-2 text-[#1467C8]" />
              <p className="font-semibold">PDF Documents</p>
              <p className="text-sm text-slate-500">Up to 50 MiB per file</p>
            </div>

            <div className="rounded-2xl bg-white p-5">
              <ShieldCheck className="mx-auto mb-2 text-[#1467C8]" />
              <p className="font-semibold">No Login Needed</p>
              <p className="text-sm text-slate-500">
                Private temporary session
              </p>
            </div>
          </div>

          <div className="mt-5">
            <Message error>{error}</Message>
          </div>
        </div>
      )}

      {screen === "select" && (
        <div className="space-y-6">
          <div>
            <h1 className="text-3xl font-extrabold md:text-4xl">
              Select Your Documents
            </h1>
            <p className="mt-2 text-slate-600">
              Add one or more PDF files to your printing session.
            </p>
          </div>

          <Card>
            <div className="rounded-3xl border-2 border-dashed border-blue-200 bg-blue-50 p-8 text-center">
              <UploadCloud size={52} className="mx-auto text-[#1467C8]" />
              <h2 className="mt-4 text-xl font-bold">Upload PDF Documents</h2>

              <p className="mt-2 text-sm text-slate-600">
                Up to 50 MiB each · 10 files · 250 MiB total
              </p>

              <input
                type="file"
                accept=".pdf,application/pdf"
                multiple
                disabled={busy}
                onChange={(event) => {
                  setSelectedFiles(Array.from(event.target.files || []));
                  event.target.value = "";
                }}
                className="mt-6 block w-full cursor-pointer rounded-xl border border-slate-200 bg-white p-3 text-sm file:mr-4 file:rounded-lg file:border-0 file:bg-blue-100 file:px-4 file:py-2 file:font-semibold file:text-blue-700"
              />

              {selectedFiles.length > 0 && (
                <p className="mt-3 text-sm font-medium">
                  {selectedFiles.length} file(s) selected
                </p>
              )}

              <Button
                onClick={uploadSelectedFiles}
                disabled={busy || selectedFiles.length === 0}
                className="mt-5"
              >
                {busy ? (
                  <LoaderCircle className="animate-spin" />
                ) : (
                  <FilePlus2 />
                )}
                {busy ? "Uploading..." : "Upload Selected Files"}
              </Button>

              <p className="mt-4 text-xs text-slate-500">
                Uploads are sent one file at a time.
              </p>
            </div>
          </Card>

          <Card>
            <div className="mb-5 flex items-center justify-between gap-3">
              <h2 className="text-xl font-bold">Uploaded Documents</h2>
              <span className="rounded-full bg-blue-100 px-4 py-2 text-sm font-semibold text-blue-700">
                {files.length} / {MAX_FILES}
              </span>
            </div>

            {files.length === 0 ? (
              <div className="py-8 text-center text-slate-500">
                <FileText size={42} className="mx-auto mb-3 opacity-40" />
                No PDF documents uploaded yet.
              </div>
            ) : (
              <div className="space-y-3">
                {files.map((file, index) => (
                  <div
                    key={file.id}
                    className="flex flex-wrap items-center gap-4 rounded-2xl border border-slate-200 p-4"
                  >
                    <div className="rounded-xl bg-blue-50 p-3 text-blue-700">
                      <FileText />
                    </div>

                    <div className="min-w-0 flex-1">
                      <p className="break-all font-semibold">
                        {index + 1}. {file.originalName}
                      </p>
                      <p className="mt-1 text-sm text-slate-500">
                        {formatBytes(file.sizeBytes)}
                      </p>
                    </div>

                    <span className="inline-flex items-center gap-1 text-sm font-semibold text-green-700">
                      <CheckCircle2 size={17} />
                      Uploaded
                    </span>
                  </div>
                ))}
              </div>
            )}

            <p className="mt-5 text-right text-sm text-slate-500">
              Total:{" "}
              {formatBytes(
                files.reduce((sum, file) => sum + file.sizeBytes, 0),
              )}
            </p>
          </Card>

          <Message error={Boolean(error)}>{error || notice}</Message>

          <div className="flex flex-wrap justify-between gap-4">
            <Button secondary onClick={() => navigate("/")}>
              <ArrowLeft /> Back
            </Button>

            <Button
              disabled={busy || files.length === 0}
              onClick={() => navigate("/preview")}
            >
              Continue <ArrowRight />
            </Button>
          </div>

          <p className="text-sm text-slate-500">
            Document removal and replacement will be connected to a secure
            server-side delete endpoint later.
          </p>
        </div>
      )}

      {screen === "preview" && (
        <div className="space-y-6">
          <div>
            <h1 className="text-3xl font-extrabold md:text-4xl">
              Preview & Print Settings
            </h1>
            <p className="mt-2 text-slate-600">
              Choose settings for each uploaded document.
            </p>
          </div>

          <Message>
            PDF page rendering and verified page ranges will be enabled in Step
            8.
          </Message>

          {files.map((file) => (
            <Card key={file.id}>
              <div className="mb-6 flex items-start gap-3">
                <FileText className="mt-1 shrink-0 text-blue-700" />

                <div className="min-w-0">
                  <h2 className="break-all text-xl font-bold">
                    {file.originalName}
                  </h2>
                  <p className="text-sm text-slate-500">
                    {formatBytes(file.sizeBytes)}
                  </p>
                </div>
              </div>

              <div className="grid gap-5 md:grid-cols-2">
                <div className="flex min-h-56 flex-col items-center justify-center rounded-2xl bg-slate-100 p-6 text-center text-slate-500">
                  <FileText size={54} />
                  <p className="mt-3 font-semibold">PDF Preview</p>
                  <p className="mt-1 text-sm">Available after Step 8</p>
                </div>

                <div className="space-y-5">
                  <div className="flex items-center gap-2 text-blue-700">
                    <Settings2 size={19} />
                    <h3 className="font-bold">Print Settings</h3>
                  </div>

                  <label className="block">
                    <span className="mb-2 block font-semibold">Copies</span>
                    <select
                      value={file.copies}
                      onChange={(event) =>
                        updateSetting(
                          file.id,
                          "copies",
                          Number(event.target.value),
                        )
                      }
                      className="min-h-12 w-full rounded-xl border border-slate-300 bg-white px-4"
                    >
                      {Array.from({ length: 20 }, (_, i) => i + 1).map(
                        (value) => (
                          <option key={value} value={value}>
                            {value}
                          </option>
                        ),
                      )}
                    </select>
                  </label>

                  <label className="block">
                    <span className="mb-2 block font-semibold">Paper Size</span>
                    <select
                      value={file.paperSize}
                      onChange={(event) =>
                        updateSetting(file.id, "paperSize", event.target.value)
                      }
                      className="min-h-12 w-full rounded-xl border border-slate-300 bg-white px-4"
                    >
                      <option value="A4">A4</option>
                      <option value="Letter">Letter</option>
                      <option value="Legal">Legal</option>
                    </select>
                  </label>

                  <div className="rounded-xl bg-blue-50 px-4 py-3 text-sm text-blue-800">
                    Page selection: All pages. Custom ranges come in Step 8.
                  </div>
                </div>
              </div>
            </Card>
          ))}

          {files.length === 0 && (
            <Message>
              No documents are selected. Go back and upload a PDF.
            </Message>
          )}

          <div className="flex flex-wrap justify-between gap-4">
            <Button secondary onClick={() => navigate("/print")}>
              <ArrowLeft /> Back
            </Button>

            <Button
              disabled={files.length === 0}
              onClick={() => navigate("/review")}
            >
              Apply & Continue <ArrowRight />
            </Button>
          </div>
        </div>
      )}

      {screen === "review" && (
        <div className="space-y-6">
          <div>
            <h1 className="text-3xl font-extrabold md:text-4xl">
              Ready to Print
            </h1>
            <p className="mt-2 text-slate-600">
              Review your documents before printing.
            </p>
          </div>

          <Card>
            <div className="mb-6 flex items-center gap-3">
              <ClipboardList className="text-blue-700" />
              <h2 className="text-xl font-bold">Your Print Summary</h2>
            </div>

            {files.length === 0 ? (
              <p className="text-slate-500">No documents selected.</p>
            ) : (
              <div className="space-y-3">
                {files.map((file, index) => (
                  <div
                    key={file.id}
                    className="rounded-2xl border border-slate-200 p-5"
                  >
                    <p className="break-all text-lg font-bold">
                      {index + 1}. {file.originalName}
                    </p>

                    <div className="mt-3 flex flex-wrap gap-3 text-sm">
                      <span className="rounded-full bg-blue-50 px-3 py-2 text-blue-800">
                        {file.copies} {file.copies === 1 ? "copy" : "copies"}
                      </span>
                      <span className="rounded-full bg-blue-50 px-3 py-2 text-blue-800">
                        {file.paperSize}
                      </span>
                      <span className="rounded-full bg-blue-50 px-3 py-2 text-blue-800">
                        All pages
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}

            <div className="mt-6 rounded-2xl bg-blue-50 p-5">
              <p className="text-lg font-bold text-blue-900">
                {files.length} document(s)
              </p>
              <p className="mt-1 text-sm text-blue-700">
                Page counts and print totals will be verified before submission
                is enabled.
              </p>
            </div>
          </Card>

          <Message>
            Print submission is not connected yet. The Print Now button will be
            activated in Step 9.
          </Message>

          <div className="flex flex-wrap justify-between gap-4">
            <Button secondary onClick={() => navigate("/preview")}>
              <ArrowLeft /> Back
            </Button>

            <Button disabled>
              <Printer />
              Print Now
            </Button>
          </div>
        </div>
      )}

      {screen === "printing" && (
        <Card className="mx-auto max-w-2xl text-center">
          <div className="mx-auto flex h-24 w-24 items-center justify-center rounded-3xl bg-blue-100 text-blue-700">
            <Printer size={46} />
          </div>

          <h1 className="mt-7 text-3xl font-extrabold">Printing Status</h1>

          <p className="mt-4 text-slate-600">
            Live printing status will appear here after the print-batch API is
            connected.
          </p>

          <Message>
            No print job has been submitted by this new kiosk interface yet.
          </Message>

          <div className="mt-8">
            <Button secondary onClick={() => navigate("/review")}>
              <ArrowLeft /> Back to Review
            </Button>
          </div>
        </Card>
      )}

      {screen === "finish" && (
        <Card className="mx-auto max-w-2xl text-center">
          <div className="mx-auto flex h-24 w-24 items-center justify-center rounded-3xl bg-blue-100 text-blue-700">
            <CheckCircle2 size={48} />
          </div>

          <h1 className="mt-7 text-3xl font-extrabold">Finish Your Session</h1>

          <p className="mt-4 text-slate-600">Thank you for using the kiosk.</p>

          <p className="mt-3 text-sm text-slate-500">
            The document collection confirmation will be connected after live
            printing is implemented.
          </p>

          <div className="mt-8">
            <Button
              onClick={endSession}
              disabled={busy}
              className="w-full max-w-xs"
            >
              {busy ? (
                <LoaderCircle className="animate-spin" />
              ) : (
                <CheckCircle2 />
              )}
              End Session
            </Button>
          </div>

          <div className="mt-5">
            <Message error>{error}</Message>
          </div>
        </Card>
      )}
    </KioskLayout>
  );
}
