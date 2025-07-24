import BatchAlbumService from "../services/BatchAlbumService.js";
import { ApiResponse } from "../utils/responses.js";
import { catchAsync } from "../utils/helpers.js";

/**
 * Controller for batch album creation with progress tracking
 * Handles batch album creation and SSE progress streaming
 */

/**
 * Create album with multiple tracks in batch operation
 * Processes multipart form data with album and track metadata
 */
export const createBatchAlbum = catchAsync(async (req, res) => {
  const { sessionId, artistInfo, batchInfo } = req;
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

  // Extract track data from request body
  const trackData = trackIndices.map((index) => ({
    index,
    name: req.body[`tracks[${index}][name]`],
    genre: req.body[`tracks[${index}][genre]`] || "",
    tags: req.body[`tracks[${index}][tags]`] || [],
  }));

  // Validate files structure
  if (!req.files || !req.files.albumCover || !req.files.albumCover[0]) {
    return res
      .status(400)
      .json(ApiResponse.error("Обложка альбома обязательна"));
  }

  // Validate that all tracks have required files
  for (const trackInfo of trackData) {
    const audioField = `tracks[${trackInfo.index}][audio]`;
    const coverField = `tracks[${trackInfo.index}][cover]`;

    if (!req.files[audioField] || !req.files[audioField][0]) {
      return res
        .status(400)
        .json(
          ApiResponse.error(
            `Аудио файл для трека "${trackInfo.name}" отсутствует`
          )
        );
    }

    if (!req.files[coverField] || !req.files[coverField][0]) {
      return res
        .status(400)
        .json(
          ApiResponse.error(`Обложка для трека "${trackInfo.name}" отсутствует`)
        );
    }
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

    // Immediately return response with session ID for progress tracking
    res.status(202).json(
      ApiResponse.success("Создание альбома начато", {
        sessionId,
        message:
          "Процесс создания альбома запущен. Используйте sessionId для отслеживания прогресса.",
        progressUrl: `/api/albums/batch/progress/${sessionId}`,
        trackCount: trackData.length,
        estimatedTime: `${Math.ceil(trackData.length * 1.5)} минут`, // Примерная оценка
      })
    );
  } catch (error) {
    console.error("Batch album creation initialization failed:", error);
    return res
      .status(500)
      .json(
        ApiResponse.error("Не удалось начать создание альбома", error.message)
      );
  }
});

/**
 * Get progress for batch album creation via SSE
 * Streams real-time progress updates to client
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
      // Session not found or expired
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
      // Send final status
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
 * Returns current progress state as JSON
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
 * Attempts to stop the creation process and perform cleanup
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
    BatchAlbumService.updateProgress(
      sessionId,
      "overall",
      "cancelled",
      "Создание альбома отменено пользователем"
    );

    res.json(
      ApiResponse.success("Отмена запроса принята", {
        sessionId,
        message:
          "Запрос на отмену отправлен. Процесс будет остановлен и выполнен откат изменений.",
        note: "Отмена может занять некоторое время для завершения текущих операций.",
      })
    );
  } catch (error) {
    console.error("Cancel batch creation failed:", error);
    return res
      .status(500)
      .json(ApiResponse.error("Ошибка отмены", error.message));
  }
});

/**
 * Get list of active batch sessions (admin/debug endpoint)
 * Returns information about currently running batch operations
 */
export const getActiveSessions = catchAsync(async (req, res) => {
  try {
    const sessions = [];

    // Iterate through active progress data
    for (const [sessionId, data] of BatchAlbumService.progressData.entries()) {
      sessions.push({
        sessionId,
        status: data.status,
        startTime: data.startTime,
        lastUpdate: data.lastUpdate,
        trackCount: Object.keys(data.tracks).length,
        overallProgress: data.overall.progress || 0,
        currentStep: data.overall.step,
        message: data.overall.message,
      });
    }

    res.json(
      ApiResponse.success("Активные сессии получены", {
        sessions,
        totalActive: sessions.length,
      })
    );
  } catch (error) {
    console.error("Get active sessions failed:", error);
    return res
      .status(500)
      .json(
        ApiResponse.error("Ошибка получения активных сессий", error.message)
      );
  }
});

/**
 * Cleanup expired sessions (admin endpoint)
 * Manually trigger cleanup of old progress data
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
    console.error("Cleanup sessions failed:", error);
    return res
      .status(500)
      .json(ApiResponse.error("Ошибка очистки сессий", error.message));
  }
});
