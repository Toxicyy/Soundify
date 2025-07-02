import { ApiResponse } from "../utils/responses.js";
import UserService from "../services/UserService.js";

/**
 * Adds a song to user's liked songs
 */
export const addLikedSong = async (req, res) => {
  try {
    const { userId, songId } = req.params;

    // Validate user authorization
    if (req.user.id !== userId) {
      return res
        .status(403)
        .json(ApiResponse.error("Unauthorized to modify this user's data"));
    }

    await UserService.addLikedSong(userId, songId);
    res.status(200).json(ApiResponse.success("Song added to favorites"));
  } catch (error) {
    console.error("Controller error - addLikedSong:", error);
    res.status(400).json(ApiResponse.error(error.message));
  }
};

/**
 * Removes a song from user's liked songs
 */
export const removeLikedSong = async (req, res) => {
  try {
    const { userId, songId } = req.params;

    // Validate user authorization
    if (req.user.id !== userId) {
      return res
        .status(403)
        .json(ApiResponse.error("Unauthorized to modify this user's data"));
    }

    await UserService.removeLikedSong(userId, songId);
    res.status(200).json(ApiResponse.success("Song removed from favorites"));
  } catch (error) {
    console.error("Controller error - removeLikedSong:", error);
    res.status(400).json(ApiResponse.error(error.message));
  }
};

/**
 * Retrieves user's liked songs with metadata
 */
export const getLikedSongs = async (req, res) => {
  try {
    const { userId } = req.params;

    // Validate user authorization
    if (req.user.id !== userId) {
      return res
        .status(403)
        .json(ApiResponse.error("Unauthorized to access this user's data"));
    }

    const likedSongs = await UserService.getLikedSongs(userId);

    res
      .status(200)
      .json(
        ApiResponse.success("Liked songs retrieved successfully", likedSongs)
      );
  } catch (error) {
    console.error("Controller error - getLikedSongs:", error);
    res.status(400).json(ApiResponse.error(error.message));
  }
};
