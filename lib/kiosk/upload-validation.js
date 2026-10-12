import { KIOSK_CONFIG } from "@/lib/kiosk/config";

export function validatePdfUpload(file) {
  if (!file || typeof file.name !== "string") {
    throw new Error("Please select a PDF document.");
  }

  if (!file.name.toLowerCase().endsWith(".pdf")) {
    throw new Error("Only PDF documents are allowed.");
  }

  if (file.type && file.type !== "application/pdf") {
    throw new Error("Invalid PDF content type.");
  }

  if (file.size <= 0) {
    throw new Error("The PDF document is empty.");
  }

  if (file.size > KIOSK_CONFIG.maxPdfSizeBytes) {
    throw new Error("PDF must be 50 MiB or smaller.");
  }

  // Keep names short and remove control characters.
  const originalName = file.name
    .replace(/[\x00-\x1F\x7F]/g, "")
    .replace(/[\\/]/g, "_")
    .slice(0, 200);

  if (!originalName) {
    throw new Error("Invalid PDF filename.");
  }

  return { originalName };
}
