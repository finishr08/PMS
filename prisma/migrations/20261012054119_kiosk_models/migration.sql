-- CreateEnum
CREATE TYPE "KioskSessionStatus" AS ENUM ('ACTIVE', 'ENDED', 'EXPIRED');

-- CreateEnum
CREATE TYPE "UploadStatus" AS ENUM ('PENDING', 'UPLOADING', 'READY', 'FAILED', 'DELETING', 'DELETED');

-- CreateEnum
CREATE TYPE "PrintBatchStatus" AS ENUM ('DRAFT', 'QUEUED', 'PROCESSING', 'SUBMITTED', 'COMPLETED', 'FAILED', 'PARTIAL');

-- AlterTable
ALTER TABLE "PrintJob" ADD COLUMN     "batchId" TEXT,
ADD COLUMN     "uploadedFileId" TEXT;

-- CreateTable
CREATE TABLE "KioskSession" (
    "id" TEXT NOT NULL,
    "tokenHash" TEXT NOT NULL,
    "status" "KioskSessionStatus" NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "endedAt" TIMESTAMP(3),

    CONSTRAINT "KioskSession_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UploadedFile" (
    "id" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "originalName" TEXT NOT NULL,
    "mimeType" TEXT NOT NULL,
    "sizeBytes" BIGINT NOT NULL,
    "receivedBytes" BIGINT NOT NULL DEFAULT 0,
    "storageKey" TEXT NOT NULL,
    "status" "UploadStatus" NOT NULL DEFAULT 'PENDING',
    "totalPages" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "completedAt" TIMESTAMP(3),
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "UploadedFile_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PrintBatch" (
    "id" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "status" "PrintBatchStatus" NOT NULL DEFAULT 'DRAFT',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "submittedAt" TIMESTAMP(3),

    CONSTRAINT "PrintBatch_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "KioskSession_tokenHash_key" ON "KioskSession"("tokenHash");

-- CreateIndex
CREATE INDEX "KioskSession_status_expiresAt_idx" ON "KioskSession"("status", "expiresAt");

-- CreateIndex
CREATE UNIQUE INDEX "UploadedFile_storageKey_key" ON "UploadedFile"("storageKey");

-- CreateIndex
CREATE INDEX "UploadedFile_sessionId_status_idx" ON "UploadedFile"("sessionId", "status");

-- CreateIndex
CREATE INDEX "UploadedFile_status_expiresAt_idx" ON "UploadedFile"("status", "expiresAt");

-- CreateIndex
CREATE INDEX "PrintBatch_sessionId_createdAt_idx" ON "PrintBatch"("sessionId", "createdAt");

-- CreateIndex
CREATE INDEX "PrintBatch_status_idx" ON "PrintBatch"("status");

-- CreateIndex
CREATE INDEX "PrintJob_batchId_idx" ON "PrintJob"("batchId");

-- CreateIndex
CREATE INDEX "PrintJob_uploadedFileId_idx" ON "PrintJob"("uploadedFileId");

-- AddForeignKey
ALTER TABLE "UploadedFile" ADD CONSTRAINT "UploadedFile_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "KioskSession"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PrintBatch" ADD CONSTRAINT "PrintBatch_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "KioskSession"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PrintJob" ADD CONSTRAINT "PrintJob_batchId_fkey" FOREIGN KEY ("batchId") REFERENCES "PrintBatch"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PrintJob" ADD CONSTRAINT "PrintJob_uploadedFileId_fkey" FOREIGN KEY ("uploadedFileId") REFERENCES "UploadedFile"("id") ON DELETE SET NULL ON UPDATE CASCADE;
