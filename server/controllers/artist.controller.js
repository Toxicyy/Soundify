/**
 * Artist Controller
 * Handles HTTP requests for artist operations
 * Manages artist CRUD operations, tracks, albums, and search functionality
 */

import ArtistService from "../services/ArtistService.js";
import { ApiResponse } from "../utils/responses.js";
import { catchAsync } from "../utils/helpers.js";

/**
 * Create new artist with avatar
 * Processes multipart form data with artist metadata and avatar file
 */
export const createArtist = catchAsync(async (req, res) => {
  const artist = await ArtistService.createArtist(
    req.body,
    req.file // single avatar file
  );

  res.status(201).json(ApiResponse.success("Artist created successfully", artist));
});

/**
 * Get paginated list of artists with optional filtering
 * Supports search by name and filtering by genre
 */
export const getAllArtists = catchAsync(async (req, res) => {
  const { page, limit, search, genre } = req.query;

  const result = await ArtistService.getAllArtists({
    page: parseInt(page) || 1,
    limit: parseInt(limit) || 20,
    search,
    genre,
  });

  res.json(
    ApiResponse.paginated(
      "Artists retrieved successfully",
      result.artists,
      result.pagination
    )
  );
});

/**
 * Get artist by ID with populated data
 */
export const getArtistById = catchAsync(async (req, res) => {
  const { id } = req.params;
  const artist = await ArtistService.getArtistById(id);

  res.json(ApiResponse.success("Artist retrieved successfully", artist));
});

/**
 * Get artist by slug (URL-friendly identifier)
 */
export const getArtistBySlug = catchAsync(async (req, res) => {
  const { slug } = req.params;
  const artist = await ArtistService.getArtistBySlug(slug);

  res.json(ApiResponse.success("Artist retrieved successfully", artist));
});

/**
 * Update existing artist with optional new avatar
 * Handles file replacement and cleanup of old avatar files
 */
export const updateArtist = catchAsync(async (req, res) => {
  const { id } = req.params;
  const artist = await ArtistService.updateArtist(id, req.body, req.file);

  res.json(ApiResponse.success("Artist updated successfully", artist));
});

/**
 * Delete artist and associated files
 */
export const deleteArtist = catchAsync(async (req, res) => {
  const { id } = req.params;
  const artist = await ArtistService.deleteArtist(id);

  res.json(ApiResponse.success("Artist deleted successfully"));
});

/**
 * Get tracks by artist with pagination
 * Returns artist's tracks with populated data and signed URLs
 */
export const getArtistTracks = catchAsync(async (req, res) => {
  const { id } = req.params;
  const { page, limit, sortBy, sortOrder } = req.query;

  const result = await ArtistService.getArtistTracks(id, {
    page: parseInt(page) || 1,
    limit: parseInt(limit) || 20,
    sortBy: sortBy || "createdAt",
    sortOrder: parseInt(sortOrder) || -1,
  });

  res.json(
    ApiResponse.paginated(
      "Artist tracks retrieved successfully",
      result.tracks,
      result.pagination
    )
  );
});

/**
 * Get albums by artist with pagination
 * Returns artist's albums with populated data and signed URLs
 */
export const getArtistAlbums = catchAsync(async (req, res) => {
  const { id } = req.params;
  const { page, limit } = req.query;

  const result = await ArtistService.getArtistAlbums(id, {
    page: parseInt(page) || 1,
    limit: parseInt(limit) || 20,
  });

  res.json(
    ApiResponse.paginated(
      "Artist albums retrieved successfully",
      result.albumsWithSignedUrls,
      result.pagination
    )
  );
});

/**
 * Search artists by query string
 * Returns artists matching the search query
 */
export const searchArtists = catchAsync(async (req, res) => {
  const { query, limit } = req.query;

  const result = await ArtistService.searchArtists(query, {
    limit: parseInt(limit) || 10,
  });

  res.json(ApiResponse.success("Search completed successfully", result));
});

/**
 * Get popular artists
 * Returns most followed/listened artists
 */
export const getPopularArtists = catchAsync(async (req, res) => {
  const { limit } = req.query;

  const result = await ArtistService.getPopularArtists({
    limit: parseInt(limit) || 15,
  });

  res.json(ApiResponse.success("Popular artists retrieved successfully", result));
});

/**
 * Become an artist (user registration as artist)
 * Creates artist profile for authenticated user
 */
export const becomeArtist = catchAsync(async (req, res) => {
  const userId = req.user.id;

  // Call service method to create artist profile for user
  const artist = await ArtistService.createArtistForUser(
    userId,
    req.body,
    req.file
  );

  res.status(201).json(
    ApiResponse.success("You have successfully become an artist!", {
      artist,
      message: "You can now create tracks and albums",
    })
  );
});