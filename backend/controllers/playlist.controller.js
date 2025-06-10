import Playlist from "../models/Playlist.model.js";
import { ApiResponse } from "../utils/responses.js";
import { catchAsync } from "../utils/helpers.js";

export const createPlaylist = catchAsync(async (req, res) => {
  const { name, description, isPublic = true } = req.body;
  const userId = req.user.id;

  if (!name) {
    return res
      .status(400)
      .json(ApiResponse.error("Название плейлиста обязательно"));
  }

  const newPlaylist = await Playlist.create({
    name: name.trim(),
    description: description?.trim(),
    owner: userId,
    isPublic,
    tracks: [],
  });

  await newPlaylist.populate("owner", "name username avatar");

  res
    .status(201)
    .json(ApiResponse.success("Плейлист успешно создан", newPlaylist));
});

export const getUserPlaylists = catchAsync(async (req, res) => {
  const { userId } = req.params;
  const currentUserId = req.user.id;

  // Определяем условия поиска
  const searchConditions = { owner: userId };

  // Если запрашиваем не свои плейлисты, показываем только публичные
  if (userId !== currentUserId) {
    searchConditions.isPublic = true;
  }

  const playlists = await Playlist.find(searchConditions)
    .populate("tracks", "name artist coverUrl duration")
    .populate("owner", "name username avatar")
    .sort({ createdAt: -1 });

  res.json(ApiResponse.success("Плейлисты получены", playlists));
});

export const getPlaylistById = catchAsync(async (req, res) => {
  const { id } = req.params;
  const currentUserId = req.user?.id;

  const playlist = await Playlist.findById(id)
    .populate("tracks", "name artist coverUrl duration listenCount")
    .populate("owner", "name username avatar");

  if (!playlist) {
    return res.status(404).json(ApiResponse.error("Плейлист не найден"));
  }

  // Проверяем доступ к приватному плейлисту
  if (!playlist.isPublic && playlist.owner._id.toString() !== currentUserId) {
    return res.status(403).json(ApiResponse.error("Доступ запрещен"));
  }

  res.json(ApiResponse.success("Плейлист получен", playlist));
});

export const addTrackToPlaylist = catchAsync(async (req, res) => {
  const { playlistId, trackId } = req.params;
  const userId = req.user.id;

  const playlist = await Playlist.findById(playlistId);

  if (!playlist) {
    return res.status(404).json(ApiResponse.error("Плейлист не найден"));
  }

  // Проверяем права доступа
  if (playlist.owner.toString() !== userId) {
    return res.status(403).json(ApiResponse.error("Доступ запрещен"));
  }

  // Проверяем, не добавлен ли уже трек
  if (playlist.tracks.includes(trackId)) {
    return res
      .status(400)
      .json(ApiResponse.error("Трек уже добавлен в плейлист"));
  }

  playlist.tracks.push(trackId);
  await playlist.save();

  await playlist.populate("tracks", "name artist coverUrl duration");

  res.json(ApiResponse.success("Трек добавлен в плейлист", playlist));
});

export const removeTrackFromPlaylist = catchAsync(async (req, res) => {
  const { playlistId, trackId } = req.params;
  const userId = req.user.id;

  const playlist = await Playlist.findById(playlistId);

  if (!playlist) {
    return res.status(404).json(ApiResponse.error("Плейлист не найден"));
  }

  // Проверяем права доступа
  if (playlist.owner.toString() !== userId) {
    return res.status(403).json(ApiResponse.error("Доступ запрещен"));
  }

  playlist.tracks = playlist.tracks.filter((id) => id.toString() !== trackId);
  await playlist.save();

  await playlist.populate("tracks", "name artist coverUrl duration");

  res.json(ApiResponse.success("Трек удален из плейлиста", playlist));
});
