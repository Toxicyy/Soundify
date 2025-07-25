import Album from "../models/Album.model.js";
import Track from "../models/Track.model.js";
import Artist from "../models/Artist.model.js";
import AlbumService from "./AlbumService.js";
import { uploadToB2 } from "../utils/upload.js";
import { extractFileIdFromUrl, deleteFilesFromB2 } from "../utils/b2Utils.js";
import { processAudioToHLS } from "../utils/audioProcessor.js";
import fs from "fs/promises";

/**
 * Service for batch album creation with progress tracking
 * Handles creating albums with multiple tracks and real-time progress updates
 */
class BatchAlbumService {
  constructor() {
    this.progressData = new Map();

    // Cleanup old progress data every 10 minutes
    setInterval(() => {
      this.cleanupOldProgress();
    }, 10 * 60 * 1000);
  }

  /**
   * Create album with multiple tracks in batch
   */
  async createBatchAlbum(
    albumData,
    files,
    trackData,
    sessionId,
    userId,
    artistId
  ) {
    let createdAlbum = null;
    let createdTracks = [];
    let uploadedFiles = [];

    try {
      // Validate and prepare track data
      const validatedTrackData = trackData.map((track, index) => ({
        index: track.index || index,
        name: track.name || `Track ${index + 1}`,
        genre: track.genre || "",
        tags: Array.isArray(track.tags) ? track.tags : [],
      }));

      // Validate track names
      for (const trackInfo of validatedTrackData) {
        if (
          !trackInfo.name ||
          trackInfo.name.trim() === "" ||
          trackInfo.name === `Track ${trackInfo.index + 1}`
        ) {
          throw new Error(
            `Track name is required for track ${trackInfo.index + 1}`
          );
        }
      }

      this.initializeProgress(sessionId, albumData.name, validatedTrackData);

      // Step 1: Create album
      this.updateProgress(sessionId, {
        phase: "album",
        message: "Создание альбома...",
        overallProgress: 5,
      });

      createdAlbum = await this.createAlbumWithCover(
        albumData,
        files.albumCover[0],
        artistId
      );
      uploadedFiles.push(createdAlbum.coverFileId);

      this.updateProgress(sessionId, {
        phase: "tracks",
        message: "Альбом создан, начинаем обработку треков...",
        overallProgress: 10,
      });

      // Step 2: Process tracks sequentially
      for (let i = 0; i < validatedTrackData.length; i++) {
        const trackInfo = validatedTrackData[i];
        const trackIndex = trackInfo.index;

        try {
          this.updateProgress(sessionId, {
            currentTrack: i + 1,
            message: `Обработка трека ${i + 1}: ${trackInfo.name}`,
            overallProgress: 10 + (i / validatedTrackData.length) * 80,
            currentTrackProgress: 0,
          });

          this.updateTrackStatus(
            sessionId,
            i,
            "processing",
            "Начинаем обработку..."
          );

          const audioFile = files[`tracks[${trackIndex}][audio]`][0];
          const coverFile = files[`tracks[${trackIndex}][cover]`][0];

          const track = await this.createTrackWithDetailedProgress(
            {
              name: trackInfo.name,
              artist: artistId,
              album: createdAlbum._id,
              genre: trackInfo.genre,
              tags: trackInfo.tags || [],
            },
            { audio: [audioFile], cover: [coverFile] },
            userId,
            sessionId,
            i
          );

          createdTracks.push(track);

          // Collect file IDs for cleanup
          if (track.audioFileId) uploadedFiles.push(track.audioFileId);
          if (track.coverFileId) uploadedFiles.push(track.coverFileId);
          if (track.hlsSegmentFileIds)
            uploadedFiles.push(...track.hlsSegmentFileIds);

          this.updateTrackStatus(sessionId, i, "completed", "Трек готов");
        } catch (trackError) {
          this.updateTrackStatus(
            sessionId,
            i,
            "failed",
            `Ошибка: ${this.getUserFriendlyError(trackError)}`
          );
          throw trackError;
        }
      }

      // Step 3: Finalize album
      this.updateProgress(sessionId, {
        phase: "completed",
        message: "Финализация альбома...",
        overallProgress: 95,
      });

      const trackIds = createdTracks.map((track) => track._id);
      await Album.findByIdAndUpdate(createdAlbum._id, {
        tracks: trackIds,
        status: "published",
        updatedAt: new Date(),
      });

      await Artist.findByIdAndUpdate(artistId, {
        $addToSet: { albums: createdAlbum._id },
      });

      this.updateProgress(sessionId, {
        phase: "completed",
        status: "completed",
        message: `Альбом "${albumData.name}" успешно создан!`,
        overallProgress: 100,
      });

      const finalAlbum = await AlbumService.getAlbumById(createdAlbum._id);

      return {
        album: finalAlbum,
        tracks: createdTracks,
        trackCount: createdTracks.length,
      };
    } catch (error) {
      this.updateProgress(sessionId, {
        status: "failed",
        message: this.getUserFriendlyError(error),
      });

      await this.performRollback(
        createdAlbum,
        createdTracks,
        uploadedFiles,
        sessionId
      );
      throw new Error(`Batch album creation failed: ${error.message}`);
    }
  }

  /**
   * Create track with detailed progress updates
   */
  async createTrackWithDetailedProgress(
    trackData,
    files,
    userId,
    sessionId,
    trackIndex
  ) {
    let tempDir = null;

    try {
      if (!trackData || !trackData.name) {
        throw new Error(
          `Invalid track data: missing name for track ${trackIndex + 1}`
        );
      }

      if (!files || !files.audio || !files.cover) {
        throw new Error(
          `Missing files for track ${trackIndex + 1}: ${trackData.name}`
        );
      }

      const safeName = this.sanitizeFileName(trackData.name);

      // Step 1: Audio processing
      this.updateProgress(sessionId, { currentTrackProgress: 20 });
      this.updateTrackStatus(
        sessionId,
        trackIndex,
        "processing",
        "Конвертация аудио в HLS..."
      );

      const hlsData = await processAudioToHLS(
        files.audio[0].buffer,
        files.audio[0].originalname
      );
      tempDir = hlsData.tempDir;

      // Step 2: Cover upload
      this.updateProgress(sessionId, { currentTrackProgress: 40 });
      this.updateTrackStatus(
        sessionId,
        trackIndex,
        "processing",
        "Загрузка обложки..."
      );

      const coverUpload = await uploadToB2(files.cover[0], "images");

      // Step 3: HLS playlist upload
      this.updateProgress(sessionId, { currentTrackProgress: 60 });
      this.updateTrackStatus(
        sessionId,
        trackIndex,
        "processing",
        "Загрузка плейлиста..."
      );

      const hlsFolder = `hls/${Date.now()}-${safeName}`;
      const playlistUpload = await uploadToB2(
        {
          buffer: Buffer.from(hlsData.playlist),
          originalname: "playlist.m3u8",
          mimetype: "application/vnd.apple.mpegurl",
        },
        hlsFolder
      );

      // Step 4: HLS segments upload
      this.updateProgress(sessionId, { currentTrackProgress: 80 });
      this.updateTrackStatus(
        sessionId,
        trackIndex,
        "processing",
        "Загрузка сегментов..."
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

      // Step 5: Database save
      this.updateProgress(sessionId, { currentTrackProgress: 95 });
      this.updateTrackStatus(
        sessionId,
        trackIndex,
        "processing",
        "Сохранение в базу данных..."
      );

      const duration = this.calculatePlaylistDuration(hlsData.playlist);

      const track = new Track({
        name: trackData.name.trim(),
        artist: trackData.artist,
        album: trackData.album,
        audioUrl: playlistUpload.url,
        audioFileId: extractFileIdFromUrl(playlistUpload.url),
        hlsSegments: segmentUploads.map((upload) => upload.url),
        hlsSegmentFileIds: segmentUploads
          .map((upload) => extractFileIdFromUrl(upload.url))
          .filter((id) => id !== null),
        coverUrl: coverUpload.url,
        coverFileId: extractFileIdFromUrl(coverUpload.url),
        genre: trackData.genre?.trim() || "",
        tags: Array.isArray(trackData.tags)
          ? trackData.tags.map((tag) => tag.trim()).filter((tag) => tag)
          : [],
        duration: Math.round(duration),
        isPublic: true,
        isHLS: true,
        uploadedBy: userId,
      });

      const savedTrack = await track.save();
      this.updateProgress(sessionId, { currentTrackProgress: 100 });

      return savedTrack;
    } catch (error) {
      throw new Error(`HLS track creation failed: ${error.message}`);
    } finally {
      if (tempDir) {
        await this.cleanupTempDirectory(tempDir);
      }
    }
  }

  /**
   * Upload HLS segments in batches
   */
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

        if (i + batchSize < segmentFiles.length) {
          await new Promise((resolve) => setTimeout(resolve, 1000));
        }
      } catch (error) {
        // Fallback: upload individually
        for (const segment of batch) {
          const result = await uploadToB2(segment, folder, 5);
          uploads.push(result);
          await new Promise((resolve) => setTimeout(resolve, 500));
        }
      }
    }

    return uploads;
  }

  /**
   * Create album with cover image
   */
  async createAlbumWithCover(albumData, coverFile, artistId) {
    try {
      const coverUpload = await uploadToB2(coverFile, "albumCovers");

      let parsedGenres = albumData.genre;
      if (typeof albumData.genre === "string") {
        try {
          parsedGenres = JSON.parse(albumData.genre);
        } catch (e) {
          parsedGenres = albumData.genre.split(",").map((g) => g.trim());
        }
      }

      const album = new Album({
        name: albumData.name.trim(),
        artist: artistId,
        description: albumData.description?.trim() || "",
        coverUrl: coverUpload.url,
        coverFileId: extractFileIdFromUrl(coverUpload.url),
        releaseDate: albumData.releaseDate
          ? new Date(albumData.releaseDate)
          : null,
        tracks: [],
        genre: parsedGenres || [],
        type: albumData.type || "album",
        status: "processing",
      });

      return await album.save();
    } catch (error) {
      throw new Error(`Album creation failed: ${error.message}`);
    }
  }

  /**
   * Perform rollback cleanup on failure
   */
  async performRollback(createdAlbum, createdTracks, uploadedFiles, sessionId) {
    try {
      this.updateProgress(sessionId, { message: "Отмена изменений..." });

      // Delete tracks from database
      if (createdTracks.length > 0) {
        const trackIds = createdTracks.map((track) => track._id);
        await Track.deleteMany({ _id: { $in: trackIds } });
      }

      // Delete album from database
      if (createdAlbum) {
        await Album.findByIdAndDelete(createdAlbum._id);
        await Artist.findByIdAndUpdate(createdAlbum.artist, {
          $pull: { albums: createdAlbum._id },
        });
      }

      // Delete files from B2 storage
      if (uploadedFiles.length > 0) {
        try {
          await deleteFilesFromB2(uploadedFiles);
        } catch (b2Error) {
          console.warn(
            "Some files could not be deleted from B2:",
            b2Error.message
          );
        }
      }
    } catch (rollbackError) {
      console.error("Rollback failed:", rollbackError);
    }
  }

  /**
   * Initialize progress tracking
   */
  initializeProgress(sessionId, albumName, trackData) {
    const progressData = {
      sessionId,
      status: "processing",
      phase: "album",
      message: "Начинаем создание альбома...",
      albumName,
      totalTracks: trackData.length,
      currentTrack: 0,
      overallProgress: 0,
      currentTrackProgress: 0,
      tracks: trackData.map((track, index) => ({
        index,
        name: track.name,
        status: "pending",
      })),
      startTime: new Date(),
      lastUpdate: new Date(),
    };

    this.progressData.set(sessionId, progressData);
  }

  /**
   * Update progress with new data
   */
  updateProgress(sessionId, updates) {
    const data = this.progressData.get(sessionId);
    if (!data) return;

    Object.assign(data, updates);
    data.lastUpdate = new Date();
    this.progressData.set(sessionId, data);
  }

  /**
   * Update individual track status
   */
  updateTrackStatus(sessionId, trackIndex, status, message = "") {
    const data = this.progressData.get(sessionId);
    if (!data || !data.tracks[trackIndex]) return;

    data.tracks[trackIndex].status = status;
    if (message) {
      data.tracks[trackIndex].message = message;
    }
    data.lastUpdate = new Date();
    this.progressData.set(sessionId, data);
  }

  /**
   * Get progress data for session
   */
  getProgress(sessionId) {
    return this.progressData.get(sessionId) || null;
  }

  /**
   * Convert technical errors to user-friendly messages
   */
  getUserFriendlyError(error) {
    const message = error.message.toLowerCase();

    if (message.includes("ffmpeg")) {
      return "Ошибка обработки аудио файла. Проверьте формат файла.";
    }
    if (message.includes("upload") || message.includes("b2")) {
      return "Ошибка загрузки файла. Проверьте интернет соединение.";
    }
    if (message.includes("validation")) {
      return "Ошибка в данных трека. Проверьте название и другие поля.";
    }
    if (message.includes("space") || message.includes("limit")) {
      return "Недостаточно места на сервере или превышен лимит размера файла.";
    }
    if (message.includes("missing name") || message.includes("track name")) {
      return "Название трека обязательно для заполнения.";
    }

    return "Произошла непредвиденная ошибка. Попробуйте позже.";
  }

  /**
   * Clean up old progress data (older than 2 hours)
   */
  cleanupOldProgress() {
    const cutoffTime = Date.now() - 2 * 60 * 60 * 1000;

    for (const [sessionId, data] of this.progressData.entries()) {
      if (data.startTime.getTime() < cutoffTime) {
        this.progressData.delete(sessionId);
      }
    }
  }

  // Utility methods

  sanitizeFileName(filename) {
    if (!filename || typeof filename !== "string") {
      return "unknown-track";
    }
    return filename.replace(/[^a-zA-Z0-9\-_]/g, "-");
  }

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
      console.warn(
        `Failed to cleanup temp directory ${dirPath}:`,
        error.message
      );
    }
  }
}

export default new BatchAlbumService();
