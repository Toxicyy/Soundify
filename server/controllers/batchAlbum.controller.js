import BatchAlbumService from "../services/BatchAlbumService.js";
import { ApiResponse } from "../utils/responses.js";
import { catchAsync } from "../utils/helpers.js";

/**
 * Controller for batch album creation with progress tracking
 * Handles batch album creation and SSE progress streaming
 */

/**
 * Create album with multiple tracks in batch operation
 */
export const createBatchAlbum = catchAsync(async (req, res) => {
  const { sessionId, artistInfo, batchInfo } = req;

  // Validate required data from middleware
  if (!sessionId) {
    return res.status(500).json(ApiResponse.error("Session ID не найден"));
  }

  if (!artistInfo || !artistInfo.artistId) {
    return res
      .status(500)
      .json(ApiResponse.error("Информация об артисте не найдена"));
  }

  if (!batchInfo || !batchInfo.trackIndices) {
    return res
      .status(500)
      .json(ApiResponse.error("Информация о треках не найдена"));
  }

  const { artistId } = artistInfo;
  const { trackIndices } = batchInfo;

  // Extract album data from request body
  const albumData = {
    name: req.body.albumName,
    description: req.body.albumDescription || "",
    genre: req.body.albumGenre || [],
    type: req.body.albumType || "album",
    releaseDate: req.body.releaseDate,
  };

  // Extract track data using indices from middleware
  const trackData = trackIndices.map((index, position) => {
    const nameField = `tracks[${index}][name]`;
    const genreField = `tracks[${index}][genre]`;
    const tagsField = `tracks[${index}][tags]`;

    const trackName = req.body[nameField];
    const trackGenre = req.body[genreField];
    const trackTags = req.body[tagsField];

    // Validate files exist
    const audioField = `tracks[${index}][audio]`;
    const coverField = `tracks[${index}][cover]`;

    const hasAudio = !!(
      req.files &&
      req.files[audioField] &&
      req.files[audioField][0]
    );
    const hasCover = !!(
      req.files &&
      req.files[coverField] &&
      req.files[coverField][0]
    );

    if (!hasAudio) {
      throw new Error(
        `Audio file missing for track ${position + 1}: ${trackName}`
      );
    }

    if (!hasCover) {
      throw new Error(
        `Cover file missing for track ${position + 1}: ${trackName}`
      );
    }

    return {
      index,
      name: trackName || `Track ${position + 1}`,
      genre: trackGenre || "",
      tags: Array.isArray(trackTags) ? trackTags : trackTags ? [trackTags] : [],
    };
  });

  // Final validation of extracted data
  for (let i = 0; i < trackData.length; i++) {
    const track = trackData[i];

    if (
      !track.name ||
      track.name.trim() === "" ||
      track.name === `Track ${i + 1}`
    ) {
      return res
        .status(400)
        .json(ApiResponse.error(`Название трека ${i + 1} обязательно`));
    }
  }

  // Validate album cover
  if (!req.files || !req.files.albumCover || !req.files.albumCover[0]) {
    return res
      .status(400)
      .json(ApiResponse.error("Обложка альбома обязательна"));
  }

  try {
    // Start batch creation process (runs asynchronously)
    BatchAlbumService.createBatchAlbum(
      albumData,
      req.files,
      trackData,
      sessionId,
      req.user.id,
      artistId
    ).catch((error) => {
      console.error(`Batch creation failed for session ${sessionId}:`, error);
    });

    // Return immediate response with session ID
    res.status(202).json(
      ApiResponse.success("Создание альбома начато", {
        sessionId,
        message:
          "Процесс создания альбома запущен. Используйте sessionId для отслеживания прогресса.",
        progressUrl: `/api/albums/batch/progress/${sessionId}`,
        trackCount: trackData.length,
        estimatedTime: `${Math.ceil(trackData.length * 1.5)} минут`,
        albumName: albumData.name,
        artistName: artistInfo.artistName,
      })
    );
  } catch (error) {
    return res
      .status(500)
      .json(
        ApiResponse.error("Не удалось начать создание альбома", error.message)
      );
  }
});

/**
 * Get progress for batch album creation via SSE
 */
export const getBatchProgress = catchAsync(async (req, res) => {
  const { sessionId } = req.params;

  if (!sessionId) {
    return res.status(400).json(ApiResponse.error("Session ID обязателен"));
  }

  // Set SSE headers
  res.writeHead(200, {
    "Content-Type": "text/event-stream",
    "Cache-Control": "no-cache",
    Connection: "keep-alive",
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "Cache-Control",
  });

  // Send initial connection confirmation
  res.write(
    `data: ${JSON.stringify({
      type: "connected",
      sessionId,
      timestamp: new Date().toISOString(),
    })}\n\n`
  );

  // Progress polling interval
  const pollInterval = setInterval(() => {
    const progressData = BatchAlbumService.getProgress(sessionId);

    if (!progressData) {
      res.write(
        `data: ${JSON.stringify({
          type: "error",
          message: "Сессия не найдена или истекла",
          sessionId,
        })}\n\n`
      );
      clearInterval(pollInterval);
      res.end();
      return;
    }

    // Send progress update
    res.write(
      `data: ${JSON.stringify({
        type: "progress",
        sessionId,
        data: progressData,
        timestamp: new Date().toISOString(),
      })}\n\n`
    );

    // Check if process is completed or failed
    if (
      progressData.status === "completed" ||
      progressData.status === "failed"
    ) {
      res.write(
        `data: ${JSON.stringify({
          type: "finished",
          status: progressData.status,
          sessionId,
          message:
            progressData.status === "completed"
              ? "Альбом успешно создан"
              : "Создание альбома завершилось с ошибкой",
          timestamp: new Date().toISOString(),
        })}\n\n`
      );

      clearInterval(pollInterval);
      res.end();
    }
  }, 1000); // Update every second

  // Handle client disconnect
  req.on("close", () => {
    clearInterval(pollInterval);
  });

  req.on("end", () => {
    clearInterval(pollInterval);
  });
});

/**
 * Get current progress status (REST endpoint alternative to SSE)
 */
export const getBatchProgressRest = catchAsync(async (req, res) => {
  const { sessionId } = req.params;

  if (!sessionId) {
    return res.status(400).json(ApiResponse.error("Session ID обязателен"));
  }

  const progressData = BatchAlbumService.getProgress(sessionId);

  if (!progressData) {
    return res
      .status(404)
      .json(
        ApiResponse.error(
          "Сессия не найдена",
          "Сессия может быть завершена или истекла"
        )
      );
  }

  res.json(
    ApiResponse.success("Прогресс получен", {
      sessionId,
      progress: progressData,
      isCompleted:
        progressData.status === "completed" || progressData.status === "failed",
    })
  );
});

/**
 * Cancel batch album creation
 */
export const cancelBatchCreation = catchAsync(async (req, res) => {
  const { sessionId } = req.params;

  if (!sessionId) {
    return res.status(400).json(ApiResponse.error("Session ID обязателен"));
  }

  const progressData = BatchAlbumService.getProgress(sessionId);

  if (!progressData) {
    return res
      .status(404)
      .json(
        ApiResponse.error(
          "Сессия не найдена",
          "Сессия может быть уже завершена"
        )
      );
  }

  if (progressData.status === "completed") {
    return res
      .status(400)
      .json(
        ApiResponse.error("Нельзя отменить", "Создание альбома уже завершено")
      );
  }

  try {
    // Mark session as cancelled
    BatchAlbumService.updateProgress(sessionId, {
      status: "failed",
      message: "Создание альбома отменено пользователем",
    });

    res.json(
      ApiResponse.success("Отмена запроса принята", {
        sessionId,
        message:
          "Запрос на отмену отправлен. Процесс будет остановлен и выполнен откат изменений.",
        note: "Отмена может занять некоторое время для завершения текущих операций.",
      })
    );
  } catch (error) {
    return res
      .status(500)
      .json(ApiResponse.error("Ошибка отмены", error.message));
  }
});

/**
 * Get list of active batch sessions (admin/debug endpoint)
 */
export const getActiveSessions = catchAsync(async (req, res) => {
  try {
    const sessions = [];

    for (const [sessionId, data] of BatchAlbumService.progressData.entries()) {
      sessions.push({
        sessionId,
        status: data.status,
        startTime: data.startTime,
        lastUpdate: data.lastUpdate,
        trackCount: data.totalTracks,
        overallProgress: data.overallProgress || 0,
        currentStep: data.phase,
        message: data.message,
        albumName: data.albumName,
      });
    }

    res.json(
      ApiResponse.success("Активные сессии получены", {
        sessions,
        totalActive: sessions.length,
      })
    );
  } catch (error) {
    return res
      .status(500)
      .json(
        ApiResponse.error("Ошибка получения активных сессий", error.message)
      );
  }
});

/**
 * Cleanup expired sessions (admin endpoint)
 */
export const cleanupSessions = catchAsync(async (req, res) => {
  try {
    const beforeCount = BatchAlbumService.progressData.size;
    BatchAlbumService.cleanupOldProgress();
    const afterCount = BatchAlbumService.progressData.size;
    const cleanedCount = beforeCount - afterCount;

    res.json(
      ApiResponse.success("Очистка завершена", {
        before: beforeCount,
        after: afterCount,
        cleaned: cleanedCount,
      })
    );
  } catch (error) {
    return res
      .status(500)
      .json(ApiResponse.error("Ошибка очистки сессий", error.message));
  }
});
