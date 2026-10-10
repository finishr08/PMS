import { NextResponse } from "next/server";
import { randomUUID } from "node:crypto";
import { mkdir, writeFile, unlink } from "node:fs/promises";
import path from "node:path";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { MAX_PDF_SIZE, validatePrintOptions } from "@/lib/print-validation";
import { processPdf } from "@/lib/pdf-processing";

function fail(message, status = 400) {
  return NextResponse.json({ success: false, error: message }, { status });
}

export async function POST(request) {
  const session = await auth();

  if (!session?.user?.id) {
    return fail("Please log in first.", 401);
  }

  let formData;

  try {
    formData = await request.formData();
  } catch {
    return fail("Invalid form data.");
  }

  const file = formData.get("file");

  if (!(file instanceof File)) {
    return fail("Please select a PDF.");
  }

  if (
    file.size === 0 ||
    file.size > MAX_PDF_SIZE ||
    !file.name.toLowerCase().endsWith(".pdf")
  ) {
    return fail("Invalid PDF. Maximum size is 25 MB.");
  }

  let options;
  let processed;

  try {
    const pageMode = formData.get("pageMode");
    const pageRange = formData.get("pageRange") ?? "";

    if (typeof pageMode !== "string" || typeof pageRange !== "string") {
      return fail("Invalid page settings.");
    }

    options = validatePrintOptions({
      copies: formData.get("copies"),
      paperSize: formData.get("paperSize"),
      pageMode,
      pageRange,
    });

    processed = await processPdf(
      Buffer.from(await file.arrayBuffer()),
      pageMode,
      pageRange,
    );
  } catch (error) {
    return fail(error.message);
  }

  const jobId = randomUUID();

  const directory = path.join(process.cwd(), "storage", "print-jobs");

  const savedFile = path.join(directory, `${jobId}.pdf`);

  try {
    await mkdir(directory, { recursive: true });
    await writeFile(savedFile, processed.buffer, {
      flag: "wx",
    });

    const job = await prisma.printJob.create({
      data: {
        id: jobId,
        userId: session.user.id,
        filename: path.win32.basename(file.name).slice(0, 255),
        copies: options.copies,
        pageRange:
          formData.get("pageMode") === "all"
            ? "all"
            : String(formData.get("pageRange")),
        paperSize: options.paperSize,
        totalPages: processed.totalPages,
        status: "QUEUED",
      },
    });

    return NextResponse.json(
      {
        success: true,
        message: "Print job created successfully.",
        job: {
          id: job.id,
          filename: job.filename,
          copies: job.copies,
          totalPages: job.totalPages,
          paperSize: job.paperSize,
          status: job.status,
        },
      },
      { status: 201 },
    );
  } catch (error) {
    await unlink(savedFile).catch(() => {});

    console.error("Print job error:", error);

    return fail("Failed to create print job.", 500);
  }
}
