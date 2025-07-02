import User from "../models/User.model.js";
import TrackService from "./TrackService.js";

/**
 * Service for managing users and their liked songs
 */
class UserService {
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
}

export default new UserService();
