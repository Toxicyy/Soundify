import B2 from "backblaze-b2";
import { config } from "../config/config.js";

/**
 * Utility functions for BackBlaze B2 operations
 * Centralizes common B2 operations to avoid code duplication
 */

/**
 * Extract file ID from BackBlaze B2 URL
 * @param {string} url - Full B2 URL
 * @returns {string|null} - File ID or null if extraction fails
 */
export const extractFileIdFromUrl = (url) => {
  if (!url) return null;

  try {
    const urlParts = url.split("/");
    const fileIndex = urlParts.indexOf("file");

    if (fileIndex === -1 || fileIndex + 2 >= urlParts.length) {
      return null;
    }

    const pathParts = urlParts.slice(fileIndex + 2);
    return pathParts.join("/");
  } catch (error) {
    console.warn(`Failed to extract file ID from URL: ${url}`, error.message);
    return null;
  }
};

/**
 * Delete single file from BackBlaze B2 using file ID
 * @param {string} fileId - B2 file ID
 * @returns {Promise<boolean>} - Success status
 */
export const deleteFileFromB2 = async (fileId) => {
  if (!fileId) {
    throw new Error("File ID is required");
  }

  try {
    const b2 = new B2({
      applicationKeyId: config.b2.accountId,
      applicationKey: config.b2.secretKey,
    });

    await b2.authorize();

    const fileInfo = await b2.getFileInfo({ fileId });
    await b2.deleteFileVersion({
      fileId: fileId,
      fileName: fileInfo.data.fileName,
    });

    console.log(`Successfully deleted file: ${fileInfo.data.fileName}`);
    return true;
  } catch (error) {
    console.error(`Failed to delete file ${fileId}:`, error.message);
    throw new Error(`B2 file deletion failed: ${error.message}`);
  }
};

/**
 * Delete multiple files from BackBlaze B2 using file IDs
 * Uses batching to avoid rate limiting
 * @param {string[]} fileIds - Array of B2 file IDs
 * @param {number} batchSize - Number of files to delete per batch
 * @returns {Promise<{success: string[], failed: string[]}>} - Results summary
 */
export const deleteFilesFromB2 = async (fileIds, batchSize = 5) => {
  if (!Array.isArray(fileIds) || fileIds.length === 0) {
    throw new Error("File IDs array is required");
  }

  const results = {
    success: [],
    failed: [],
  };

  try {
    const b2 = new B2({
      applicationKeyId: config.b2.accountId,
      applicationKey: config.b2.secretKey,
    });

    await b2.authorize();

    // Process files in batches to avoid rate limiting
    for (let i = 0; i < fileIds.length; i += batchSize) {
      const batch = fileIds.slice(i, i + batchSize);

      const batchResults = await Promise.allSettled(
        batch.map(async (fileId) => {
          try {
            const fileInfo = await b2.getFileInfo({ fileId });
            await b2.deleteFileVersion({
              fileId: fileId,
              fileName: fileInfo.data.fileName,
            });

            console.log(`Successfully deleted file: ${fileInfo.data.fileName}`);
            return { fileId, fileName: fileInfo.data.fileName };
          } catch (error) {
            console.warn(`Failed to delete file ${fileId}:`, error.message);
            throw error;
          }
        })
      );

      // Process batch results
      batchResults.forEach((result, index) => {
        const fileId = batch[index];
        if (result.status === "fulfilled") {
          results.success.push(fileId);
        } else {
          results.failed.push(fileId);
        }
      });

      // Small delay between batches to be respectful to B2 API
      if (i + batchSize < fileIds.length) {
        await new Promise((resolve) => setTimeout(resolve, 500));
      }
    }

    console.log(
      `Batch deletion completed. Success: ${results.success.length}, Failed: ${results.failed.length}`
    );
    return results;
  } catch (error) {
    console.error("Batch file deletion failed:", error.message);
    throw new Error(`B2 batch deletion failed: ${error.message}`);
  }
};

/**
 * Check if B2 connection and bucket access is working
 * @returns {Promise<boolean>} - Connection status
 */
export const checkB2Connection = async () => {
  try {
    const b2 = new B2({
      applicationKeyId: config.b2.accountId,
      applicationKey: config.b2.secretKey,
    });

    await b2.authorize();

    const buckets = await b2.listBuckets();
    const targetBucket = buckets.data.buckets.find(
      (bucket) => bucket.bucketId === config.b2.bucketId
    );

    return !!targetBucket;
  } catch (error) {
    console.error("B2 connection check failed:", error.message);
    return false;
  }
};

/**
 * Get file information from B2
 * @param {string} fileId - B2 file ID
 * @returns {Promise<Object>} - File information
 */
export const getFileInfoFromB2 = async (fileId) => {
  if (!fileId) {
    throw new Error("File ID is required");
  }

  try {
    const b2 = new B2({
      applicationKeyId: config.b2.accountId,
      applicationKey: config.b2.secretKey,
    });

    await b2.authorize();

    const fileInfo = await b2.getFileInfo({ fileId });
    return fileInfo.data;
  } catch (error) {
    console.error(`Failed to get file info for ${fileId}:`, error.message);
    throw new Error(`Failed to get file info: ${error.message}`);
  }
};

