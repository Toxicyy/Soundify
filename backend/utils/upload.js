import { config } from "../config/config.js";
import B2 from "backblaze-b2";

const b2 = new B2({
  applicationKeyId: config.b2.accountId,
  applicationKey: config.b2.secretKey,
});

// Authorization caching (23-hour expiry)
let authData = null;
let authExpiry = null;

const ensureAuthorized = async () => {
  if (authData && authExpiry && Date.now() < authExpiry) {
    return authData;
  }

  try {
    authData = await b2.authorize();
    authExpiry = Date.now() + 23 * 60 * 60 * 1000; // 23 hours
    return authData;
  } catch (error) {
    authData = null;
    authExpiry = null;
    throw new Error(`B2 authorization failed: ${error.message}`);
  }
};

const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

// Exponential backoff with special handling for 503 errors
const calculateRetryDelay = (attempt, statusCode = null) => {
  const baseDelay = Math.pow(2, attempt) * 1000;

  // Longer delays for service unavailable
  if (statusCode === 503) {
    return Math.min(Math.pow(3, attempt) * 1000, 30000);
  }

  return Math.min(baseDelay, 15000);
};

// Upload file with retry logic for reliability
export const uploadToB2 = async (file, folder, maxRetries = 5) => {
  let lastError;
  const fileName = `${folder}/${Date.now()}-${file.originalname}`;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      await ensureAuthorized();

      const uploadUrl = await b2.getUploadUrl({
        bucketId: config.b2.bucketId,
      });

      const response = await b2.uploadFile({
        uploadUrl: uploadUrl.data.uploadUrl,
        uploadAuthToken: uploadUrl.data.authorizationToken,
        fileName,
        data: file.buffer,
      });

      return {
        url:
          response.data.fileUrl ||
          `https://f003.backblazeb2.com/file/${config.b2.bucketName}/${fileName}`,
        fileId: response.data.fileId,
        fileName: fileName,
      };
    } catch (error) {
      lastError = error;

      if (error.response) {
        const { status } = error.response;

        switch (status) {
          case 400: // Bad Request - don't retry
            throw new Error(`Upload failed: ${error.message}`);

          case 401: // Unauthorized - clear auth cache and retry
            authData = null;
            authExpiry = null;
            break;

          case 429: // Rate limited
          case 503: // Service unavailable
            break;

          default:
            break;
        }
      }

      if (attempt === maxRetries) {
        throw new Error(
          `Upload failed after ${maxRetries} attempts: ${lastError.message}`
        );
      }

      const delayMs = calculateRetryDelay(attempt, error.response?.status);
      await delay(delayMs);
    }
  }
};

// Batch upload with controlled concurrency to prevent B2 rate limiting
export const uploadMultipleToB2 = async (files, folder, concurrency = 3) => {
  const results = [];

  for (let i = 0; i < files.length; i += concurrency) {
    const batch = files.slice(i, i + concurrency);

    try {
      const batchResults = await Promise.all(
        batch.map((file) => uploadToB2(file, folder))
      );
      results.push(...batchResults);

      // Small delay between batches
      if (i + concurrency < files.length) {
        await delay(500);
      }
    } catch (error) {
      throw new Error(`Batch upload failed: ${error.message}`);
    }
  }

  return results;
};

export const checkB2Status = async () => {
  try {
    await ensureAuthorized();

    const buckets = await b2.listBuckets();
    const targetBucket = buckets.data.buckets.find(
      (bucket) => bucket.bucketId === config.b2.bucketId
    );

    return !!targetBucket;
  } catch (error) {
    return false;
  }
};
