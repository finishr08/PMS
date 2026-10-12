
export const KIOSK_CONFIG = {
  sessionCookieName: "pms_kiosk_session",
  sessionMinutes: 30,

  // 50 MiB per PDF
  maxPdfSizeBytes: 50 * 1024 * 1024,

  // Maximum 10 documents per customer
  maxFilesPerSession: 10,

  // 250 MiB combined session storage
  maxSessionSizeBytes: 250 * 1024 * 1024,

  fileRetentionMinutes: 5,
};
