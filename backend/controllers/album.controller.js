import AlbumService from "../services/AlbumService.js";
import { ApiResponse } from "../utils/responses.js";
import { catchAsync } from "../utils/helpers.js";

/**
 * Album controller handling HTTP requests for album operations
 * Manages album CRUD operations, track management, and search functionality
 */

/**
 * Create new album with optional cover image
 * Processes multipart form data with album metadata and cover file
 */
export const createAlbum = catchAsync(async (req, res) => {
  // Validate required fields
  if (!req.body.name || !req.body.artist) {
    return res
      .status(400)
      .json(ApiResponse.error("Album name and artist are required"));
  }

  // Extract album data from request body
  const albumData = {
    name: req.body.name,
    artist: req.body.artist,
    description: req.body.description || "",
    releaseDate: req.body.releaseDate,
    tracks: req.body.tracks,
    genre: req.body.genre,
    type: req.body.type || "album",
  };

  // Get cover file from multer middleware
  const coverFile = req.file;

  const album = await AlbumService.createAlbum(albumData, coverFile);

  res
    .status(201)
    .json(ApiResponse.success("Album created successfully", album));
});

/**
 * Get paginated list of albums with optional filtering
 * Supports search by name, filtering by genre/type/artist
 */
export const getAllAlbums = catchAsync(async (req, res) => {
  const { page, limit, search, genre, type, artist } = req.query;

  const result = await AlbumService.getAllAlbums({
    page: parseInt(page) || 1,
    limit: parseInt(limit) || 20,
    search,
    genre,
    type,
    artist,
  });

  res.json(
    ApiResponse.paginated(
      "Albums retrieved successfully",
      result.albums,
      result.pagination
    )
  );
});

/**
 * Get album by ID with populated artist and tracks data
 */
export const getAlbumById = catchAsync(async (req, res) => {
  const { id } = req.params;

  if (!id) {
    return res.status(400).json(ApiResponse.error("Album ID is required"));
  }

  const album = await AlbumService.getAlbumById(id);

  res.json(ApiResponse.success("Album retrieved successfully", album));
});

/**
 * Update existing album with optional new cover image
 * Handles file replacement and cleanup of old cover files
 */
export const updateAlbum = catchAsync(async (req, res) => {
  const { id } = req.params;

  if (!id) {
    return res.status(400).json(ApiResponse.error("Album ID is required"));
  }

  // Extract update data from request body
  const updateData = {
    name: req.body.name,
    artist: req.body.artist,
    description: req.body.description,
    releaseDate: req.body.releaseDate,
    tracks: req.body.tracks,
    genre: req.body.genre,
    type: req.body.type,
  };

  // Remove undefined fields to avoid overwriting with null values
  Object.keys(updateData).forEach(
    (key) => updateData[key] === undefined && delete updateData[key]
  );

  const coverFile = req.file;

  const album = await AlbumService.updateAlbum(id, updateData, coverFile);

  res.json(ApiResponse.success("Album updated successfully", album));
});

/**
 * Delete album and associated cover file
 * Prevents deletion if album contains tracks
 */
export const deleteAlbum = catchAsync(async (req, res) => {
  const { id } = req.params;

  if (!id) {
    return res.status(400).json(ApiResponse.error("Album ID is required"));
  }

  await AlbumService.deleteAlbum(id);

  res.json(ApiResponse.success("Album deleted successfully"));
});

/**
 * Get tracks from specific album with pagination
 * Returns tracks with populated artist data and signed URLs
 */
export const getAlbumTracks = catchAsync(async (req, res) => {
  const { id } = req.params;
  const { page, limit, sortBy, sortOrder } = req.query;

  if (!id) {
    return res.status(400).json(ApiResponse.error("Album ID is required"));
  }

  const result = await AlbumService.getAlbumTracks(id, {
    page: parseInt(page) || 1,
    limit: parseInt(limit) || 20,
    sortBy: sortBy || "createdAt",
    sortOrder: parseInt(sortOrder) || -1,
  });

  res.json(
    ApiResponse.paginated(
      "Album tracks retrieved successfully",
      result.tracks,
      result.pagination
    )
  );
});

/**
 * Search albums by name with prefix matching
 * Returns limited results optimized for autocomplete functionality
 */
export const searchAlbums = catchAsync(async (req, res) => {
  const { query, limit } = req.query;

  if (!query) {
    return res.status(400).json(ApiResponse.error("Search query is required"));
  }

  const result = await AlbumService.searchAlbum(query, {
    limit: parseInt(limit) || 10,
  });

  res.json(ApiResponse.success("Search completed successfully", result));
});

/**
 * Get albums filtered by specific genre
 * Returns all albums in the specified genre with artist data
 */
export const getAlbumsByGenre = catchAsync(async (req, res) => {
  const { genre } = req.params;

  if (!genre) {
    return res.status(400).json(ApiResponse.error("Genre is required"));
  }

  const albums = await AlbumService.getAlbumsByGenre(genre);

  res.json(ApiResponse.success("Albums retrieved successfully", albums));
});

/**
 * Get albums filtered by type (album/ep/single)
 * Useful for categorizing releases by format
 */
export const getAlbumsByType = catchAsync(async (req, res) => {
  const { type } = req.params;

  if (!type) {
    return res.status(400).json(ApiResponse.error("Type is required"));
  }

  const albums = await AlbumService.getAlbumsByType(type);

  res.json(ApiResponse.success("Albums retrieved successfully", albums));
});

/**
 * Add existing track to album
 * Updates both album's track list and track's album reference
 */
export const addTrackToAlbum = catchAsync(async (req, res) => {
  const { albumId, trackId } = req.params;

  if (!albumId || !trackId) {
    return res
      .status(400)
      .json(ApiResponse.error("Album ID and Track ID are required"));
  }

  const album = await AlbumService.addTrackToAlbum(albumId, trackId);

  res.json(ApiResponse.success("Track added to album successfully", album));
});

/**
 * Remove track from album
 * Updates both album's track list and clears track's album reference
 */
export const removeTrackFromAlbum = catchAsync(async (req, res) => {
  const { albumId, trackId } = req.params;

  if (!albumId || !trackId) {
    return res
      .status(400)
      .json(ApiResponse.error("Album ID and Track ID are required"));
  }

  const album = await AlbumService.removeTrackFromAlbum(albumId, trackId);

  res.json(ApiResponse.success("Track removed from album successfully", album));
});

/**
 * Update track order within album
 * Allows reordering tracks for better album flow
 */
export const updateTrackOrder = catchAsync(async (req, res) => {
  const { albumId } = req.params;
  const { trackIds } = req.body;

  if (!albumId) {
    return res.status(400).json(ApiResponse.error("Album ID is required"));
  }

  if (!trackIds || !Array.isArray(trackIds)) {
    return res
      .status(400)
      .json(ApiResponse.error("Track IDs array is required"));
  }

  const album = await AlbumService.updateTrackOrder(albumId, trackIds);

  res.json(ApiResponse.success("Track order updated successfully", album));
});
