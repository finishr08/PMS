const express = require("express");
const path = require("node:path");
const fs = require("node:fs/promises");
const { spawn } = require("node:child_process");
const { PrismaClient } = require("@prisma/client");

// Load the existing Next.js project's .env
require("dotenv").config({
  path: path.resolve(__dirname, "../.env"),
});

const prisma = new PrismaClient();
const app = express();

const PROJECT_ROOT = path.resolve(__dirname, "..");
const STORAGE_DIR = path.join(PROJECT_ROOT, "storage", "print-jobs");

const PORT = Number(process.env.PRINTER_AGENT_PORT || 4317);

const POLL_INTERVAL = Number(process.env.PRINTER_POLL_INTERVAL_MS || 3000);

const SUMATRA_PATH = process.env.SUMATRA_PATH;
const PRINTER_NAME = process.env.WINDOWS_PRINTER_NAME;

const ALLOWED_PAPER_SIZES = new Set(["A4", "Letter", "Legal"]);

let isProcessing = false;
let shuttingDown = false;
let pollTimer = null;
let lastError = null;

// Validate agent configuration before processing jobs.
function validateConfig() {
  if (!SUMATRA_PATH || !path.isAbsolute(SUMATRA_PATH)) {
    throw new Error("SUMATRA_PATH must be an absolute Windows file path.");
  }

  if (!PRINTER_NAME) {
    throw new Error("WINDOWS_PRINTER_NAME is missing.");
  }

  if (!Number.isInteger(PORT) || PORT < 1 || PORT > 65535) {
    throw new Error("Invalid PRINTER_AGENT_PORT.");
  }

  if (!Number.isInteger(POLL_INTERVAL) || POLL_INTERVAL < 1000) {
    throw new Error("PRINTER_POLL_INTERVAL_MS must be at least 1000.");
  }
}

// Validate a job before giving it to the printer.
function validateJob(job) {
  if (!/^[0-9a-f-]{36}$/i.test(job.id)) {
    throw new Error("Invalid print job ID.");
  }

  if (!Number.isInteger(job.copies) || job.copies < 1 || job.copies > 100) {
    throw new Error("Invalid number of copies.");
  }

  if (!ALLOWED_PAPER_SIZES.has(job.paperSize)) {
    throw new Error("Unsupported paper size.");
  }
}

// Get the prepared PDF using only the server-generated job ID.
function getPdfPath(jobId) {
  return path.join(STORAGE_DIR, `${jobId}.pdf`);
}

// Execute SumatraPDF without invoking a shell.
function runSumatra(job, pdfPath) {
  return new Promise((resolve, reject) => {
    const printSettings = [
      `${job.copies}x`,
      `paper=${job.paperSize}`,
      "simplex",
      "fit",
    ].join(",");

    const args = [
      "-print-to",
      PRINTER_NAME,
      "-print-settings",
      printSettings,
      "-silent",
      pdfPath,
    ];

    console.log(`[Printer] Sending ${job.id} (${printSettings})`);

    const child = spawn(SUMATRA_PATH, args, {
      shell: false,
      windowsHide: true,
      stdio: ["ignore", "pipe", "pipe"],
    });

    let stderr = "";
    let settled = false;

    const timeout = setTimeout(() => {
      child.kill();

      finish(new Error("SumatraPDF execution timed out."));
    }, 120000);

    function finish(error) {
      if (settled) return;
      settled = true;
      clearTimeout(timeout);

      if (error) {
        reject(error);
      } else {
        resolve();
      }
    }

    child.stderr.on("data", (chunk) => {
      stderr += chunk.toString().slice(0, 2048);
    });

    child.on("error", (error) => {
      finish(error);
    });

    child.on("close", (code, signal) => {
      if (code === 0) {
        finish(null);
      } else {
        finish(
          new Error(
            stderr.trim() ||
              `SumatraPDF exited with code ${code}, signal ${signal}`,
          ),
        );
      }
    });
  });
}

// Pick one queued job, claim it, and submit its PDF.
async function processNextJob() {
  if (isProcessing || shuttingDown) return;

  isProcessing = true;

  let claimedJob = null;

  try {
    const job = await prisma.printJob.findFirst({
      where: { status: "QUEUED" },
      orderBy: { createdAt: "asc" },
    });

    if (!job) return;

    // Atomic claim protects against two workers taking
    // the same job at the same time.
    const claim = await prisma.printJob.updateMany({
      where: {
        id: job.id,
        status: "QUEUED",
      },
      data: {
        status: "PROCESSING",
      },
    });

    if (claim.count !== 1) return;

    claimedJob = job;

    validateJob(job);

    const pdfPath = getPdfPath(job.id);
    const fileStat = await fs.stat(pdfPath);

    if (!fileStat.isFile() || fileStat.size === 0) {
      throw new Error("Prepared PDF is missing or empty.");
    }

    // Submit to Windows through SumatraPDF.
    await runSumatra(job, pdfPath);

    await prisma.printJob.update({
      where: { id: job.id },
      data: { status: "SUBMITTED" },
    });

    lastError = null;

    console.log(`[Printer] Job ${job.id} submitted to Windows.`);
  } catch (error) {
    lastError = error.message;

    console.error("[Printer] Job failed:", error.message);

    if (claimedJob) {
      try {
        await prisma.printJob.updateMany({
          where: {
            id: claimedJob.id,
            status: "PROCESSING",
          },
          data: { status: "FAILED" },
        });
      } catch (databaseError) {
        console.error(
          "[Printer] Failed to update job status:",
          databaseError.message,
        );
      }
    }
  } finally {
    isProcessing = false;
  }
}

// Poll for pending jobs. Each cycle completes before
// scheduling another one.
async function poll() {
  if (shuttingDown) return;

  await processNextJob();

  if (!shuttingDown) {
    pollTimer = setTimeout(poll, POLL_INTERVAL);
  }
}

// This endpoint reports the local agent's status,
// not the printer's physical hardware status.
app.get("/health", (req, res) => {
  res.json({
    success: true,
    agent: "running",
    printerName: PRINTER_NAME,
    processing: isProcessing,
    lastError,
  });
});

// Start Express on the local machine only.
async function start() {
  validateConfig();

  await fs.access(SUMATRA_PATH);
  await fs.mkdir(STORAGE_DIR, { recursive: true });

  await prisma.$connect();

  const server = app.listen(PORT, "127.0.0.1", () => {
    console.log("");
    console.log("PMS Printer Agent started");
    console.log(`URL: http://127.0.0.1:${PORT}`);
    console.log(`Printer: ${PRINTER_NAME}`);
    console.log(`SumatraPDF: ${SUMATRA_PATH}`);
    console.log(`Poll interval: ${POLL_INTERVAL}ms`);
    console.log("");

    poll();
  });

  async function shutdown() {
    if (shuttingDown) return;

    shuttingDown = true;
    clearTimeout(pollTimer);

    console.log("[Printer] Shutting down...");

    server.close();

    // Allow an active submission to finish.
    const deadline = Date.now() + 125000;

    while (isProcessing && Date.now() < deadline) {
      await new Promise((resolve) => setTimeout(resolve, 250));
    }

    await prisma.$disconnect();
    process.exit(0);
  }

  process.on("SIGINT", shutdown);
  process.on("SIGTERM", shutdown);
}

start().catch(async (error) => {
  console.error("[Printer] Startup failed:", error.message);

  await prisma.$disconnect();
  process.exit(1);
});
