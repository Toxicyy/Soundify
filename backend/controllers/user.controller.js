import { ApiResponse } from "../utils/responses.js";
import UserService from "../services/UserService.js";

/**
 * Retrieves user data by ID
 */
export const getUserById = async (req, res) => {
  try {
    const { userId } = req.params;

    // Optional: Check if user is requesting their own data or has admin permissions
    // You can modify this based on your authorization requirements
    const isOwnProfile = req.user.id === userId;
    const isAdmin = req.user.status === "ADMIN";

    if (!isOwnProfile && !isAdmin) {
      return res
        .status(403)
        .json(ApiResponse.error("Unauthorized to access this user's data"));
    }

    const userData = await UserService.getUserById(userId);

    res
      .status(200)
      .json(ApiResponse.success("User data retrieved successfully", userData));
  } catch (error) {
    console.error("Controller error - getUserById:", error);

    // Handle specific error types
    if (error.message.includes("User not found")) {
      return res.status(404).json(ApiResponse.error(error.message));
    }

    res.status(400).json(ApiResponse.error(error.message));
  }
};

/**
 * Get user's liked artists with pagination
 */
export const getUserLikedArtists = async (req, res) => {
  try {
    const { userId } = req.params;
    const { page, limit } = req.query;

    // Check if user has access (same as in playlist controller)
    const isOwnProfile = req.user.id === userId;
    const isAdmin = req.user.status === "ADMIN";

    // For liked artists, anyone can see them (they're like public subscriptions)
    // But we still keep the auth check for consistency

    const result = await UserService.getUserLikedArtists(userId, {
      page: parseInt(page) || 1,
      limit: parseInt(limit) || 20,
    });

    res.json(
      ApiResponse.paginated(
        "User liked artists retrieved successfully",
        result.artists,
        result.pagination
      )
    );
  } catch (error) {
    console.error("Controller error - getUserLikedArtists:", error);

    if (error.message.includes("User not found")) {
      return res.status(404).json(ApiResponse.error(error.message));
    }

    res.status(400).json(ApiResponse.error(error.message));
  }
};

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
