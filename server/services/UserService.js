import User from "../models/User.model.js";
import Artist from "../models/Artist.model.js";
import Playlist from "../models/Playlist.model.js";
import TrackService from "./TrackService.js";
import ArtistService from "./ArtistService.js";
import { uploadToB2 } from "../utils/upload.js";
import { extractFileName, generateSignedUrl } from "../utils/b2SignedUrl.js";

/**
 * Service for managing users and their data
 */
class UserService {
  /**
   * Retrieves user data by ID
   * @param {string} userId - The user ID
   * @returns {Promise<Object>} User data without sensitive information
   */
  async getUserById(userId) {
    if (!userId) {
      throw new Error("User ID is required");
    }

    try {
      const user = await User.findById(userId)
        .select("-password") // Exclude password from response
        .populate([
          {
            path: "playlists",
            select: "title description isPublic createdAt",
            options: { limit: 10 }, // Limit populated playlists for performance
          },
          {
            path: "likedArtists",
            select: "name avatar",
            options: { limit: 10 },
          },
        ]);

      if (!user) {
        throw new Error("User not found");
      }

      // Transform user data for response
      const userData = {
        _id: user._id,
        name: user.name,
        username: user.username,
        email: user.email,
        avatar: user.avatar,
        status: user.status,
        isVerified: user.isVerified,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
        // Statistics
        stats: {
          playlistsCount: user.playlists?.length || 0,
          likedSongsCount: user.likedSongs?.length || 0,
          likedPlaylistsCount: user.likedPlaylists?.length || 0,
          likedArtistsCount: user.likedArtists?.length || 0,
        },
        artistProfile: user.artistProfile,
        // Limited populated data
        playlists: user.playlists || [],
        likedArtists: user.likedArtists || [],
      };

      const userWithSignedAvatar = await this.addSignedUrlToUser(userData);

      return userWithSignedAvatar;
    } catch (error) {
      console.error("Error fetching user data:", error);
      throw new Error(`Failed to fetch user data: ${error.message}`);
    }
  }

  /**
   * Get user's liked artists with pagination
   * @param {string} userId - User ID
   * @param {Object} options - Query options
   * @returns {Object} Liked artists with pagination
   */
  async getUserLikedArtists(userId, { page = 1, limit = 20 }) {
    if (!userId) {
      throw new Error("User ID is required");
    }

    try {
      const user = await User.findById(userId).select("likedArtists");
      if (!user) {
        throw new Error("User not found");
      }

      const likedArtistIds = user.likedArtists || [];

      if (likedArtistIds.length === 0) {
        return {
          artists: [],
          pagination: {
            currentPage: page,
            totalPages: 0,
            totalArtists: 0,
            hasNextPage: false,
            hasPreviousPage: false,
          },
        };
      }

      // Calculate pagination
      const skip = (page - 1) * limit;
      const total = likedArtistIds.length;
      const totalPages = Math.ceil(total / limit);

      // Get paginated artist IDs
      const paginatedArtistIds = likedArtistIds.slice(skip, skip + limit);

      // Fetch artists with full data
      const artists = await Promise.all(
        paginatedArtistIds.map(async (artistId) => {
          try {
            return await ArtistService.getArtistById(artistId);
          } catch (error) {
            console.warn(`Failed to fetch artist ${artistId}:`, error.message);
            return null;
          }
        })
      );

      // Filter out null values (deleted/not found artists)
      const validArtists = artists.filter((artist) => artist !== null);

      return {
        artists: validArtists,
        pagination: {
          currentPage: page,
          totalPages,
          totalArtists: total,
          hasNextPage: page < totalPages,
          hasPreviousPage: page > 1,
        },
      };
    } catch (error) {
      console.error("Error fetching user liked artists:", error);
      throw new Error(`Failed to fetch liked artists: ${error.message}`);
    }
  }

  /**
   * Adds a song to user's liked songs list
   * Uses $addToSet to prevent duplicates
   */
  async addLikedSong(userId, songId) {
    if (!userId || !songId) {
      throw new Error("UserId and songId are required");
    }

    try {
      const user = await User.findByIdAndUpdate(
        userId,
        { $addToSet: { likedSongs: songId } },
        { new: true, runValidators: true }
      );

      if (!user) {
        throw new Error("User not found");
      }

      return user;
    } catch (error) {
      console.error("Error adding liked song:", error);
      throw new Error(`Failed to add song to favorites: ${error.message}`);
    }
  }

  /**
   * Removes a song from user's liked songs list
   */
  async removeLikedSong(userId, songId) {
    if (!userId || !songId) {
      throw new Error("UserId and songId are required");
    }

    try {
      const user = await User.findByIdAndUpdate(
        userId,
        { $pull: { likedSongs: songId } },
        { new: true }
      );

      if (!user) {
        throw new Error("User not found");
      }

      return user;
    } catch (error) {
      console.error("Error removing liked song:", error);
      throw new Error(`Failed to remove song from favorites: ${error.message}`);
    }
  }

  /**
   * Retrieves user's liked songs with signed URLs
   * Returns tracks in reverse order (latest first)
   */
  async getLikedSongs(userId) {
    if (!userId) {
      throw new Error("UserId is required");
    }

    try {
      const user = await User.findById(userId).populate({
        path: "likedSongs",
        populate: {
          path: "artist",
          select: "name avatar", // Added avatar for complete data
        },
      });

      if (!user) {
        throw new Error("User not found");
      }

      // Safe check for likedSongs existence
      const likedSongs = user.likedSongs || [];

      if (likedSongs.length === 0) {
        return [];
      }

      // Reverse array (latest added first)
      const reversedLikedSongs = [...likedSongs].reverse();

      // Add signed URLs to tracks
      const tracksWithSignedUrls = await TrackService.addSignedUrlsToTracks(
        reversedLikedSongs
      );

      return tracksWithSignedUrls;
    } catch (error) {
      console.error("Error fetching liked songs:", error);
      throw new Error(`Failed to fetch liked songs: ${error.message}`);
    }
  }

  /**
   * Updates user profile data
   * @param {string} userId - The user ID
   * @param {Object} updateData - Data to update
   * @returns {Promise<Object>} Updated user data
   */
  async updateUserProfile(userId, updateData) {
    if (!userId) {
      throw new Error("User ID is required");
    }

    try {
      // Remove sensitive fields that shouldn't be updated via this method
      const { password, status, isVerified, ...safeUpdateData } = updateData;

      const user = await User.findByIdAndUpdate(
        userId,
        { $set: safeUpdateData },
        { new: true, runValidators: true }
      ).select("-password");

      if (!user) {
        throw new Error("User not found");
      }

      return user;
    } catch (error) {
      console.error("Error updating user profile:", error);
      throw new Error(`Failed to update user profile: ${error.message}`);
    }
  }

  /**
   * Follow an artist
   * @param {string} userId - User ID
   * @param {string} artistId - Artist ID to follow
   * @returns {Promise<Object>} Updated user data
   */
  async followArtist(userId, artistId) {
    if (!userId || !artistId) {
      throw new Error("User ID and Artist ID are required");
    }

    try {
      // Check if artist exists
      const artist = await Artist.findById(artistId);
      if (!artist) {
        throw new Error("Artist not found");
      }

      // Check if user exists and is not already following the artist
      const user = await User.findById(userId);
      if (!user) {
        throw new Error("User not found");
      }

      if (user.likedArtists.includes(artistId)) {
        throw new Error("User is already following this artist");
      }

      // Add artist to user's liked artists and increment artist's follower count
      await Promise.all([
        User.findByIdAndUpdate(
          userId,
          { $addToSet: { likedArtists: artistId } },
          { new: true }
        ),
        Artist.findByIdAndUpdate(
          artistId,
          { $inc: { followerCount: 1 } },
          { new: true }
        ),
      ]);

      return {
        artistId,
        isFollowing: true,
        message: "Artist followed successfully",
      };
    } catch (error) {
      console.error("Error following artist:", error);
      throw new Error(`Failed to follow artist: ${error.message}`);
    }
  }

  /**
   * Unfollow an artist
   * @param {string} userId - User ID
   * @param {string} artistId - Artist ID to unfollow
   * @returns {Promise<Object>} Updated user data
   */
  async unfollowArtist(userId, artistId) {
    if (!userId || !artistId) {
      throw new Error("User ID and Artist ID are required");
    }

    try {
      // Check if user exists and is following the artist
      const user = await User.findById(userId);
      if (!user) {
        throw new Error("User not found");
      }

      if (!user.likedArtists.includes(artistId)) {
        throw new Error("User is not following this artist");
      }

      // Remove artist from user's liked artists and decrement artist's follower count
      await Promise.all([
        User.findByIdAndUpdate(
          userId,
          { $pull: { likedArtists: artistId } },
          { new: true }
        ),
        Artist.findByIdAndUpdate(
          artistId,
          { $inc: { followerCount: -1 } },
          { new: true }
        ),
      ]);

      return {
        artistId,
        isFollowing: false,
        message: "Artist unfollowed successfully",
      };
    } catch (error) {
      console.error("Error unfollowing artist:", error);
      throw new Error(`Failed to unfollow artist: ${error.message}`);
    }
  }

  /**
   * Like a playlist
   * @param {string} userId - User ID
   * @param {string} playlistId - Playlist ID to like
   * @returns {Promise<Object>} Updated user data
   */
  async likePlaylist(userId, playlistId) {
    if (!userId || !playlistId) {
      throw new Error("User ID and Playlist ID are required");
    }

    try {
      // Check if playlist exists
      const playlist = await Playlist.findById(playlistId);
      if (!playlist) {
        throw new Error("Playlist not found");
      }

      // Check if user exists and hasn't already liked the playlist
      const user = await User.findById(userId);
      if (!user) {
        throw new Error("User not found");
      }

      if (user.likedPlaylists.includes(playlistId)) {
        throw new Error("User has already liked this playlist");
      }

      // Add playlist to user's liked playlists and increment playlist's like count
      await Promise.all([
        User.findByIdAndUpdate(
          userId,
          { $addToSet: { likedPlaylists: playlistId } },
          { new: true }
        ),
        Playlist.findByIdAndUpdate(
          playlistId,
          { $inc: { likeCount: 1 } },
          { new: true }
        ),
      ]);

      return {
        playlistId,
        isLiked: true,
        message: "Playlist liked successfully",
      };
    } catch (error) {
      console.error("Error liking playlist:", error);
      throw new Error(`Failed to like playlist: ${error.message}`);
    }
  }

  /**
   * Unlike a playlist
   * @param {string} userId - User ID
   * @param {string} playlistId - Playlist ID to unlike
   * @returns {Promise<Object>} Updated user data
   */
  async unlikePlaylist(userId, playlistId) {
    if (!userId || !playlistId) {
      throw new Error("User ID and Playlist ID are required");
    }

    try {
      // Check if user exists and has liked the playlist
      const user = await User.findById(userId);
      if (!user) {
        throw new Error("User not found");
      }

      if (!user.likedPlaylists.includes(playlistId)) {
        throw new Error("User has not liked this playlist");
      }

      // Remove playlist from user's liked playlists and decrement playlist's like count
      await Promise.all([
        User.findByIdAndUpdate(
          userId,
          { $pull: { likedPlaylists: playlistId } },
          { new: true }
        ),
        Playlist.findByIdAndUpdate(
          playlistId,
          { $inc: { likeCount: -1 } },
          { new: true }
        ),
      ]);

      return {
        playlistId,
        isLiked: false,
        message: "Playlist unliked successfully",
      };
    } catch (error) {
      console.error("Error unliking playlist:", error);
      throw new Error(`Failed to unlike playlist: ${error.message}`);
    }
  }

  /**
   * Updates user profile data including avatar
   * @param {string} userId - The user ID
   * @param {Object} updateData - Data to update
   * @param {File} avatarFile - Avatar file (optional)
   * @returns {Promise<Object>} Updated user data
   */
  async updateUserProfile(userId, updateData, avatarFile) {
    if (!userId) {
      throw new Error("User ID is required");
    }

    try {
      // Handle avatar upload if provided
      if (avatarFile) {
        const uploadResult = await uploadToB2(avatarFile, "userAvatars");

        if (typeof uploadResult === "string") {
          updateData.avatar = uploadResult; // старый формат
        } else {
          updateData.avatar = uploadResult.url; // новый формат
          updateData.avatarFileId = uploadResult.fileId;
        }
      }

      // Remove sensitive fields that shouldn't be updated via this method
      const {
        password,
        status,
        isVerified,
        artistProfile,
        playlists,
        likedSongs,
        likedPlaylists,
        likedArtists,
        ...safeUpdateData
      } = updateData;

      // Ensure username is lowercase
      if (safeUpdateData.username) {
        safeUpdateData.username = safeUpdateData.username.toLowerCase();
      }

      const user = await User.findByIdAndUpdate(
        userId,
        {
          $set: {
            ...safeUpdateData,
            updatedAt: new Date(),
          },
        },
        { new: true, runValidators: true }
      ).select("-password");

      if (!user) {
        throw new Error("User not found");
      }

      // Add signed URL for avatar if it exists
      const userWithSignedAvatar = await this.addSignedUrlToUser(user);

      return userWithSignedAvatar;
    } catch (error) {
      console.error("Error updating user profile:", error);
      throw new Error(`Failed to update user profile: ${error.message}`);
    }
  }

  /**
   * Add signed URL to user avatar
   * @param {Object} user - User object
   * @returns {Promise<Object>} User with signed avatar URL
   */
  async addSignedUrlToUser(user) {
    try {
      const userObj = user.toObject ? user.toObject() : user;

      if (userObj.avatar) {
        const fileName = extractFileName(userObj.avatar);
        if (fileName) {
          const signedUrl = await generateSignedUrl(fileName, 7200); // 2 hours
          if (signedUrl) {
            userObj.avatar = signedUrl;
          }
        }
      }

      return userObj;
    } catch (error) {
      console.error("Error creating signed URL for user avatar:", error);
      // Return user with null avatar if error occurs
      return {
        ...(user.toObject ? user.toObject() : user),
        avatar: null,
      };
    }
  }

  /**
   * Get current hour timestamp (rounded to hour start)
   * @returns {number} Unix timestamp for current hour
   */
  getCurrentHourTimestamp() {
    const now = new Date();
    const hourStart = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate(),
      now.getHours(),
      0,
      0,
      0
    );
    return hourStart.getTime();
  }

  /**
   * Sync skip data from frontend and validate
   * @param {string} userId - User ID
   * @param {number} skipCount - Skip count from frontend
   * @returns {Promise<Object>} Sync result with validation
   */
  async syncSkipData(userId, skipCount) {
    if (!userId) {
      throw new Error("User ID is required");
    }

    try {
      const user = await User.findById(userId).select("status skipTracking");
      if (!user) {
        throw new Error("User not found");
      }

      // Premium users don't have skip limits
      if (user.status === "PREMIUM" || user.status === "ADMIN") {
        return {
          success: true,
          canSkip: true,
          isUnlimited: true,
          message: "Premium user - unlimited skips",
        };
      }

      const currentHourTimestamp = this.getCurrentHourTimestamp();
      const FREE_SKIP_LIMIT = 6;

      // Check if user is currently blocked
      if (
        user.skipTracking?.blockedUntil &&
        new Date() < user.skipTracking.blockedUntil
      ) {
        const blockEndTime = new Date(user.skipTracking.blockedUntil);
        return {
          success: false,
          blocked: true,
          canSkip: false,
          message: `Skip limit exceeded. Try again at ${blockEndTime.toLocaleTimeString()}`,
          unblockTime: blockEndTime,
        };
      }

      // If it's a new hour, reset the counter
      if (
        !user.skipTracking?.hourTimestamp ||
        user.skipTracking.hourTimestamp < currentHourTimestamp
      ) {
        await User.findByIdAndUpdate(userId, {
          "skipTracking.count": Math.min(skipCount, FREE_SKIP_LIMIT), // Don't trust frontend completely
          "skipTracking.hourTimestamp": currentHourTimestamp,
          "skipTracking.blockedUntil": null,
        });

        return {
          success: true,
          canSkip: skipCount < FREE_SKIP_LIMIT,
          remainingSkips: Math.max(0, FREE_SKIP_LIMIT - skipCount),
          resetTime: new Date(currentHourTimestamp + 60 * 60 * 1000), // Next hour
          message: "New hour - skip count reset",
        };
      }

      // Same hour - validate the data
      const serverSkipCount = user.skipTracking.count || 0;
      const frontendSkipCount = skipCount || 0;

      // Anti-cheat: if frontend reports significantly less skips, it's suspicious
      if (serverSkipCount > frontendSkipCount + 1) {
        // Allow 1 skip difference for race conditions
        console.warn(
          `Suspicious skip activity detected for user ${userId}: server=${serverSkipCount}, frontend=${frontendSkipCount}`
        );

        // Block user for 1 hour
        const blockUntil = new Date(Date.now() + 60 * 60 * 1000);
        await User.findByIdAndUpdate(userId, {
          "skipTracking.blockedUntil": blockUntil,
        });

        return {
          success: false,
          blocked: true,
          canSkip: false,
          message:
            "Suspicious activity detected. Skip function temporarily disabled.",
          unblockTime: blockUntil,
          reason: "anti_cheat",
        };
      }

      // Update server count to match frontend (trust frontend if it's higher but reasonable)
      const newSkipCount = Math.min(
        Math.max(serverSkipCount, frontendSkipCount),
        FREE_SKIP_LIMIT + 2
      ); // Allow slight buffer

      await User.findByIdAndUpdate(userId, {
        "skipTracking.count": newSkipCount,
      });

      const remainingSkips = Math.max(0, FREE_SKIP_LIMIT - newSkipCount);
      const canSkip = remainingSkips > 0;

      // If limit exceeded, block for the rest of the hour
      if (!canSkip && !user.skipTracking?.blockedUntil) {
        const blockUntil = new Date(currentHourTimestamp + 60 * 60 * 1000); // Until next hour
        await User.findByIdAndUpdate(userId, {
          "skipTracking.blockedUntil": blockUntil,
        });

        return {
          success: false,
          blocked: true,
          canSkip: false,
          message: `Skip limit reached (${FREE_SKIP_LIMIT}/hour). Upgrade to Premium for unlimited skips!`,
          unblockTime: blockUntil,
          upgradeMessage: true,
        };
      }

      return {
        success: true,
        canSkip,
        remainingSkips,
        totalLimit: FREE_SKIP_LIMIT,
        resetTime: new Date(currentHourTimestamp + 60 * 60 * 1000),
        message: canSkip
          ? `${remainingSkips} skips remaining`
          : "Skip limit reached",
      };
    } catch (error) {
      console.error("Error syncing skip data:", error);
      throw new Error(`Failed to sync skip data: ${error.message}`);
    }
  }
}

export default new UserService();
