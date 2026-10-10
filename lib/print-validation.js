export const MAX_PDF_SIZE = 25 * 1024 * 1024;

export function validatePrintOptions(data) {
  const copies = Number(data.copies);

  if (!Number.isInteger(copies) || copies < 1 || copies > 100) {
    throw new Error("Copies must be between 1 and 100.");
  }

  if (!["A4", "Letter", "Legal"].includes(data.paperSize)) {
    throw new Error("Unsupported paper size.");
  }

  if (!["all", "custom"].includes(data.pageMode)) {
    throw new Error("Invalid page selection.");
  }

  if (typeof data.pageRange !== "string" || data.pageRange.length > 500) {
    throw new Error("Invalid page range.");
  }

  return { copies, paperSize: data.paperSize };
}

export function getSelectedPages(mode, range, totalPages) {
  if (mode === "all") {
    return Array.from({ length: totalPages }, (_, i) => i);
  }

  if (!range.trim()) {
    throw new Error("Enter a custom page range.");
  }

  const pages = new Set();

  for (const part of range.split(",")) {
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
      start > end ||
      end > totalPages
    ) {
      throw new Error(`Choose pages between 1 and ${totalPages}.`);
    }

    for (let page = start; page <= end; page++) {
      pages.add(page - 1);
    }
  }

  return [...pages].sort((a, b) => a - b);
}
