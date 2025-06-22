import TrackService from "../services/TrackService.js";
import { ApiResponse } from "../utils/responses.js";
import { catchAsync } from "../utils/helpers.js";
import { generateSignedUrl, extractFileName } from "../utils/b2SignedUrl.js";
import Track from "../models/Track.model.js";

// Создание трека - ВСЕГДА HLS
export const createTrack = catchAsync(async (req, res) => {
  const track = await TrackService.createTrackWithHLS(
    // Только HLS!
    req.body,
    req.files,
    req.user?.id
  );

  res.status(201).json(ApiResponse.success("Трек успешно создан", track));
});

// Получение всех треков
export const getAllTracks = catchAsync(async (req, res) => {
  const { page, limit, sortBy, sortOrder } = req.query;

  const result = await TrackService.getAllTracks({
    page: parseInt(page) || 1,
    limit: parseInt(limit) || 20,
    sortBy: sortBy || "createdAt",
    sortOrder: parseInt(sortOrder) || -1,
  });

  res.json(ApiResponse.success("Треки получены", result));
});

// Получение трека по ID
export const getTrackById = catchAsync(async (req, res) => {
  const { id } = req.params;
  const track = await TrackService.getTrackById(id);

  if (!track) {
    return res.status(404).json(ApiResponse.error("Трек не найден"));
  }

  res.json(ApiResponse.success("Трек получен", track));
});

// ЕДИНЫЙ стриминг endpoint - обрабатывает все типы запросов
export const streamTrack = catchAsync(async (req, res) => {
  const { id, segmentName } = req.params;
  const track = await Track.findById(id);

  if (!track) {
    return res.status(404).json(ApiResponse.error("Трек не найден"));
  }

  // Увеличиваем счетчик только при запросе плейлиста (не сегментов)
  if (!segmentName) {
    await Track.findByIdAndUpdate(id, { $inc: { listenCount: 1 } });
  }

  try {
    // Определяем тип запроса по URL
    const requestPath = req.path;

    if (segmentName) {
      // Запрос сегмента: /api/tracks/:id/segment/:segmentName
      console.log(`📦 Запрос сегмента: ${segmentName}`);

      const segmentUrl = track.hlsSegments.find((url) =>
        extractFileName(url).includes(segmentName)
      );

      if (!segmentUrl) {
        return res.status(404).json(ApiResponse.error("Сегмент не найден"));
      }

      // Получаем подписанный URL и проксируем через наш сервер
      const signedUrl = await generateSignedUrl(
        extractFileName(segmentUrl),
        7200
      );

      console.log(`🔗 Проксируем сегмент: ${segmentUrl}`);

      // Проксируем запрос
      const response = await fetch(signedUrl);

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      // Устанавливаем правильные заголовки для .ts файлов
      res.set({
        "Content-Type": "video/mp2t",
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Headers": "Range",
        "Cache-Control": "public, max-age=31536000", // Кеш на год для сегментов
      });

      // Передаем содержимое
      const buffer = await response.arrayBuffer();
      res.send(Buffer.from(buffer));
    } else if (
      requestPath.includes("playlist.m3u8") ||
      requestPath.includes("stream")
    ) {
      // Запрос плейлиста: /api/tracks/:id/playlist.m3u8 или /api/tracks/:id/stream
      console.log(`📋 Запрос плейлиста для трека: ${track.name}`);

      const playlistUrl = await generateSignedUrl(
        extractFileName(track.audioUrl),
        7200
      );

      // Получаем плейлист
      const response = await fetch(playlistUrl);

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      let playlist = await response.text();

      // Заменяем относительные пути на URLs нашего сервера
      const lines = playlist.split("\n");
      const updatedLines = lines.map((line) => {
        if (line.endsWith(".ts")) {
          // Заменяем на URL нашего сервера
          const segmentName = line.trim();
          return `${req.protocol}://${req.get(
            "host"
          )}/api/tracks/${id}/segment/${segmentName}`;
        }
        return line;
      });

      const updatedPlaylist = updatedLines.join("\n");

      console.log("📄 Обновленный плейлист:");
      console.log(updatedPlaylist);

      res.set({
        "Content-Type": "application/vnd.apple.mpegurl",
        "Cache-Control": "no-cache, no-store, must-revalidate",
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Headers": "Range",
      });

      res.send(updatedPlaylist);
    } else {
      // Неизвестный тип запроса
      return res.status(400).json(ApiResponse.error("Неизвестный тип запроса"));
    }
  } catch (error) {
    console.error("❌ Ошибка стриминга:", error);
    res
      .status(500)
      .json(ApiResponse.error(`Ошибка стриминга: ${error.message}`));
  }
});

// Поиск треков
export const searchTracks = catchAsync(async (req, res) => {
  const { q, page, limit } = req.query;

  if (!q) {
    return res
      .status(400)
      .json(ApiResponse.error("Параметр поиска обязателен"));
  }

  const result = await TrackService.searchTracks(q, {
    page: parseInt(page) || 1,
    limit: parseInt(limit) || 20,
  });

  res.json(ApiResponse.success("Поиск выполнен", result));
});

// Увеличение счетчика (можно убрать, так как уже в streamTrack)
export const incrementListenCount = catchAsync(async (req, res) => {
  const { id } = req.params;
  const track = await TrackService.incrementListenCount(id);

  if (!track) {
    return res.status(404).json(ApiResponse.error("Трек не найден"));
  }

  res.json(ApiResponse.success("Счетчик прослушиваний обновлен", track));
});

// Удаление трека
export const deleteTrack = catchAsync(async (req, res) => {
  const { id } = req.params;
  const result = await TrackService.deleteTrack(id, req.user?.id);

  if (!result) {
    return res
      .status(404)
      .json(ApiResponse.error("Трек не найден или нет прав"));
  }

  res.json(ApiResponse.success("Трек успешно удален"));
});

// Обновление трека
export const updateTrack = catchAsync(async (req, res) => {
  const { id } = req.params;
  const track = await TrackService.updateTrack(id, req.body, req.user?.id);

  if (!track) {
    return res
      .status(404)
      .json(ApiResponse.error("Трек не найден или нет прав"));
  }

  res.json(ApiResponse.success("Трек успешно обновлен", track));
});
