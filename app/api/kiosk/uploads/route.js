import { NextResponse } from "next/server";
import { randomUUID } from "node:crypto";
import { mkdir, open, rm } from "node:fs/promises";
import path from "node:path";

import { prisma } from "@/lib/prisma";
import { KIOSK_CONFIG } from "@/lib/kiosk/config";
import { getActiveKioskSession } from "@/lib/kiosk/session-auth";
import { validatePdfUpload } from "@/lib/kiosk/upload-validation";

const STORAGE_ROOT = path.resolve(process.cwd(), "storage", "temp");

const MAX_REQUEST_BYTES = KIOSK_CONFIG.maxPdfSizeBytes + 1024 * 1024;

function isSameOrigin(request) {
  const origin = request.headers.get("origin");

  if (request.headers.get("sec-fetch-site") === "cross-site") {
    return false;
  }

  return !origin || origin === new URL(request.url).origin;
}

function errorResponse(message, status) {
  return NextResponse.json(
    { success: false, error: message },
    {
      status,
      headers: { "Cache-Control": "no-store" },
    },
  );
}

function isPdf(buffer) {
  const signature = Buffer.from("%PDF-");

  return (
    buffer.length >= signature.length && buffer.subarray(0, 5).equals(signature)
  );
}

export async function POST(request) {
  if (!isSameOrigin(request)) {
    return errorResponse("Invalid request origin.", 403);
  }

  const session = await getActiveKioskSession();

  if (!session) {
    return errorResponse("Your kiosk session has expired. Start again.", 401);
  }

  // Reject oversized requests early when Content-Length
  // is supplied. A production proxy must also cap bodies.
  const contentLength = request.headers.get("content-length");

  if (
    contentLength &&
    (!Number.isFinite(Number(contentLength)) ||
      Number(contentLength) > MAX_REQUEST_BYTES)
  ) {
    return errorResponse("Upload request is too large.", 413);
  }

  let file;

  try {
    const formData = await request.formData();

    file = formData.get("file");

    if (!(file instanceof File)) {
      return errorResponse("No PDF was uploaded.", 400);
    }
  } catch {
    return errorResponse("Invalid upload request.", 400);
  }

  let originalName;

  try {
    ({ originalName } = validatePdfUpload(file));
  } catch (error) {
    return errorResponse(error.message, 400);
  }

  // This first implementation buffers ONE file only,
  // with a strict per-file size check.
  let bytes;

  try {
    bytes = Buffer.from(await file.arrayBuffer());
  } catch {
    return errorResponse("Could not read the PDF.", 400);
  }

  if (!isPdf(bytes)) {
    return errorResponse(
      "The selected document is not a valid PDF upload.",
      400,
    );
  }

  const fileId = randomUUID();

  // Session ID and file ID are generated server-side UUIDs.
  const sessionDirectory = path.join(STORAGE_ROOT, session.id);

  const filename = `${fileId}.pdf`;
  const storageKey = `${session.id}/${filename}`;
  const fullPath = path.join(sessionDirectory, filename);

  const expiresAt = new Date(
    Date.now() + KIOSK_CONFIG.sessionMinutes * 60 * 1000,
  );

  let recordCreated = false;
  let fileHandle;

  try {
    // Reserve the upload metadata before saving the file.
    // A transaction lock serializes reservations per session.
    await prisma.$transaction(async (tx) => {
      await tx.$queryRaw`
        SELECT pg_advisory_xact_lock(
          hashtext(${session.id}::text)
        )
      `;

      const activeSession = await tx.kioskSession.findFirst({
        where: {
          id: session.id,
          status: "ACTIVE",
          endedAt: null,
          expiresAt: { gt: new Date() },
        },
        select: { id: true },
      });

      if (!activeSession) {
        throw new Error("SESSION_EXPIRED");
      }

      const existingFiles = await tx.uploadedFile.findMany({
        where: {
          sessionId: session.id,
          status: {
            in: ["PENDING", "UPLOADING", "READY"],
          },
        },
        select: { sizeBytes: true },
      });

      if (existingFiles.length >= KIOSK_CONFIG.maxFilesPerSession) {
        throw new Error("FILE_LIMIT");
      }

      const existingBytes = existingFiles.reduce(
        (total, item) => total + item.sizeBytes,
        0n,
      );

      if (
        existingBytes + BigInt(file.size) >
        BigInt(KIOSK_CONFIG.maxSessionSizeBytes)
      ) {
        throw new Error("SESSION_SIZE_LIMIT");
      }

      await tx.uploadedFile.create({
        data: {
          id: fileId,
          sessionId: session.id,
          originalName,
          mimeType: "application/pdf",
          sizeBytes: BigInt(file.size),
          receivedBytes: 0n,
          storageKey,
          status: "UPLOADING",
          expiresAt,
        },
      });
    });

    recordCreated = true;

    await mkdir(sessionDirectory, {
      recursive: true,
    });

    // "wx" refuses to overwrite an existing file.
    fileHandle = await open(fullPath, "wx", 0o600);
    await fileHandle.writeFile(bytes);
    await fileHandle.close();
    fileHandle = undefined;

    await prisma.uploadedFile.update({
      where: { id: fileId },
      data: {
        status: "READY",
        receivedBytes: BigInt(bytes.length),
        completedAt: new Date(),
      },
    });

    return NextResponse.json(
      {
        success: true,
        file: {
          id: fileId,
          originalName,
          sizeBytes: bytes.length,
          status: "READY",
        },
      },
      {
        status: 201,
        headers: { "Cache-Control": "no-store" },
      },
    );
  } catch (error) {
    if (fileHandle) {
      await fileHandle.close().catch(() => {});
    }

    // Delete incomplete disk content on failure.
    await rm(fullPath, { force: true }).catch(() => {});

    if (recordCreated) {
      await prisma.uploadedFile
        .update({
          where: { id: fileId },
          data: { status: "FAILED" },
        })
        .catch(() => {});
    }

    if (error.message === "SESSION_EXPIRED") {
      return errorResponse("Session expired.", 401);
    }

    if (error.message === "FILE_LIMIT") {
      return errorResponse("Maximum 10 files per session.", 409);
    }

    if (error.message === "SESSION_SIZE_LIMIT") {
      return errorResponse("Maximum 250 MiB per session.", 413);
    }

    console.error("[Kiosk Upload]", error);

    return errorResponse("Upload failed. Please try again.", 500);
  }
}
