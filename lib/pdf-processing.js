
import { PDFDocument } from "pdf-lib";
import { getSelectedPages } from "@/lib/print-validation";

export async function processPdf(buffer, pageMode, pageRange) {
  if (buffer.subarray(0, 5).toString("ascii") !== "%PDF-") {
    throw new Error("Invalid PDF document.");
  }

  let source;

  try {
    source = await PDFDocument.load(buffer);
  } catch {
    throw new Error("Unable to process this PDF.");
  }

  const totalPages = source.getPageCount();

  if (totalPages < 1) {
    throw new Error("PDF has no pages.");
  }

  const selectedPages = getSelectedPages(
    pageMode,
    pageRange,
    totalPages
  );

  const output = await PDFDocument.create();

  const pages = await output.copyPages(source, selectedPages);

  pages.forEach((page) => output.addPage(page));

  return {
    buffer: Buffer.from(await output.save()),
    totalPages: selectedPages.length,
  };
}
