import PlaylistService from "../services/PlaylistService.js";
import { ApiResponse } from "../utils/responses.js";
import { catchAsync } from "../utils/helpers.js";

/**
 * Playlist controller handling HTTP requests for playlist operations
 * Manages playlist CRUD operations, track management, and social features
 */

/**
 * Create new playlist with optional cover image
 * Processes multipart form data with playlist metadata and cover file
 */
export const createPlaylist = catchAsync(async (req, res) => {
  // Validate required fields
  if (!req.body.name) {
    return res.status(400).json(ApiResponse.error("Playlist name is required"));
  }

  // Extract playlist data from request body
  const playlistData = {
    name: req.body.name,
    owner: req.user.id, // Get owner from authenvticated user
    description: req.body.description || "",
    tracks: req.body.tracks || [],
    tags: req.body.tags || [],
    category: req.body.category || "user",
    privacy: req.body.privacy || "public",
  };

  // Get cover file from multer middleware
  const coverFile = req.file;

  const playlist = await PlaylistService.createPlaylist(
    playlistData,
    coverFile
  );

  res
    .status(201)
    .json(ApiResponse.success("Playlist created successfully", playlist));
});

/**
 * Get paginated list of playlists with optional filtering
 * Supports search by name, filtering by category
 */
export const getAllPlaylists = catchAsync(async (req, res) => {
  const { page, limit, search, category, privacy } = req.query;

  const result = await PlaylistService.getAllPlaylists({
    page: parseInt(page) || 1,
    limit: parseInt(limit) || 20,
    search,
    category,
    privacy: privacy || "public", // Default to public only
  });

  res.json(
    ApiResponse.paginated(
      "Playlists retrieved successfully",
      result.playlists,
      result.pagination
    )
  );
});

/**
 * Get playlist by ID with populated owner and tracks data
 * Includes access control for private playlists
 */
export const getPlaylistById = catchAsync(async (req, res) => {
  const { id } = req.params;

  if (!id) {
    return res.status(400).json(ApiResponse.error("Playlist ID is required"));
  }
  const playlist = await PlaylistService.getPlaylistById(id, req.user?.id);

  res.json(ApiResponse.success("Playlist retrieved successfully", playlist));
});

/**
 * Update existing playlist with optional new cover image
 * Requires playlist ownership
 */
export const updatePlaylist = catchAsync(async (req, res) => {
  const { id } = req.params;

  if (!id) {
    return res.status(400).json(ApiResponse.error("Playlist ID is required"));
  }

  // Validate ownership
  await PlaylistService.validatePlaylistOwnership(id, req.user.id);

  // Extract update data from request body
  const updateData = {
    name: req.body.name,
    description: req.body.description,
    tags: req.body.tags,
    category: req.body.category,
    privacy: req.body.privacy,
  };

  // Remove undefined fields to avoid overwriting with null values
  Object.keys(updateData).forEach(
    (key) => updateData[key] === undefined && delete updateData[key]
  );

  const coverFile = req.file;
  const playlist = await PlaylistService.updatePlaylist(
    id,
    updateData,
    coverFile
  );

  res.json(ApiResponse.success("Playlist updated successfully", playlist));
});

/**
 * Delete playlist and associated cover file
 * Requires playlist ownership
 */
export const deletePlaylist = catchAsync(async (req, res) => {
  const { id } = req.params;

  if (!id) {
    return res.status(400).json(ApiResponse.error("Playlist ID is required"));
  }

  // Validate ownership
  await PlaylistService.validatePlaylistOwnership(id, req.user.id);

  await PlaylistService.deletePlaylist(id);

  res.json(ApiResponse.success("Playlist deleted successfully"));
});

/**
 * Get tracks from specific playlist with pagination
 * Returns tracks with populated artist data and signed URLs
 */
export const getPlaylistTracks = catchAsync(async (req, res) => {
  const { id } = req.params;
  const { page, limit, sortBy, sortOrder } = req.query;

  if (!id) {
    return res.status(400).json(ApiResponse.error("Playlist ID is required"));
  }

  const result = await PlaylistService.getPlaylistTracks(
    id,
    {
      page: parseInt(page) || 1,
      limit: parseInt(limit) || 20,
      sortBy: sortBy || "createdAt",
      sortOrder: parseInt(sortOrder) || -1,
    },
    req.user?.id
  );

  res.json(
    ApiResponse.paginated(
      "Playlist tracks retrieved successfully",
      result.data,
      result.pagination
    )
  );
});

/**
 * Search playlists by name with prefix matching
 * Returns limited results optimized for autocomplete functionality
 */
export const searchPlaylists = catchAsync(async (req, res) => {
  const { query, limit } = req.query;

  if (!query) {
    return res.status(400).json(ApiResponse.error("Search query is required"));
  }

  const result = await PlaylistService.searchPlaylist(query, {
    limit: parseInt(limit) || 10,
  });

  res.json(ApiResponse.success("Search completed successfully", result));
});

/**
 * Get featured playlists
 * Returns curated playlists for homepage
 */
export const getFeaturedPlaylists = catchAsync(async (req, res) => {
  const { limit } = req.query;

  const playlists = await PlaylistService.getFeaturedPlaylists({
    limit: parseInt(limit) || 10,
  });

  res.json(
    ApiResponse.success("Featured playlists retrieved successfully", playlists)
  );
});

/**
 * Get playlists filtered by specific category
 * Returns all playlists in the specified category
 */
export const getPlaylistsByCategory = catchAsync(async (req, res) => {
  const { category } = req.params;

  if (!category) {
    return res.status(400).json(ApiResponse.error("Category is required"));
  }

  const playlists = await PlaylistService.getPlaylistsByCategory(category);

  res.json(ApiResponse.success("Playlists retrieved successfully", playlists));
});

/**
 * Get playlists filtered by specific tag
 * Returns all playlists with the specified tag
 */
export const getPlaylistsByTag = catchAsync(async (req, res) => {
  const { tag } = req.params;

  if (!tag) {
    return res.status(400).json(ApiResponse.error("Tag is required"));
  }

  const playlists = await PlaylistService.getPlaylistsByTag(tag);

  res.json(ApiResponse.success("Playlists retrieved successfully", playlists));
});

/**
 * Get playlists by user ID
 * Returns user's playlists with privacy filtering
 */
export const getUserPlaylists = catchAsync(async (req, res) => {
  const { userId } = req.params;
  const { page, limit, privacy } = req.query;

  if (!userId) {
    return res.status(400).json(ApiResponse.error("User ID is required"));
  }

  const result = await PlaylistService.getUserPlaylists(userId, {
    page: parseInt(page) || 1,
    limit: parseInt(limit) || 20,
    privacy,
  });

  res.json(
    ApiResponse.paginated(
      "User playlists retrieved successfully",
      result.playlists,
      result.pagination
    )
  );
});

/**
 * Add existing track to playlist
 * Requires playlist ownership
 */
export const addTrackToPlaylist = catchAsync(async (req, res) => {
  const { playlistId, trackId } = req.params;

  if (!playlistId || !trackId) {
    return res
      .status(400)
      .json(ApiResponse.error("Playlist ID and Track ID are required"));
  }

  // Validate ownership
  await PlaylistService.validatePlaylistOwnership(playlistId, req.user.id);

  const playlist = await PlaylistService.addTrackToPlaylist(
    playlistId,
    trackId,
    req.user.id
  );

  res.json(
    ApiResponse.success("Track added to playlist successfully", playlist)
  );
});

/**
 * Remove track from playlist
 * Requires playlist ownership
 */
export const removeTrackFromPlaylist = catchAsync(async (req, res) => {
  const { playlistId, trackId } = req.params;

  if (!playlistId || !trackId) {
    return res
      .status(400)
      .json(ApiResponse.error("Playlist ID and Track ID are required"));
  }

  // Validate ownership
  await PlaylistService.validatePlaylistOwnership(playlistId, req.user.id);

  const playlist = await PlaylistService.removeTrackFromPlaylist(
    playlistId,
    trackId
  );

  res.json(
    ApiResponse.success("Track removed from playlist successfully", playlist)
  );
});

/**
 * Update track order within playlist
 * Requires playlist ownership
 */
export const updateTrackOrder = catchAsync(async (req, res) => {
  const { playlistId } = req.params;
  const { trackIds, skipValidation } = req.body;

  if (!playlistId) {
    return res.status(400).json(ApiResponse.error("Playlist ID is required"));
  }

  if (!trackIds || !Array.isArray(trackIds)) {
    return res
      .status(400)
      .json(ApiResponse.error("Track IDs array is required"));
  }

  // Validate ownership
  await PlaylistService.validatePlaylistOwnership(playlistId, req.user.id);

  const playlist = await PlaylistService.updateTrackOrder(
    playlistId,
    trackIds,
    skipValidation
  );

  res.json(ApiResponse.success("Track order updated successfully", playlist));
});

/**
 * Like playlist
 * Adds playlist to user's liked playlists
 */
export const likePlaylist = catchAsync(async (req, res) => {
  const { playlistId } = req.params;

  if (!playlistId) {
    return res.status(400).json(ApiResponse.error("Playlist ID is required"));
  }

  const playlist = await PlaylistService.likePlaylist(playlistId, req.user.id);

  res.json(ApiResponse.success("Playlist liked successfully", playlist));
});

/**
 * Unlike playlist
 * Removes playlist from user's liked playlists
 */
export const unlikePlaylist = catchAsync(async (req, res) => {
  const { playlistId } = req.params;

  if (!playlistId) {
    return res.status(400).json(ApiResponse.error("Playlist ID is required"));
  }

  const playlist = await PlaylistService.unlikePlaylist(
    playlistId,
    req.user.id
  );

  res.json(ApiResponse.success("Playlist unliked successfully", playlist));
});

/**
 * Get current user's liked playlists
 * Returns playlists the user has liked
 */
export const getLikedPlaylists = catchAsync(async (req, res) => {
  const { page, limit } = req.query;

  const result = await PlaylistService.getLikedPlaylists(req.user.id, {
    page: parseInt(page) || 1,
    limit: parseInt(limit) || 20,
  });

  res.json(
    ApiResponse.paginated(
      "Liked playlists retrieved successfully",
      result.playlists,
      result.pagination
    )
  );
});

/**
 * Get playlist statistics
 * Returns playlist metadata and stats
 */
export const getPlaylistStats = catchAsync(async (req, res) => {
  const { playlistId } = req.params;

  if (!playlistId) {
    return res.status(400).json(ApiResponse.error("Playlist ID is required"));
  }

  const stats = await PlaylistService.getPlaylistStats(playlistId);

  res.json(
    ApiResponse.success("Playlist statistics retrieved successfully", stats)
  );
});

export const createQuickPlaylist = catchAsync(async (req, res) => {
  const playlist = await PlaylistService.createQuickPlaylist(req.user.id);

  res.status(201).json(
    ApiResponse.success("Quick playlist created successfully", {
      id: playlist._id,
      name: playlist.name,
      isDraft: playlist.isDraft,
    })
  );
});

// Также добавить метод для превращения черновика в полноценный плейлист
export const publishPlaylist = catchAsync(async (req, res) => {
  const { id } = req.params;

  // Валидация владельца
  await PlaylistService.validatePlaylistOwnership(id, req.user.id);

  const playlist = await PlaylistService.updatePlaylist(id, {
    isDraft: false,
    privacy: req.body.privacy || "public",
  });

  res.json(ApiResponse.success("Playlist published successfully", playlist));
});
