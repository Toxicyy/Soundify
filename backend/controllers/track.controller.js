import TrackService from "../services/TrackService.js";
import { ApiResponse } from "../utils/responses.js";
import { catchAsync } from "../utils/helpers.js";

export const createTrack = catchAsync(async (req, res) => {
  const track = await TrackService.createTrack(
    req.body,
    req.files,
    req.user?.id
  );

  res.status(201).json(ApiResponse.success("Трек успешно создан", track));
});

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

export const incrementListenCount = catchAsync(async (req, res) => {
  const { id } = req.params;
  const track = await TrackService.incrementListenCount(id);

  if (!track) {
    return res.status(404).json(ApiResponse.error("Трек не найден"));
  }

  res.json(ApiResponse.success("Счетчик прослушиваний обновлен", track));
});
