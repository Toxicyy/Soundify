import PlaylistService from "../services/PlaylistService.js";
import { ApiResponse } from "../utils/responses.js";
import { catchAsync } from "../utils/helpers.js";

/**
 * Enhanced playlist controller with improved security and like functionality
 * All playlist modification operations now include proper ownership/admin checks
 */

/**
 * Check if user can edit playlist (owner or admin)
 * @param {Object} playlist - Playlist document
 * @param {string} userId - User ID
 * @param {string} userStatus - User status (USER, PREMIUM, ADMIN)
 * @returns {boolean} Can edit playlist
 */
const checkEditPermissions = (playlist, userId, userStatus) => {
  if (userStatus === "ADMIN") return true;

  const ownerId =
    typeof playlist.owner === "string"
      ? playlist.owner
      : playlist.owner._id || playlist.owner.toString();


  return ownerId.toString() === userId;
};

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
    owner: req.user.id, // Get owner from authenticated user
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
 * Update existing playlist with enhanced permission checking
 */
export const updatePlaylist = catchAsync(async (req, res) => {
  const { id } = req.params;

  if (!id) {
    return res.status(400).json(ApiResponse.error("Playlist ID is required"));
  }

  // Get playlist and check permissions
  const playlist = await PlaylistService.getPlaylistById(id, req.user.id);

  if (!checkEditPermissions(playlist, req.user.id, req.user.status)) {
    return res
      .status(403)
      .json(
        ApiResponse.error("You don't have permission to edit this playlist")
      );
  }

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
  const updatedPlaylist = await PlaylistService.updatePlaylist(
    id,
    updateData,
    coverFile
  );

  res.json(
    ApiResponse.success("Playlist updated successfully", updatedPlaylist)
  );
});

/**
 * Delete playlist with enhanced permission checking
 */
export const deletePlaylist = catchAsync(async (req, res) => {
  const { id } = req.params;

  if (!id) {
    return res.status(400).json(ApiResponse.error("Playlist ID is required"));
  }

  // Get playlist and check permissions
  const playlist = await PlaylistService.getPlaylistById(id, req.user.id);

  if (!checkEditPermissions(playlist, req.user.id, req.user.status)) {
    return res
      .status(403)
      .json(
        ApiResponse.error("You don't have permission to delete this playlist")
      );
  }

  await PlaylistService.deletePlaylist(id);

  res.json(ApiResponse.success("Playlist deleted successfully"));
});

/**
 * Get tracks from specific playlist with pagination
 * Returns tracks with populated artist data and signed URLs
 */
export const getPlaylistTracks = catchAsync(async (req, res) => {
  const { id } = req.params;
  const { page, limit } = req.query;

  if (!id) {
    return res.status(400).json(ApiResponse.error("Playlist ID is required"));
  }

  const result = await PlaylistService.getPlaylistTracks(
    id,
    {
      page: parseInt(page) || 1,
      limit: parseInt(limit) || 20,
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
 * Get playlists by user ID with privacy filtering
 */
export const getUserPlaylists = catchAsync(async (req, res) => {
  const { userId } = req.params;
  const { page, limit, privacy } = req.query;

  if (!userId) {
    return res.status(400).json(ApiResponse.error("User ID is required"));
  }

  const result = await PlaylistService.getUserPlaylists(
    userId,
    {
      page: parseInt(page) || 1,
      limit: parseInt(limit) || 20,
      privacy,
    },
    req.user?.id // Pass requester ID for privacy filtering
  );

  res.json(
    ApiResponse.paginated(
      "User playlists retrieved successfully",
      result.playlists,
      result.pagination
    )
  );
});

/**
 * Add track to playlist with permission checking
 */
export const addTrackToPlaylist = catchAsync(async (req, res) => {
  const { playlistId, trackId } = req.params;

  if (!playlistId || !trackId) {
    return res
      .status(400)
      .json(ApiResponse.error("Playlist ID and Track ID are required"));
  }

  // Get playlist and check permissions
  const playlist = await PlaylistService.getPlaylistById(
    playlistId,
    req.user.id
  );

  if (!checkEditPermissions(playlist, req.user.id, req.user.status)) {
    return res
      .status(403)
      .json(
        ApiResponse.error("You don't have permission to edit this playlist")
      );
  }

  const updatedPlaylist = await PlaylistService.addTrackToPlaylist(
    playlistId,
    trackId,
    req.user.id
  );

  res.json(
    ApiResponse.success("Track added to playlist successfully", updatedPlaylist)
  );
});

/**
 * Remove track from playlist with permission checking
 */
export const removeTrackFromPlaylist = catchAsync(async (req, res) => {
  const { playlistId, trackId } = req.params;

  if (!playlistId || !trackId) {
    return res
      .status(400)
      .json(ApiResponse.error("Playlist ID and Track ID are required"));
  }

  // Get playlist and check permissions
  const playlist = await PlaylistService.getPlaylistById(
    playlistId,
    req.user.id
  );

  if (!checkEditPermissions(playlist, req.user.id, req.user.status)) {
    return res
      .status(403)
      .json(
        ApiResponse.error("You don't have permission to edit this playlist")
      );
  }

  const updatedPlaylist = await PlaylistService.removeTrackFromPlaylist(
    playlistId,
    trackId
  );

  res.json(
    ApiResponse.success(
      "Track removed from playlist successfully",
      updatedPlaylist
    )
  );
});

/**
 * Update track order with permission checking
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

  // Get playlist and check permissions
  const playlist = await PlaylistService.getPlaylistById(
    playlistId,
    req.user.id
  );

  if (!checkEditPermissions(playlist, req.user.id, req.user.status)) {
    return res
      .status(403)
      .json(
        ApiResponse.error("You don't have permission to edit this playlist")
      );
  }

  const updatedPlaylist = await PlaylistService.updateTrackOrder(
    playlistId,
    trackIds,
    skipValidation,
    req.user.id
  );

  res.json(
    ApiResponse.success("Track order updated successfully", updatedPlaylist)
  );
});

/**
 * Like playlist - Enhanced with proper error handling
 */
export const likePlaylist = catchAsync(async (req, res) => {
  const { playlistId } = req.params;

  if (!playlistId) {
    return res.status(400).json(ApiResponse.error("Playlist ID is required"));
  }

  try {
    const result = await PlaylistService.likePlaylist(playlistId, req.user.id);

    res.json(
      ApiResponse.success("Playlist liked successfully", {
        playlistId,
        isLiked: true,
        likeCount: result.likeCount,
      })
    );
  } catch (error) {
    if (error.message.includes("already liked")) {
      return res
        .status(409)
        .json(ApiResponse.error("Playlist is already liked"));
    }
    throw error;
  }
});

/**
 * Unlike playlist - Enhanced with proper error handling
 */
export const unlikePlaylist = catchAsync(async (req, res) => {
  const { playlistId } = req.params;

  if (!playlistId) {
    return res.status(400).json(ApiResponse.error("Playlist ID is required"));
  }

  try {
    const result = await PlaylistService.unlikePlaylist(
      playlistId,
      req.user.id
    );

    res.json(
      ApiResponse.success("Playlist unliked successfully", {
        playlistId,
        isLiked: false,
        likeCount: result.likeCount,
      })
    );
  } catch (error) {
    if (error.message.includes("not liked")) {
      return res
        .status(409)
        .json(ApiResponse.error("Playlist is not liked by user"));
    }
    throw error;
  }
});

/**
 * Get playlist like status for current user
 */
export const getPlaylistLikeStatus = catchAsync(async (req, res) => {
  const { playlistId } = req.params;

  if (!playlistId) {
    return res.status(400).json(ApiResponse.error("Playlist ID is required"));
  }

  const result = await PlaylistService.getPlaylistLikeStatus(
    playlistId,
    req.user?.id
  );

  res.json(ApiResponse.success("Like status retrieved successfully", result));
});

/**
 * Get current user's liked playlists
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
 * Get enhanced playlist statistics
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

/**
 * Create quick playlist with enhanced limits checking
 */
export const createQuickPlaylist = catchAsync(async (req, res) => {
  try {
    const userId = req.user.id;
    const userStatus = req.user.status || "USER";

    const playlist = await PlaylistService.createQuickPlaylist(
      userId,
      userStatus
    );

    res.status(201).json(
      ApiResponse.success("Quick playlist created successfully", {
        id: playlist._id,
        name: playlist.name,
        isDraft: playlist.isDraft,
      })
    );
  } catch (error) {
    console.error("Error creating quick playlist:", error);

    // Handle playlist limit exceeded error
    if (error.message.startsWith("PLAYLIST_LIMIT_EXCEEDED")) {
      const [, currentCount, limit] = error.message.split(":");

      return res.status(403).json(
        ApiResponse.error("Playlist limit exceeded", {
          errorCode: "PLAYLIST_LIMIT_EXCEEDED",
          currentCount: parseInt(currentCount),
          limit: parseInt(limit),
          userStatus: req.user.status || "USER",
        })
      );
    }

    // Handle other errors
    if (error.message.includes("Authentication")) {
      return res.status(401).json(ApiResponse.error("Authentication required"));
    }

    res.status(400).json(ApiResponse.error(error.message));
  }
});

/**
 * Publish playlist with permission checking
 */
export const publishPlaylist = catchAsync(async (req, res) => {
  const { id } = req.params;

  // Get playlist and check permissions
  const playlist = await PlaylistService.getPlaylistById(id, req.user.id);

  if (!checkEditPermissions(playlist, req.user.id, req.user.status)) {
    return res
      .status(403)
      .json(
        ApiResponse.error("You don't have permission to edit this playlist")
      );
  }

  const updatedPlaylist = await PlaylistService.updatePlaylist(id, {
    isDraft: false,
    privacy: req.body.privacy || "public",
  });

  res.json(
    ApiResponse.success("Playlist published successfully", updatedPlaylist)
  );
});

// ============ ADMIN PLATFORM PLAYLIST METHODS ============

/**
 * Get all platform playlists for admin panel
 * Returns featured playlists with enhanced admin data
 */
export const getPlatformPlaylists = catchAsync(async (req, res) => {
  const { page, limit, search } = req.query;

  // Get only featured playlists for admin panel
  const result = await PlaylistService.getAllPlaylists({
    page: parseInt(page) || 1,
    limit: parseInt(limit) || 20,
    search,
    category: "featured", // Only platform playlists
    privacy: "public",
    includeDrafts: true, // Include drafts for admin panel
  });

  res.json(
    ApiResponse.paginated(
      "Platform playlists retrieved successfully",
      result.playlists,
      result.pagination
    )
  );
});

/**
 * Create platform playlist (draft mode)
 * Creates a draft playlist that won't be visible to regular users
 */
export const createPlatformPlaylist = catchAsync(async (req, res) => {
  // Validate required fields
  if (!req.body.name) {
    return res.status(400).json(ApiResponse.error("Playlist name is required"));
  }

  // Data for platform playlist
  const playlistData = {
    name: req.body.name.trim(),
    owner: req.user.id,
    description: req.body.description || "",
    tracks: req.body.tracks || [],
    tags: req.body.tags || [],
    category: "featured", // Force featured for platform playlists
    privacy: "public",
    isDraft: true, // Create as draft
  };

  if (req.body.publish) {
    playlistData.isDraft = false;
  }

  const playlist = await PlaylistService.createPlaylist(
    playlistData,
    req.file // Cover file from multer
  );

  res.status(201).json(
    ApiResponse.success("Platform playlist draft created successfully", {
      ...playlist,
      isAdminPlaylist: true,
    })
  );
});

/**
 * Update platform playlist
 * Can publish draft or update existing playlist
 */
export const updatePlatformPlaylist = catchAsync(async (req, res) => {
  const { id } = req.params;

  if (!id) {
    return res.status(400).json(ApiResponse.error("Playlist ID is required"));
  }

  // Check that playlist exists and is featured
  const existingPlaylist = await PlaylistService.getPlaylistById(
    id,
    req.user.id
  );

  if (existingPlaylist.category !== "featured") {
    return res.status(400).json(
      ApiResponse.error("Only platform playlists can be managed here", {
        playlistCategory: existingPlaylist.category,
        requiredCategory: "featured",
      })
    );
  }

  // Prepare update data
  const updateData = {
    name: req.body.name,
    description: req.body.description,
    tags: req.body.tags || undefined,
    tracks: req.body.tracks || undefined,
    category: "featured", // Force keep as featured
    privacy: "public",
  };

  if (req.body.publish) {
    updateData.isDraft = false;
  } else {
    updateData.isDraft = true;
  }

  // Remove undefined fields
  Object.keys(updateData).forEach(
    (key) => updateData[key] === undefined && delete updateData[key]
  );

  const playlist = await PlaylistService.updatePlaylist(
    id,
    updateData,
    req.file
  );

  const action = updateData.isDraft === false ? "published" : "updated";

  res.json(
    ApiResponse.success(`Platform playlist ${action} successfully`, {
      ...playlist,
      isAdminPlaylist: true,
    })
  );
});

/**
 * Delete platform playlist
 * Removes playlist completely from database
 */
export const deletePlatformPlaylist = catchAsync(async (req, res) => {
  const { id } = req.params;

  if (!id) {
    return res.status(400).json(ApiResponse.error("Playlist ID is required"));
  }

  // Check that playlist exists and is featured
  const existingPlaylist = await PlaylistService.getPlaylistById(
    id,
    req.user.id
  );

  if (existingPlaylist.category !== "featured") {
    return res.status(400).json(
      ApiResponse.error("Only platform playlists can be deleted here", {
        playlistCategory: existingPlaylist.category,
        requiredCategory: "featured",
      })
    );
  }

  await PlaylistService.deletePlaylist(id);

  res.json(
    ApiResponse.success("Platform playlist deleted successfully", {
      deletedPlaylistId: id,
      deletedPlaylistName: existingPlaylist.name,
    })
  );
});

/**
 * Publish platform playlist
 * Converts draft to published playlist
 */
export const publishPlatformPlaylist = catchAsync(async (req, res) => {
  const { id } = req.params;

  if (!id) {
    return res.status(400).json(ApiResponse.error("Playlist ID is required"));
  }

  // Check that this is a draft platform playlist
  const existingPlaylist = await PlaylistService.getPlaylistById(
    id,
    req.user.id
  );

  if (existingPlaylist.category !== "featured") {
    return res
      .status(400)
      .json(ApiResponse.error("Only platform playlists can be published"));
  }

  if (!existingPlaylist.isDraft) {
    return res
      .status(400)
      .json(ApiResponse.error("Playlist is already published"));
  }

  // Check that playlist is ready for publishing
  if (!existingPlaylist.name || existingPlaylist.name.trim().length === 0) {
    return res
      .status(400)
      .json(ApiResponse.error("Playlist name is required for publishing"));
  }

  if (!existingPlaylist.tracks || existingPlaylist.tracks.length === 0) {
    return res
      .status(400)
      .json(
        ApiResponse.error(
          "Playlist must have at least one track to be published"
        )
      );
  }

  // Publish playlist
  const playlist = await PlaylistService.updatePlaylist(id, {
    isDraft: false,
    privacy: "public",
  });

  res.json(
    ApiResponse.success("Platform playlist published successfully", {
      ...playlist,
      isAdminPlaylist: true,
      wasPublished: true,
    })
  );
});

/**
 * Get platform playlist drafts
 * Returns only draft playlists for admin review
 */
export const getPlatformDrafts = catchAsync(async (req, res) => {
  const { page, limit } = req.query;

  const result = await PlaylistService.getAllPlaylists({
    page: parseInt(page) || 1,
    limit: parseInt(limit) || 20,
    category: "featured",
    privacy: "public",
    draftsOnly: true, // Only drafts
  });

  res.json(
    ApiResponse.paginated(
      "Platform playlist drafts retrieved successfully",
      result.playlists,
      result.pagination
    )
  );
});
