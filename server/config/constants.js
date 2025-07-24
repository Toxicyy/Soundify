export const UPLOAD_LIMITS = {
  fileSize: 50 * 1024 * 1024, // 50MB
  audioFormats: ["audio/mpeg", "audio/wav", "audio/mp3"],
  imageFormats: ["image/jpeg", "image/png", "image/webp"],

  // Batch processing limits
  maxTracksPerBatch: 50,
  maxFilesPerBatch: 101, // 1 album cover + 50 tracks * 2 files each

  // Field limits
  maxFieldSize: 10 * 1024 * 1024, // 10MB for text fields
  maxFieldNameSize: 200,
  maxFields: 500,
};

export const USER_ROLES = {
  USER: "USER",
  ARTIST: "ARTIST",
  ADMIN: "ADMIN",
  DEMO: "DEMO",
};