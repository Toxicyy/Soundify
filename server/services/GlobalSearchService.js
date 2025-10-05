import TrackService from "./TrackService.js";
import ArtistService from "./ArtistService.js";
import AlbumService from "./AlbumService.js";
import PlaylistService from "./PlaylistService.js";

/**
 * Global search service for combining results from all entities
 * Implements search across tracks, artists, albums, and playlists
 * Provides unified search results with relevance scoring
 */
class GlobalSearchService {
  /**
   * Perform global search across all entities
   * @param {string} query - Search query
   * @param {Object} options - Search options
   * @returns {Promise<Object>} Combined search results
   */
  async globalSearch(query, options = {}) {
    const {
      limit = 10,
      categories = ["tracks", "artists", "albums", "playlists"],
      userId = null, // For access to private playlists
      includePrivate = false, // Include user's private playlists
    } = options;

    if (!query || query.trim().length === 0) {
      throw new Error("Search query cannot be empty");
    }

    const trimmedQuery = query.trim();
    const results = {
      query: trimmedQuery,
      tracks: [],
      artists: [],
      albums: [],
      playlists: [],
      totalResults: 0,
      searchTime: Date.now(),
    };

    try {
      // Perform parallel search across all categories
      const searchPromises = [];

      if (categories.includes("tracks")) {
        searchPromises.push(this.searchTracks(trimmedQuery, limit));
      }

      if (categories.includes("artists")) {
        searchPromises.push(this.searchArtists(trimmedQuery, limit));
      }

      if (categories.includes("albums")) {
        searchPromises.push(this.searchAlbums(trimmedQuery, limit));
      }

      if (categories.includes("playlists")) {
        searchPromises.push(
          this.searchPlaylists(trimmedQuery, limit, userId, includePrivate)
        );
      }

      // Wait for all results
      const searchResults = await Promise.allSettled(searchPromises);

      // Process results
      let resultIndex = 0;

      if (categories.includes("tracks")) {
        const tracksResult = searchResults[resultIndex++];
        if (tracksResult.status === "fulfilled") {
          results.tracks = tracksResult.value;
          results.totalResults += results.tracks.length;
        }
      }

      if (categories.includes("artists")) {
        const artistsResult = searchResults[resultIndex++];
        if (artistsResult.status === "fulfilled") {
          results.artists = artistsResult.value;
          results.totalResults += results.artists.length;
        }
      }

      if (categories.includes("albums")) {
        const albumsResult = searchResults[resultIndex++];
        if (albumsResult.status === "fulfilled") {
          results.albums = albumsResult.value;
          results.totalResults += results.albums.length;
        }
      }

      if (categories.includes("playlists")) {
        const playlistsResult = searchResults[resultIndex++];
        if (playlistsResult.status === "fulfilled") {
          results.playlists = playlistsResult.value;
          results.totalResults += results.playlists.length;
        }
      }

      results.searchTime = Date.now() - results.searchTime;
      return results;
    } catch (error) {
      throw new Error(`Global search failed: ${error.message}`);
    }
  }

  /**
   * Search tracks with error handling
   * @param {string} query - Search query
   * @param {number} limit - Result limit
   * @returns {Promise<Array>} Found tracks
   */
  async searchTracks(query, limit) {
    try {
      const trackResults = await TrackService.searchTracks(query, {
        page: 1,
        limit,
      });

      return trackResults.tracks.map((track) => ({
        ...track,
        type: "track",
        relevanceScore: this.calculateRelevance(query, track.name, track.genre),
      }));
    } catch (error) {
      console.error("Track search error:", error.message);
      return [];
    }
  }

  /**
   * Search artists with error handling
   * @param {string} query - Search query
   * @param {number} limit - Result limit
   * @returns {Promise<Array>} Found artists
   */
  async searchArtists(query, limit) {
    try {
      const artistResults = await ArtistService.searchArtists(query, { limit });

      return artistResults.artists.map((artist) => ({
        ...artist,
        type: "artist",
        relevanceScore: this.calculateRelevance(
          query,
          artist.name,
          artist.genres?.join(" ")
        ),
      }));
    } catch (error) {
      console.error("Artist search error:", error.message);
      return [];
    }
  }

  /**
   * Search albums with error handling
   * @param {string} query - Search query
   * @param {number} limit - Result limit
   * @returns {Promise<Array>} Found albums
   */
  async searchAlbums(query, limit) {
    try {
      const albumResults = await AlbumService.searchAlbum(query, { limit });

      return albumResults.albums.map((album) => ({
        ...album,
        type: "album",
        relevanceScore: this.calculateRelevance(
          query,
          album.name,
          album.genre?.join(" ")
        ),
      }));
    } catch (error) {
      console.error("Album search error:", error.message);
      return [];
    }
  }

  /**
   * Search playlists with error handling
   * @param {string} query - Search query
   * @param {number} limit - Result limit
   * @param {string} userId - User ID
   * @param {boolean} includePrivate - Include private playlists
   * @returns {Promise<Array>} Found playlists
   */
  async searchPlaylists(query, limit, userId, includePrivate) {
    try {
      const playlistResults = await PlaylistService.searchPlaylist(query, {
        limit,
      });
      let playlists = playlistResults.playlists;

      // Include user's private playlists if requested
      if (includePrivate && userId) {
        try {
          const userPlaylists = await PlaylistService.getUserPlaylists(userId, {
            page: 1,
            limit: limit,
            privacy: "private",
          });

          // Filter private playlists by query
          const filteredPrivatePlaylists = userPlaylists.playlists.filter(
            (playlist) =>
              playlist.name.toLowerCase().includes(query.toLowerCase())
          );

          playlists = [...playlists, ...filteredPrivatePlaylists];
        } catch (error) {
          console.warn("Error fetching private playlists:", error.message);
        }
      }

      return playlists.map((playlist) => ({
        ...playlist,
        type: "playlist",
        relevanceScore: this.calculateRelevance(
          query,
          playlist.name,
          playlist.tags?.join(" ")
        ),
      }));
    } catch (error) {
      console.error("Playlist search error:", error.message);
      return [];
    }
  }

  /**
   * Search with priority by content type
   * @param {string} query - Search query
   * @param {string} primaryType - Priority type for search
   * @param {Object} options - Search options
   * @returns {Promise<Object>} Results with priority
   */
  async searchWithPriority(query, primaryType, options = {}) {
    const { limit = 10, secondaryLimit = 5 } = options;

    const results = await this.globalSearch(query, {
      ...options,
      limit: primaryType === "tracks" ? limit : secondaryLimit,
    });

    // If there's a priority type, do additional search
    if (primaryType && results[primaryType]) {
      const primaryResults = await this.globalSearch(query, {
        ...options,
        categories: [primaryType],
        limit: limit,
      });

      results[primaryType] = primaryResults[primaryType];
    }

    return results;
  }

  /**
   * Get popular content for empty search
   * @param {Object} options - Options
   * @returns {Promise<Object>} Popular results
   */
  async getPopularContent(options = {}) {
    const { limit = 10 } = options;

    try {
      const results = {
        tracks: [],
        artists: [],
        albums: [],
        playlists: [],
        type: "popular",
      };

      // Get popular content in parallel
      const [tracksResult, artistsResult, albumsResult, playlistsResult] =
        await Promise.allSettled([
          TrackService.getAllTracks({ page: 1, limit, sortBy: "listenCount" }),
          ArtistService.getPopularArtists({ limit }),
          AlbumService.getAllAlbums({ page: 1, limit }),
          PlaylistService.getFeaturedPlaylists({ limit }),
        ]);

      if (tracksResult.status === "fulfilled") {
        results.tracks = tracksResult.value.tracks.map((track) => ({
          ...track,
          type: "track",
        }));
      }

      if (artistsResult.status === "fulfilled") {
        results.artists = artistsResult.value.artists.map((artist) => ({
          ...artist,
          type: "artist",
        }));
      }

      if (albumsResult.status === "fulfilled") {
        results.albums = albumsResult.value.albums.map((album) => ({
          ...album,
          type: "album",
        }));
      }

      if (playlistsResult.status === "fulfilled") {
        results.playlists = playlistsResult.value.map((playlist) => ({
          ...playlist,
          type: "playlist",
        }));
      }

      return results;
    } catch (error) {
      throw new Error(
        `Failed to get popular content: ${error.message}`
      );
    }
  }

  /**
   * Calculate search result relevance
   * @param {string} query - Search query
   * @param {string} title - Item title
   * @param {string} metadata - Additional metadata
   * @returns {number} Relevance score (0-100)
   */
  calculateRelevance(query, title, metadata = "") {
    const queryLower = query.toLowerCase();
    const titleLower = title.toLowerCase();
    const metadataLower = metadata?.toLowerCase() || "";

    let score = 0;

    // Exact match at start of title - highest priority
    if (titleLower.startsWith(queryLower)) {
      score += 50;
    }
    // Contains query in title
    else if (titleLower.includes(queryLower)) {
      score += 30;
    }

    // Contains query in metadata
    if (metadataLower.includes(queryLower)) {
      score += 20;
    }

    // Bonus for match length
    const matchLength = query.length / title.length;
    score += Math.floor(matchLength * 10);

    return Math.min(score, 100);
  }

  /**
   * Sort results by relevance
   * @param {Array} results - Results to sort
   * @returns {Array} Sorted results
   */
  sortByRelevance(results) {
    return results.sort((a, b) => {
      // First by relevance
      if (b.relevanceScore !== a.relevanceScore) {
        return b.relevanceScore - a.relevanceScore;
      }

      // Then by popularity (if exists)
      if (a.listenCount && b.listenCount) {
        return b.listenCount - a.listenCount;
      }

      if (a.followerCount && b.followerCount) {
        return b.followerCount - a.followerCount;
      }

      if (a.likeCount && b.likeCount) {
        return b.likeCount - a.likeCount;
      }

      // By creation date
      return new Date(b.createdAt) - new Date(a.createdAt);
    });
  }

  /**
   * Get search suggestions for autocomplete
   * @param {string} query - Partial query
   * @param {number} limit - Suggestion limit
   * @returns {Promise<Array>} Autocomplete suggestions
   */
  async getSearchSuggestions(query, limit = 5) {
    if (!query || query.trim().length < 2) {
      return [];
    }

    try {
      const results = await this.globalSearch(query, { limit: 3 });
      const suggestions = [];

      // Add suggestions from all categories
      results.tracks.forEach((track) => {
        suggestions.push({
          text: track.name,
          type: "track",
          secondary: track.artist?.name || "",
          id: track._id,
        });
      });

      results.artists.forEach((artist) => {
        suggestions.push({
          text: artist.name,
          type: "artist",
          secondary: `${artist.followerCount || 0} followers`,
          id: artist._id,
        });
      });

      results.albums.forEach((album) => {
        suggestions.push({
          text: album.name,
          type: "album",
          secondary: album.artist?.name || "",
          id: album._id,
        });
      });

      results.playlists.forEach((playlist) => {
        suggestions.push({
          text: playlist.name,
          type: "playlist",
          secondary: playlist.owner?.name || "",
          id: playlist._id,
        });
      });

      return suggestions.slice(0, limit);
    } catch (error) {
      console.error("Error getting suggestions:", error.message);
      return [];
    }
  }
}

export default new GlobalSearchService();