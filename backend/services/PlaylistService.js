import Playlist from "../models/Playlist.model.js";
import User from "../models/User.model.js";
import Track from "../models/Track.model.js";
import TrackService from "./TrackService.js";
import { uploadToB2 } from "../utils/upload.js";
import { generateSignedUrl, extractFileName } from "../utils/b2SignedUrl.js";
import { extractFileIdFromUrl, deleteFileFromB2 } from "../utils/b2Utils.js";

/**
 * Service for managing playlists and their associated data
 * Handles playlist CRUD operations, track management, and access control
 */
class PlaylistService {
  /**
   * Create new playlist with optional cover image
   * @param {Object} playlistData - Playlist data (name, owner, description, etc.)
   * @param {Object} coverFile - Cover image file from multer
   * @returns {Object} Created playlist document with signed URLs
   */
  async createPlaylist(playlistData, coverFile) {
    const { name, owner, description, tracks, tags, category, privacy } =
      playlistData;

    if (!name || !owner) {
      throw new Error("Playlist name and owner are required");
    }

    try {
      let coverUrl = null;
      let coverFileId = null;

      // Upload cover image if provided
      if (coverFile) {
        const uploadResult = await uploadToB2(coverFile, "playlistCovers");
        coverUrl = uploadResult.url;
        coverFileId =
          uploadResult.fileId || extractFileIdFromUrl(uploadResult.url);
      }

      // Parse tags from string or array
      let parsedTags = tags;
      if (typeof tags === "string") {
        try {
          parsedTags = JSON.parse(tags);
        } catch (e) {
          parsedTags = tags.split(",").map((tag) => tag.trim());
        }
      }

      const newPlaylist = new Playlist({
        name: name.trim(),
        owner: owner.trim(),
        description: description?.trim(),
        coverUrl,
        coverFileId,
        tracks: Array.isArray(tracks) ? tracks : [],
        tags: parsedTags || [],
        category: category || "user",
        privacy: privacy || "public",
      });

      const savedPlaylist = await newPlaylist.save();

      // Add playlist to user's playlists array
      await User.findByIdAndUpdate(
        owner,
        { $push: { playlists: savedPlaylist._id } },
        { new: true }
      );

      return await this.addSignedUrlsToPlaylistsSimple(savedPlaylist);
    } catch (error) {
      throw new Error(`Playlist creation failed: ${error.message}`);
    }
  }

  // В PlaylistService.js - добавить метод для генерации уникального имени
  async generateUniquePlaylistName(userId, baseName = "My Playlist") {
    try {
      // Находим все плейлисты пользователя с похожим именем
      const existingPlaylists = await Playlist.find({
        owner: userId,
        name: { $regex: `^${baseName}`, $options: "i" },
      })
        .select("name")
        .sort({ createdAt: -1 });

      if (existingPlaylists.length === 0) {
        return baseName;
      }

      // Извлекаем номера из существующих плейлистов
      const numbers = existingPlaylists
        .map((playlist) => {
          const match = playlist.name.match(
            new RegExp(`^${baseName}\\s*#?(\\d+)$`, "i")
          );
          return match ? parseInt(match[1]) : 0;
        })
        .filter((num) => !isNaN(num))
        .sort((a, b) => b - a);

      // Находим следующий доступный номер
      const nextNumber = numbers.length > 0 ? Math.max(...numbers) + 1 : 1;
      return `${baseName} #${nextNumber}`;
    } catch (error) {
      // Fallback с timestamp
      return `${baseName} #${Date.now()}`;
    }
  }

  // Новый метод для создания быстрого плейлиста
  async createQuickPlaylist(userId) {
    try {
      const playlistName = await this.generateUniquePlaylistName(userId);

      const playlistData = {
        name: playlistName,
        owner: userId,
        description: "",
        tracks: [],
        tags: [],
        category: "user",
        privacy: "private", // По умолчанию приватный
        isDraft: true, // Добавляем флаг черновика
      };

      return await this.createPlaylist(playlistData, null);
    } catch (error) {
      throw new Error(`Quick playlist creation failed: ${error.message}`);
    }
  }

  /**
   * Update playlist with optional new cover image
   * @param {string} id - Playlist ID
   * @param {Object} updates - Update data
   * @param {Object} coverFile - Optional new cover file
   * @returns {Object} Updated playlist with signed URLs
   */
  async updatePlaylist(id, updates, coverFile) {
    if (!id) {
      throw new Error("Playlist ID is required");
    }

    try {
      const existingPlaylist = await Playlist.findById(id);
      if (!existingPlaylist) {
        throw new Error("Playlist not found");
      }

      // Handle new cover upload
      if (coverFile) {
        // Delete old cover file if exists
        if (existingPlaylist.coverFileId) {
          try {
            await deleteFileFromB2(existingPlaylist.coverFileId);
          } catch (error) {
            console.warn(`Failed to delete old cover file: ${error.message}`);
          }
        }

        // Upload new cover
        const uploadResult = await uploadToB2(coverFile, "playlistCovers");
        updates.coverUrl = uploadResult.url;
        updates.coverFileId =
          uploadResult.fileId || extractFileIdFromUrl(uploadResult.url);
      }

      // Parse tags if provided
      if (updates.tags && typeof updates.tags === "string") {
        try {
          updates.tags = JSON.parse(updates.tags);
        } catch (e) {
          updates.tags = updates.tags.split(",").map((tag) => tag.trim());
        }
      }

      const updatedPlaylist = await Playlist.findByIdAndUpdate(
        id,
        { ...updates, updatedAt: new Date() },
        { new: true, runValidators: true }
      ).populate("owner", "name avatar");

      return await this.addSignedUrlsToPlaylistsSimple(updatedPlaylist);
    } catch (error) {
      throw new Error(`Playlist update failed: ${error.message}`);
    }
  }

  /**
   * Delete playlist and its cover file
   * @param {string} id - Playlist ID
   * @returns {boolean} Success status
   */
  async deletePlaylist(id) {
    if (!id) {
      throw new Error("Playlist ID is required");
    }

    try {
      const playlist = await Playlist.findById(id);
      if (!playlist) {
        throw new Error("Playlist not found");
      }

      // Delete cover file from B2 if exists
      if (playlist.coverFileId) {
        try {
          await deleteFileFromB2(playlist.coverFileId);
        } catch (error) {
          console.warn(`Failed to delete cover file: ${error.message}`);
        }
      }

      // Remove playlist from user's playlists array
      await User.findByIdAndUpdate(playlist.owner, {
        $pull: { playlists: id },
      });

      // Remove playlist from users' liked playlists
      await User.updateMany(
        { likedPlaylists: id },
        { $pull: { likedPlaylists: id } }
      );

      // Delete the playlist
      await Playlist.findByIdAndDelete(id);

      return true;
    } catch (error) {
      throw new Error(`Playlist deletion failed: ${error.message}`);
    }
  }

  /**
   * Get paginated list of playlists with search and filtering
   * @param {Object} params - Query parameters
   * @returns {Object} Playlists with pagination info
   */
  async getAllPlaylists({
    page = 1,
    limit = 20,
    search,
    category,
    privacy = "public",
  }) {
    try {
      const skip = (page - 1) * limit;
      const filter = { privacy }; // Only public playlists by default

      // Build search filter
      if (search) {
        filter.$or = [
          { name: { $regex: search, $options: "i" } },
          { description: { $regex: search, $options: "i" } },
        ];
      }

      if (category) filter.category = category;

      const [playlists, total] = await Promise.all([
        Playlist.find(filter)
          .populate("owner", "name avatar")
          .sort({ createdAt: -1 })
          .skip(skip)
          .limit(limit),
        Playlist.countDocuments(filter),
      ]);

      const totalPages = Math.ceil(total / limit);
      const playlistsWithSignedUrls = await this.addSignedUrlsToPlaylistsSimple(
        playlists
      );

      return {
        playlists: playlistsWithSignedUrls,
        pagination: {
          currentPage: page,
          totalPages,
          totalPlaylists: total,
          hasNextPage: page < totalPages,
          hasPreviousPage: page > 1,
        },
      };
    } catch (error) {
      throw new Error(`Failed to retrieve playlists: ${error.message}`);
    }
  }

  /**
   * Get playlist by ID with access control
   * @param {string} id - Playlist ID
   * @param {string} userId - User ID for access control
   * @returns {Object} Playlist with signed URLs
   */
  async getPlaylistById(id, userId = null) {
    if (!id) {
      throw new Error("Playlist ID is required");
    }

    try {
      const playlist = await Playlist.findById(id)
        .populate("owner", "username avatar")
        .populate("tracks", "name duration coverUrl");

      if (!playlist) {
        throw new Error("Playlist not found");
      }

      // Check access permissions
      if (!this.checkPlaylistAccess(playlist, userId)) {
        throw new Error("Access denied to this playlist");
      }

      return await this.addSignedUrlsToPlaylistsSimple(playlist);
    } catch (error) {
      throw new Error(`Failed to retrieve playlist: ${error.message}`);
    }
  }

  /**
   * Get tracks from specific playlist with pagination
   * @param {string} playlistId - Playlist ID
   * @param {Object} options - Pagination and sorting options
   * @param {string} userId - User ID for access control
   * @returns {Object} Tracks with pagination info
   */
  async getPlaylistTracks(
    playlistId,
    { page = 1, limit = 20, sortBy = "createdAt", sortOrder = -1 },
    userId = null
  ) {
    if (!playlistId) {
      throw new Error("Playlist ID is required");
    }

    try {
      const playlist = await Playlist.findById(playlistId).populate(
        "owner",
        "name"
      );
      if (!playlist) {
        throw new Error("Playlist not found");
      }

      // Check access permissions
      if (!this.checkPlaylistAccess(playlist, userId)) {
        throw new Error("Access denied to this playlist");
      }

      const skip = (page - 1) * limit;
      const sort = { [sortBy]: sortOrder };

      const [tracks, total] = await Promise.all([
        Track.find({ _id: { $in: playlist.tracks } })
          .populate("artist", "name avatar")
          .sort(sort)
          .skip(skip)
          .limit(limit),
        Track.countDocuments({ _id: { $in: playlist.tracks } }),
      ]);

      const totalPages = Math.ceil(total / limit);
      const tracksWithSignedUrls = await TrackService.addSignedUrlsToTracks(
        tracks
      );
      const playlistWithSignedUrls = await this.addSignedUrlsToPlaylistsSimple([
        playlist,
      ]);

      return {
        data: {
          playlist: {
            name: playlistWithSignedUrls[0].name,
            coverUrl: playlistWithSignedUrls[0].coverUrl,
            owner: {
              name: playlistWithSignedUrls[0].owner.name,
            },
          },
          tracks: tracksWithSignedUrls.map((track) => {
            const { hlsSegments, hlsSegmentFileIds, ...trackWithoutHls } =
              track;
            return trackWithoutHls;
          }),
        },
        pagination: {
          currentPage: page,
          totalPages,
          totalTracks: total,
          hasNextPage: page < totalPages,
          hasPrevPage: page > 1,
        },
      };
    } catch (error) {
      throw new Error(`Failed to retrieve playlist tracks: ${error.message}`);
    }
  }

  /**
   * Search playlists by name with prefix matching
   * @param {string} query - Search query
   * @param {Object} options - Search options
   * @returns {Object} Search results
   */
  async searchPlaylist(query, { limit = 10 }) {
    if (!query || query.trim().length === 0) {
      throw new Error("Search query cannot be empty");
    }

    try {
      const searchRegex = new RegExp(`^${query.trim()}`, "i");

      const playlists = await Playlist.find({
        name: searchRegex,
        privacy: "public", // Only search public playlists
      })
        .populate("owner", "name")
        .select("name coverUrl owner tags category totalDuration trackCount")
        .sort({ createdAt: -1 })
        .limit(limit);

      const playlistsWithSignedUrls = await this.addSignedUrlsToPlaylistsSimple(
        playlists
      );

      return {
        playlists: playlistsWithSignedUrls,
        count: playlists.length,
        query: query.trim(),
      };
    } catch (error) {
      throw new Error(`Playlist search failed: ${error.message}`);
    }
  }

  /**
   * Get featured playlists
   * @param {Object} options - Query options
   * @returns {Object} Featured playlists
   */
  async getFeaturedPlaylists({ limit = 10 }) {
    try {
      const playlists = await Playlist.find({
        category: "featured",
        privacy: "public",
      })
        .populate("owner", "name avatar")
        .sort({ likeCount: -1, createdAt: -1 })
        .limit(limit);

      return await this.addSignedUrlsToPlaylistsSimple(playlists);
    } catch (error) {
      throw new Error(
        `Failed to retrieve featured playlists: ${error.message}`
      );
    }
  }

  /**
   * Get playlists by category
   * @param {string} category - Playlist category
   * @returns {Array} Playlists in category
   */
  async getPlaylistsByCategory(category) {
    if (!category) {
      throw new Error("Category is required");
    }

    try {
      const playlists = await Playlist.find({
        category,
        privacy: "public",
      })
        .populate("owner", "name avatar")
        .sort({ createdAt: -1 });

      return await this.addSignedUrlsToPlaylistsSimple(playlists);
    } catch (error) {
      throw new Error(
        `Failed to retrieve playlists by category: ${error.message}`
      );
    }
  }

  /**
   * Get playlists by tag
   * @param {string} tag - Tag to filter by
   * @returns {Array} Playlists with specified tag
   */
  async getPlaylistsByTag(tag) {
    if (!tag) {
      throw new Error("Tag is required");
    }

    try {
      const playlists = await Playlist.find({
        tags: tag,
        privacy: "public",
      })
        .populate("owner", "name avatar")
        .sort({ createdAt: -1 });

      return await this.addSignedUrlsToPlaylistsSimple(playlists);
    } catch (error) {
      throw new Error(`Failed to retrieve playlists by tag: ${error.message}`);
    }
  }

  /**
   * Get playlists by user ID
   * @param {string} userId - User ID
   * @param {Object} options - Query options
   * @returns {Object} User's playlists with pagination
   */
  async getUserPlaylists(userId, { page = 1, limit = 20, privacy = null }) {
    if (!userId) {
      throw new Error("User ID is required");
    }

    try {
      const skip = (page - 1) * limit;
      const filter = { owner: userId };

      if (privacy) {
        filter.privacy = privacy;
      }

      const [playlists, total] = await Promise.all([
        Playlist.find(filter)
          .populate("owner", "name avatar")
          .sort({ createdAt: -1 })
          .skip(skip)
          .limit(limit),
        Playlist.countDocuments(filter),
      ]);

      const totalPages = Math.ceil(total / limit);
      const playlistsWithSignedUrls = await this.addSignedUrlsToPlaylistsSimple(
        playlists
      );

      return {
        playlists: playlistsWithSignedUrls,
        pagination: {
          currentPage: page,
          totalPages,
          totalPlaylists: total,
          hasNextPage: page < totalPages,
          hasPreviousPage: page > 1,
        },
      };
    } catch (error) {
      throw new Error(`Failed to retrieve user playlists: ${error.message}`);
    }
  }

  /**
   * Add track to playlist
   * @param {string} playlistId - Playlist ID
   * @param {string} trackId - Track ID
   * @returns {Object} Updated playlist
   */
  async addTrackToPlaylist(playlistId, trackId, userId) {
    if (!playlistId || !trackId) {
      throw new Error("Playlist ID and Track ID are required");
    }

    try {
      const [playlist, track] = await Promise.all([
        Playlist.findById(playlistId),
        Track.findById(trackId),
      ]);

      if (!playlist) throw new Error("Playlist not found");
      if (!track) throw new Error("Track not found");

      // Check if track is already in playlist
      if (playlist.tracks.includes(trackId)) {
        throw new Error("Track is already in this playlist");
      }

      // Add track to playlist
      await Playlist.findByIdAndUpdate(playlistId, {
        $push: { tracks: trackId },
      });

      return await this.getPlaylistById(playlistId, userId);
    } catch (error) {
      throw new Error(`Failed to add track to playlist: ${error.message}`);
    }
  }

  /**
   * Remove track from playlist
   * @param {string} playlistId - Playlist ID
   * @param {string} trackId - Track ID
   * @returns {Object} Updated playlist
   */
  async removeTrackFromPlaylist(playlistId, trackId) {
    if (!playlistId || !trackId) {
      throw new Error("Playlist ID and Track ID are required");
    }

    try {
      const playlist = await Playlist.findById(playlistId);
      if (!playlist) {
        throw new Error("Playlist not found");
      }

      // Remove track from playlist
      await Playlist.findByIdAndUpdate(playlistId, {
        $pull: { tracks: trackId },
      });

      return await this.getPlaylistById(playlistId);
    } catch (error) {
      throw new Error(`Failed to remove track from playlist: ${error.message}`);
    }
  }

  /**
   * Update track order in playlist
   * @param {string} playlistId - Playlist ID
   * @param {Array} trackIds - Ordered array of track IDs
   * @returns {Object} Updated playlist
   */
  async updateTrackOrder(playlistId, trackIds, skipValidation = false) {
    if (!playlistId || !Array.isArray(trackIds)) {
      throw new Error("Playlist ID and track IDs array are required");
    }

    try {
      const playlist = await Playlist.findById(playlistId);
      if (!playlist) {
        throw new Error("Playlist not found");
      }

      // Проверяем только если не пропускаем валидацию
      if (!skipValidation) {
        const validTrackIds = trackIds.filter((id) =>
          playlist.tracks.includes(id)
        );
        if (validTrackIds.length !== trackIds.length) {
          throw new Error("Some track IDs are not part of this playlist");
        }
      }

      await Playlist.findByIdAndUpdate(
        playlistId,
        { tracks: trackIds, updatedAt: new Date() },
        { new: true }
      );

      return await this.getPlaylistById(playlistId);
    } catch (error) {
      throw new Error(`Failed to update track order: ${error.message}`);
    }
  }

  /**
   * Like playlist
   * @param {string} playlistId - Playlist ID
   * @param {string} userId - User ID
   * @returns {Object} Updated playlist
   */
  async likePlaylist(playlistId, userId) {
    if (!playlistId || !userId) {
      throw new Error("Playlist ID and User ID are required");
    }

    try {
      const [playlist, user] = await Promise.all([
        Playlist.findById(playlistId),
        User.findById(userId),
      ]);

      if (!playlist) throw new Error("Playlist not found");
      if (!user) throw new Error("User not found");

      // Check if playlist is already liked by user
      if (user.likedPlaylists.includes(playlistId)) {
        throw new Error("Playlist is already liked by this user");
      }

      // Add playlist to user's liked playlists and increment like count
      await Promise.all([
        User.findByIdAndUpdate(userId, {
          $push: { likedPlaylists: playlistId },
        }),
        Playlist.findByIdAndUpdate(playlistId, {
          $inc: { likeCount: 1 },
        }),
      ]);

      return await this.getPlaylistById(playlistId);
    } catch (error) {
      throw new Error(`Failed to like playlist: ${error.message}`);
    }
  }

  /**
   * Unlike playlist
   * @param {string} playlistId - Playlist ID
   * @param {string} userId - User ID
   * @returns {Object} Updated playlist
   */
  async unlikePlaylist(playlistId, userId) {
    if (!playlistId || !userId) {
      throw new Error("Playlist ID and User ID are required");
    }

    try {
      const [playlist, user] = await Promise.all([
        Playlist.findById(playlistId),
        User.findById(userId),
      ]);

      if (!playlist) throw new Error("Playlist not found");
      if (!user) throw new Error("User not found");

      // Check if playlist is liked by user
      if (!user.likedPlaylists.includes(playlistId)) {
        throw new Error("Playlist is not liked by this user");
      }

      // Remove playlist from user's liked playlists and decrement like count
      await Promise.all([
        User.findByIdAndUpdate(userId, {
          $pull: { likedPlaylists: playlistId },
        }),
        Playlist.findByIdAndUpdate(playlistId, {
          $inc: { likeCount: -1 },
        }),
      ]);

      return await this.getPlaylistById(playlistId);
    } catch (error) {
      throw new Error(`Failed to unlike playlist: ${error.message}`);
    }
  }

  /**
   * Get liked playlists for user
   * @param {string} userId - User ID
   * @param {Object} options - Query options
   * @returns {Object} Liked playlists with pagination
   */
  async getLikedPlaylists(userId, { page = 1, limit = 20 }) {
    if (!userId) {
      throw new Error("User ID is required");
    }

    try {
      const user = await User.findById(userId).select("likedPlaylists");
      if (!user) {
        throw new Error("User not found");
      }

      return await this.getPlaylistsByIds(user.likedPlaylists, { page, limit });
    } catch (error) {
      throw new Error(`Failed to get liked playlists: ${error.message}`);
    }
  }

  /**
   * Get playlists by array of IDs
   * @param {Array} playlistIds - Array of playlist IDs
   * @param {Object} options - Query options
   * @returns {Object} Playlists with pagination
   */
  async getPlaylistsByIds(playlistIds, { page = 1, limit = 20 }) {
    if (!playlistIds || !Array.isArray(playlistIds)) {
      throw new Error("Playlist IDs array is required");
    }

    try {
      const skip = (page - 1) * limit;

      const [playlists, total] = await Promise.all([
        Playlist.find({ _id: { $in: playlistIds } })
          .populate("owner", "name avatar")
          .sort({ createdAt: -1 })
          .skip(skip)
          .limit(limit),
        Playlist.countDocuments({ _id: { $in: playlistIds } }),
      ]);

      const totalPages = Math.ceil(total / limit);
      const playlistsWithSignedUrls = await this.addSignedUrlsToPlaylistsSimple(
        playlists
      );

      return {
        playlists: playlistsWithSignedUrls,
        pagination: {
          currentPage: page,
          totalPages,
          totalPlaylists: total,
          hasNextPage: page < totalPages,
          hasPreviousPage: page > 1,
        },
      };
    } catch (error) {
      throw new Error(`Failed to get playlists by IDs: ${error.message}`);
    }
  }

  /**
   * Check if user has access to playlist
   * @param {Object} playlist - Playlist document
   * @param {string} userId - User ID
   * @returns {boolean} Access granted
   */
  checkPlaylistAccess(playlist, userId) {
    if (playlist.privacy === "public") return true;
    if (playlist.privacy === "unlisted") return true;
    if (playlist.privacy === "private") {
      return userId && playlist.owner._id.toString() === userId.toString();
    }
    return false;
  }

  /**
   * Validate playlist ownership
   * @param {string} playlistId - Playlist ID
   * @param {string} userId - User ID
   * @returns {Object} Playlist document
   */
  async validatePlaylistOwnership(playlistId, userId) {
    if (!playlistId || !userId) {
      throw new Error("Playlist ID and User ID are required");
    }

    try {
      const playlist = await Playlist.findById(playlistId);
      if (!playlist) {
        throw new Error("Playlist not found");
      }

      if (playlist.owner.toString() !== userId.toString()) {
        throw new Error("You don't have permission to modify this playlist");
      }

      return playlist;
    } catch (error) {
      throw new Error(`Ownership validation failed: ${error.message}`);
    }
  }

  /**
   * Get playlist statistics
   * @param {string} playlistId - Playlist ID
   * @returns {Object} Playlist statistics
   */
  async getPlaylistStats(playlistId) {
    if (!playlistId) {
      throw new Error("Playlist ID is required");
    }

    try {
      const playlist = await Playlist.findById(playlistId);
      if (!playlist) {
        throw new Error("Playlist not found");
      }

      return {
        trackCount: playlist.trackCount,
        totalDuration: playlist.totalDuration,
        likeCount: playlist.likeCount,
        createdAt: playlist.createdAt,
        updatedAt: playlist.updatedAt,
      };
    } catch (error) {
      throw new Error(`Failed to get playlist stats: ${error.message}`);
    }
  }

  /**
   * Add signed URLs to playlists (simple version for ObjectId references)
   * Processes playlist cover URLs and owner avatars
   * @param {Object|Array} playlists - Playlist(s) to process
   * @returns {Object|Array} Playlists with signed URLs
   */
  async addSignedUrlsToPlaylistsSimple(playlists) {
    try {
      const isArray = Array.isArray(playlists);
      const playlistsArray = isArray ? playlists : [playlists];

      const playlistsWithSignedUrls = await Promise.all(
        playlistsArray.map(async (playlist) => {
          let playlistObj;
          if (playlist.toObject) {
            playlistObj = playlist.toObject();
          } else {
            playlistObj = JSON.parse(JSON.stringify(playlist));
          }

          // Generate signed URL for playlist cover
          if (playlistObj.coverUrl) {
            const coverFileName = extractFileName(playlistObj.coverUrl);
            if (coverFileName) {
              try {
                const signedCoverUrl = await generateSignedUrl(
                  coverFileName,
                  7200
                );
                if (signedCoverUrl) {
                  playlistObj.coverUrl = signedCoverUrl;
                }
              } catch (urlError) {
                console.warn(
                  `Failed to generate signed URL for playlist cover ${coverFileName}:`,
                  urlError.message
                );
              }
            }
          }

          // Handle owner avatar if populated
          if (playlistObj.owner && playlistObj.owner.avatar) {
            const avatarFileName = extractFileName(playlistObj.owner.avatar);
            if (avatarFileName) {
              try {
                const signedAvatarUrl = await generateSignedUrl(
                  avatarFileName,
                  7200
                );
                if (signedAvatarUrl) {
                  playlistObj.owner.avatar = signedAvatarUrl;
                }
              } catch (urlError) {
                console.warn(
                  `Failed to generate signed URL for owner avatar ${avatarFileName}:`,
                  urlError.message
                );
              }
            }
          }

          return playlistObj;
        })
      );

      return isArray ? playlistsWithSignedUrls : playlistsWithSignedUrls[0];
    } catch (error) {
      console.error("Error creating signed URLs for playlists:", error);

      const isArray = Array.isArray(playlists);
      const fallbackPlaylists = isArray
        ? playlists.map((playlist) => {
            const playlistObj = playlist.toObject
              ? playlist.toObject()
              : { ...playlist };
            return {
              ...playlistObj,
              coverUrl: playlistObj.coverUrl || null,
              owner: playlistObj.owner
                ? {
                    ...playlistObj.owner,
                    avatar: playlistObj.owner.avatar || null,
                  }
                : playlistObj.owner,
            };
          })
        : (() => {
            const playlistObj = playlists.toObject
              ? playlists.toObject()
              : { ...playlists };
            return {
              ...playlistObj,
              coverUrl: playlistObj.coverUrl || null,
              owner: playlistObj.owner
                ? {
                    ...playlistObj.owner,
                    avatar: playlistObj.owner.avatar || null,
                  }
                : playlistObj.owner,
            };
          })();

      return fallbackPlaylists;
    }
  }
}

export default new PlaylistService();
