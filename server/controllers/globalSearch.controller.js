import GlobalSearchService from "../services/GlobalSearchService.js";
import TrackService from "../services/TrackService.js";
import ArtistService from "../services/ArtistService.js";
import AlbumService from "../services/AlbumService.js";
import PlaylistService from "../services/PlaylistService.js";
import { ApiResponse } from "../utils/responses.js";
import { catchAsync } from "../utils/helpers.js";

/**
 * Global search controller handling HTTP requests for search operations
 * Manages unified search across tracks, artists, albums, and playlists
 */

/**
 * Global search across all entities
 * Searches tracks, artists, albums, and playlists simultaneously
 */
export const globalSearch = catchAsync(async (req, res) => {
  const {
    q: query,
    limit = 10,
    categories = "tracks,artists,albums,playlists",
    includePrivate = false,
  } = req.query;

  if (!query || query.trim().length === 0) {
    return res.status(400).json(ApiResponse.error("Search query is required"));
  }

  const categoriesArray = categories.split(",").map((cat) => cat.trim());
  const userId = req.user?.id || null;

  const results = await GlobalSearchService.globalSearch(query, {
    limit: parseInt(limit),
    categories: categoriesArray,
    userId,
    includePrivate: includePrivate === "true",
  });

  // Sort results by relevance
  if (results.tracks.length > 0) {
    results.tracks = GlobalSearchService.sortByRelevance(results.tracks);
  }
  if (results.artists.length > 0) {
    results.artists = GlobalSearchService.sortByRelevance(results.artists);
  }
  if (results.albums.length > 0) {
    results.albums = GlobalSearchService.sortByRelevance(results.albums);
  }
  if (results.playlists.length > 0) {
    results.playlists = GlobalSearchService.sortByRelevance(results.playlists);
  }

  res.json(ApiResponse.success("Search completed successfully", results));
});

/**
 * Search with priority for specific content type
 * Returns more results for the specified primary type
 */
export const searchWithPriority = catchAsync(async (req, res) => {
  const {
    q: query,
    type: primaryType = "tracks",
    limit = 10,
    secondaryLimit = 5,
  } = req.query;

  if (!query || query.trim().length === 0) {
    return res.status(400).json(ApiResponse.error("Search query is required"));
  }

  const validTypes = ["tracks", "artists", "albums", "playlists"];
  if (!validTypes.includes(primaryType)) {
    return res.status(400).json(ApiResponse.error("Invalid content type"));
  }

  const userId = req.user?.id || null;

  const results = await GlobalSearchService.searchWithPriority(
    query,
    primaryType,
    {
      limit: parseInt(limit),
      secondaryLimit: parseInt(secondaryLimit),
      userId,
    }
  );

  res.json(
    ApiResponse.success("Priority search completed successfully", results)
  );
});

/**
 * Get popular content for empty search state
 * Returns trending tracks, artists, albums, and playlists
 */
export const getPopularContent = catchAsync(async (req, res) => {
  const { limit = 10 } = req.query;

  const results = await GlobalSearchService.getPopularContent({
    limit: parseInt(limit),
  });

  res.json(
    ApiResponse.success("Popular content retrieved successfully", results)
  );
});

/**
 * Get search suggestions for autocomplete
 * Returns quick suggestions based on partial query
 */
export const getSearchSuggestions = catchAsync(async (req, res) => {
  const { q: query, limit = 5 } = req.query;

  if (!query || query.trim().length < 2) {
    return res.json(
      ApiResponse.success("Suggestions retrieved successfully", [])
    );
  }

  const suggestions = await GlobalSearchService.getSearchSuggestions(
    query,
    parseInt(limit)
  );

  res.json(
    ApiResponse.success("Suggestions retrieved successfully", suggestions)
  );
});

/**
 * Search within specific category only
 * Delegates to appropriate service based on category
 */
export const searchByCategory = catchAsync(async (req, res) => {
  const { category } = req.params;
  const { q: query, limit = 20, page = 1 } = req.query;

  if (!query || query.trim().length === 0) {
    return res.status(400).json(ApiResponse.error("Search query is required"));
  }

  const validCategories = ["tracks", "artists", "albums", "playlists"];
  if (!validCategories.includes(category)) {
    return res.status(400).json(ApiResponse.error("Invalid category"));
  }

  const userId = req.user?.id || null;
  let results;

  switch (category) {
    case "tracks":
      results = await TrackService.searchTracks(query, {
        page: parseInt(page),
        limit: parseInt(limit),
      });
      break;

    case "artists":
      results = await ArtistService.searchArtists(query, {
        limit: parseInt(limit),
      });
      break;

    case "albums":
      results = await AlbumService.searchAlbum(query, {
        limit: parseInt(limit),
      });
      break;

    case "playlists":
      results = await PlaylistService.searchPlaylist(query, {
        limit: parseInt(limit),
      });
      break;

    default:
      return res.status(400).json(ApiResponse.error("Unsupported category"));
  }

  res.json(
    ApiResponse.success(`${category} search completed successfully`, results)
  );
});

/**
 * Get user's search history
 * Returns previously searched terms for the authenticated user
 */
export const getSearchHistory = catchAsync(async (req, res) => {
  const { limit = 10 } = req.query;
  const userId = req.user?.id;

  if (!userId) {
    return res.status(401).json(ApiResponse.error("Authentication required"));
  }

  // TODO: Implement search history storage in database
  const history = {
    history: [],
    message: "Search history not implemented yet",
  };

  res.json(
    ApiResponse.success("Search history retrieved successfully", history)
  );
});

/**
 * Clear user's search history
 * Removes all search history for the authenticated user
 */
export const clearSearchHistory = catchAsync(async (req, res) => {
  const userId = req.user?.id;

  if (!userId) {
    return res.status(401).json(ApiResponse.error("Authentication required"));
  }

  // TODO: Implement search history clearing in database

  res.json(ApiResponse.success("Search history cleared successfully"));
});
