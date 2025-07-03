import Track from "../models/Track.model.js";
import { uploadToB2, uploadMultipleToB2 } from "../utils/upload.js";
import { generateSignedUrl, extractFileName } from "../utils/b2SignedUrl.js";
import {
  processAudioToHLS,
  checkFFmpegAvailability,
} from "../utils/audioProcessor.js";
import { config } from "../config/config.js";
import B2 from "backblaze-b2";
import fs from "fs/promises";

class TrackService {
  async checkB2Access() {
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
      return false;
    }
  }

  async verifySystemRequirements() {
    try {
      await checkFFmpegAvailability();
      const b2Available = await this.checkB2Access();

      return true; // FFmpeg is primary requirement
    } catch (error) {
      return false;
    }
  }

  /**
   * Extract file ID from BackBlaze B2 URL for file management
   */
  extractFileIdFromUrl(url) {
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
      return null;
    }
  }

  // Create track with HLS streaming conversion
  async createTrackWithHLS(trackData, files, userId) {
    const { name, artist, genre, tags, album } = trackData;

    if (!files?.audio || !files?.cover) {
      throw new Error("Audio file and cover image are required");
    }

    // Verify system requirements
    const systemReady = await this.verifySystemRequirements();
    if (!systemReady) {
      throw new Error("System requirements not met - FFmpeg unavailable");
    }

    let tempDir = null;

    try {
      // Process audio to HLS format
      const hlsData = await processAudioToHLS(
        files.audio[0].buffer,
        files.audio[0].originalname
      );
      tempDir = hlsData.tempDir;

      // Upload cover image
      const coverUpload = await uploadToB2(files.cover[0], "images");

      // Prepare HLS folder structure
      const hlsFolder = `hls/${Date.now()}-${this.sanitizeFileName(name)}`;

      // Upload playlist file
      const playlistUpload = await uploadToB2(
        {
          buffer: Buffer.from(hlsData.playlist),
          originalname: "playlist.m3u8",
          mimetype: "application/vnd.apple.mpegurl",
        },
        hlsFolder
      );

      // Upload HLS segments in batches
      const segmentFiles = hlsData.segments.map((segment) => ({
        buffer: segment.buffer,
        originalname: segment.name,
        mimetype: "video/mp2t",
      }));

      const segmentUploads = await this.uploadHLSSegments(
        segmentFiles,
        hlsFolder
      );

      // Calculate duration from playlist
      const duration = this.calculatePlaylistDuration(hlsData.playlist);

      // Create track record with file IDs
      const track = new Track({
        name: name.trim(),
        artist: artist.trim(),
        album: album.trim(),
        audioUrl: playlistUpload.url,
        audioFileId: this.extractFileIdFromUrl(playlistUpload.url),
        hlsSegments: segmentUploads.map((upload) => upload.url),
        hlsSegmentFileIds: segmentUploads
          .map((upload) => this.extractFileIdFromUrl(upload.url))
          .filter((id) => id !== null),
        coverUrl: coverUpload.url,
        coverFileId: this.extractFileIdFromUrl(coverUpload.url),
        genre: genre?.trim(),
        tags: tags ? tags.split(",").map((tag) => tag.trim()) : [],
        duration: Math.round(duration),
        isPublic: true,
        isHLS: true,
        uploadedBy: userId,
      });

      await track.save();
      return track;
    } catch (error) {
      throw new Error(`HLS track creation failed: ${error.message}`);
    } finally {
      // Cleanup temporary files
      if (tempDir) {
        await this.cleanupTempDirectory(tempDir);
      }
    }
  }

  // Upload HLS segments with controlled concurrency to prevent B2 rate limiting
  async uploadHLSSegments(segmentFiles, folder) {
    const batchSize = 3;
    const uploads = [];

    for (let i = 0; i < segmentFiles.length; i += batchSize) {
      const batch = segmentFiles.slice(i, i + batchSize);

      try {
        const batchResults = await Promise.all(
          batch.map((segment) => uploadToB2(segment, folder, 5))
        );
        uploads.push(...batchResults);

        // Delay between batches to reduce B2 load
        if (i + batchSize < segmentFiles.length) {
          await new Promise((resolve) => setTimeout(resolve, 1000));
        }
      } catch (error) {
        // Fallback: upload segments individually
        for (const segment of batch) {
          try {
            const result = await uploadToB2(segment, folder, 5);
            uploads.push(result);
            await new Promise((resolve) => setTimeout(resolve, 500));
          } catch (individualError) {
            throw new Error(
              `Segment upload failed: ${individualError.message}`
            );
          }
        }
      }
    }

    return uploads;
  }

  async getAllTracks({
    page = 1,
    limit = 20,
    sortBy = "createdAt",
    sortOrder = -1,
  }) {
    try {
      const skip = (page - 1) * limit;
      const sort = { [sortBy]: sortOrder };

      const tracks = await Track.find({ isPublic: true })
        .sort(sort)
        .skip(skip)
        .limit(limit)
        .populate("uploadedBy", "name username avatar");

      const total = await Track.countDocuments({ isPublic: true });
      const totalPages = Math.ceil(total / limit);

      const tracksWithSignedUrls = await this.addSignedUrlsToTracks(tracks);

      return {
        tracks: tracksWithSignedUrls,
        pagination: {
          currentPage: page,
          totalPages,
          totalTracks: total,
          hasNextPage: page < totalPages,
          hasPrevPage: page > 1,
        },
      };
    } catch (error) {
      throw new Error(`Failed to retrieve tracks: ${error.message}`);
    }
  }

  async searchTracks(query, { page = 1, limit = 20 }) {
    try {
      const skip = (page - 1) * limit;
      const searchRegex = new RegExp(query, "i");

      const searchCondition = {
        $and: [
          { isPublic: true },
          {
            $or: [
              { name: searchRegex },
              { artist: searchRegex },
              { genre: searchRegex },
              { tags: { $in: [searchRegex] } },
            ],
          },
        ],
      };

      const tracks = await Track.find(searchCondition)
        .sort({ listenCount: -1, createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate("uploadedBy", "name username avatar");

      const total = await Track.countDocuments(searchCondition);
      const totalPages = Math.ceil(total / limit);

      const tracksWithSignedUrls = await this.addSignedUrlsToTracks(tracks);

      return {
        tracks: tracksWithSignedUrls,
        query,
        pagination: {
          currentPage: page,
          totalPages,
          totalTracks: total,
          hasNextPage: page < totalPages,
          hasPrevPage: page > 1,
        },
      };
    } catch (error) {
      throw new Error(`Track search failed: ${error.message}`);
    }
  }

  async getTrackById(trackId) {
    try {
      const track = await Track.findById(trackId).populate(
        "uploadedBy",
        "name username avatar"
      ).populate("artist", "name");

      if (!track) {
        throw new Error("Track not found");
      }

      return await this.addSignedUrlsToTracks(track);
    } catch (error) {
      throw new Error(`Failed to retrieve track: ${error.message}`);
    }
  }

  async incrementListenCount(trackId) {
    try {
      const track = await Track.findByIdAndUpdate(
        trackId,
        { $inc: { listenCount: 1 } },
        { new: true }
      ).populate("uploadedBy", "name username avatar");

      return track;
    } catch (error) {
      throw new Error(`Failed to update listen count: ${error.message}`);
    }
  }

  // Generate signed URLs for private bucket access
  async addSignedUrlsToTracks(tracks) {
    try {
      const isArray = Array.isArray(tracks);
      const tracksArray = isArray ? tracks : [tracks];

      const tracksWithSignedUrls = await Promise.all(
        tracksArray.map(async (track) => {
          const trackObj = track.toObject ? track.toObject() : track;

          // Generate signed URL for cover image
          if (trackObj.coverUrl) {
            const coverFileName = extractFileName(trackObj.coverUrl);
            if (coverFileName) {
              const signedCoverUrl = await generateSignedUrl(
                coverFileName,
                7200
              );
              if (signedCoverUrl) {
                trackObj.coverUrl = signedCoverUrl;
              }
            }
          }

          // Generate signed URL for audio/playlist
          if (trackObj.audioUrl) {
            const audioFileName = extractFileName(trackObj.audioUrl);
            if (audioFileName) {
              const signedAudioUrl = await generateSignedUrl(
                audioFileName,
                7200
              );
              if (signedAudioUrl) {
                trackObj.audioUrl = signedAudioUrl;
              }
            }
          }

          // Handle nested artist avatar if populated
          if (trackObj.artist && trackObj.artist.avatar) {
            const artistAvatarFileName = extractFileName(
              trackObj.artist.avatar
            );
            if (artistAvatarFileName) {
              const signedAvatarUrl = await generateSignedUrl(
                artistAvatarFileName,
                7200
              );
              if (signedAvatarUrl) {
                trackObj.artist.avatar = signedAvatarUrl;
              }
            }
          }

          return trackObj;
        })
      );

      return isArray ? tracksWithSignedUrls : tracksWithSignedUrls[0];
    } catch (error) {
      // Return original tracks without signed URLs on error
      const isArray = Array.isArray(tracks);
      return isArray
        ? tracks.map((track) => (track.toObject ? track.toObject() : track))
        : tracks.toObject
        ? tracks.toObject()
        : tracks;
    }
  }

  // Convert existing non-HLS track to HLS format
  async convertExistingTrackToHLS(trackId) {
    const systemReady = await this.verifySystemRequirements();
    if (!systemReady) {
      throw new Error("System requirements not met - FFmpeg unavailable");
    }

    let tempDir = null;

    try {
      const track = await Track.findById(trackId);

      if (!track || track.isHLS) {
        throw new Error("Track not found or already in HLS format");
      }

      // Download original audio file
      const audioUrl = await generateSignedUrl(
        extractFileName(track.audioUrl),
        3600
      );
      const response = await fetch(audioUrl);
      const audioBuffer = Buffer.from(await response.arrayBuffer());

      // Convert to HLS
      const hlsData = await processAudioToHLS(audioBuffer, track.name);
      tempDir = hlsData.tempDir;

      // Upload HLS files
      const hlsFolder = `hls/${Date.now()}-${this.sanitizeFileName(
        track.name
      )}-converted`;

      const playlistUpload = await uploadToB2(
        {
          buffer: Buffer.from(hlsData.playlist),
          originalname: "playlist.m3u8",
          mimetype: "application/vnd.apple.mpegurl",
        },
        hlsFolder
      );

      const segmentFiles = hlsData.segments.map((segment) => ({
        buffer: segment.buffer,
        originalname: segment.name,
        mimetype: "video/mp2t",
      }));

      const segmentUploads = await this.uploadHLSSegments(
        segmentFiles,
        hlsFolder
      );

      // Update track with file IDs
      track.audioUrl = playlistUpload.url;
      track.audioFileId = this.extractFileIdFromUrl(playlistUpload.url);
      track.hlsSegments = segmentUploads.map((upload) => upload.url);
      track.hlsSegmentFileIds = segmentUploads
        .map((upload) => this.extractFileIdFromUrl(upload.url))
        .filter((id) => id !== null);
      track.isHLS = true;
      track.audioQuality = "128k";

      await track.save();
      return await this.addSignedUrlsToTracks(track);
    } catch (error) {
      throw new Error(`HLS conversion failed: ${error.message}`);
    } finally {
      if (tempDir) {
        await this.cleanupTempDirectory(tempDir);
      }
    }
  }

  /**
   * Delete track and associated files from BackBlaze B2
   * Now properly handles file cleanup using fileIds
   */
  async deleteTrack(trackId, userId) {
    try {
      const track = await Track.findById(trackId);

      if (!track) {
        return false;
      }

      // Verify ownership
      if (track.uploadedBy.toString() !== userId) {
        return false;
      }

      // Delete files from BackBlaze B2 if fileIds exist
      const filesToDelete = [];

      if (track.audioFileId) {
        filesToDelete.push(track.audioFileId);
      }

      if (track.coverFileId) {
        filesToDelete.push(track.coverFileId);
      }

      if (track.hlsSegmentFileIds && track.hlsSegmentFileIds.length > 0) {
        filesToDelete.push(...track.hlsSegmentFileIds);
      }

      // Delete files from B2 (silently fail if deletion fails)
      if (filesToDelete.length > 0) {
        try {
          await this.deleteFilesFromB2(filesToDelete);
        } catch (error) {
          console.warn(
            `Warning: Failed to delete some files from B2:`,
            error.message
          );
          // Continue with database deletion even if file deletion fails
        }
      }

      // Delete track from database
      await Track.findByIdAndDelete(trackId);
      return true;
    } catch (error) {
      throw new Error(`Track deletion failed: ${error.message}`);
    }
  }

  /**
   * Delete files from BackBlaze B2 using file IDs
   */
  async deleteFilesFromB2(fileIds) {
    try {
      const b2 = new B2({
        applicationKeyId: config.b2.accountId,
        applicationKey: config.b2.secretKey,
      });

      await b2.authorize();

      // Delete files in batches to avoid rate limiting
      const batchSize = 5;
      for (let i = 0; i < fileIds.length; i += batchSize) {
        const batch = fileIds.slice(i, i + batchSize);

        await Promise.allSettled(
          batch.map(async (fileId) => {
            try {
              // Get file info first
              const fileInfo = await b2.getFileInfo({ fileId });

              // Delete the file
              await b2.deleteFileVersion({
                fileId: fileId,
                fileName: fileInfo.data.fileName,
              });

              console.log(`Deleted file: ${fileInfo.data.fileName}`);
            } catch (error) {
              console.warn(`Failed to delete file ${fileId}:`, error.message);
              // Continue with other files
            }
          })
        );

        // Small delay between batches
        if (i + batchSize < fileIds.length) {
          await new Promise((resolve) => setTimeout(resolve, 500));
        }
      }
    } catch (error) {
      throw new Error(`B2 file deletion failed: ${error.message}`);
    }
  }

  async updateTrack(trackId, updateData, userId) {
    try {
      const track = await Track.findById(trackId);

      if (!track) {
        return null;
      }

      // Verify ownership
      if (track.uploadedBy.toString() !== userId) {
        return null;
      }

      const updatedTrack = await Track.findByIdAndUpdate(
        trackId,
        { ...updateData, updatedAt: new Date() },
        { new: true }
      ).populate("uploadedBy", "name username avatar");

      return await this.addSignedUrlsToTracks(updatedTrack);
    } catch (error) {
      throw new Error(`Track update failed: ${error.message}`);
    }
  }

  // Utility methods

  sanitizeFileName(filename) {
    return filename.replace(/[^a-zA-Z0-9\-_]/g, "-");
  }

  // Calculate total duration from M3U8 playlist content
  calculatePlaylistDuration(playlist) {
    const lines = playlist.split("\n");
    let totalDuration = 0;

    lines.forEach((line) => {
      if (line.startsWith("#EXTINF:")) {
        const duration = parseFloat(line.split(":")[1].split(",")[0]);
        if (!isNaN(duration)) {
          totalDuration += duration;
        }
      }
    });

    return totalDuration;
  }

  async cleanupTempDirectory(dirPath) {
    try {
      await fs.rm(dirPath, { recursive: true, force: true });
    } catch (error) {
      // Silent cleanup failure
    }
  }
}

export default new TrackService();
