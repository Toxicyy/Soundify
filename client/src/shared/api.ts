import type { ArtistCreate } from "../Pages/BecomeAnArtist";
import type { Playlist } from "../types/Playlist";

export const BASEURL = "http://localhost:5000";

// Helper function to get auth headers
const getAuthHeaders = (includeAuth = true) => {
  const headers: HeadersInit = {
    "Content-Type": "application/json",
  };

  if (includeAuth) {
    const token = localStorage.getItem("token");
    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }
  }

  return headers;
};

// Helper function to build query string
const buildQueryString = (params: Record<string, any>) => {
  const filtered = Object.entries(params).filter(
    ([_, value]) => value !== null && value !== undefined && value !== ""
  );

  if (filtered.length === 0) return "";

  const queryString = new URLSearchParams(
    filtered.map(([key, value]) => [key, String(value)])
  ).toString();

  return `?${queryString}`;
};

export const api = {
  auth: {
    register: async (
      email: string,
      password: string,
      name: string,
      username: string
    ) => {
      return await fetch(`${BASEURL}/api/auth/register`, {
        method: "POST",
        headers: getAuthHeaders(false),
        body: JSON.stringify({ email, password, name, username }),
      });
    },

    login: async (email: string, password: string) => {
      return fetch(`${BASEURL}/api/auth/login`, {
        method: "POST",
        headers: getAuthHeaders(false),
        body: JSON.stringify({ email, password }),
      });
    },

    // Change password
    changePassword: async (
      currentPassword: string,
      newPassword: string,
      confirmPassword: string
    ) => {
      return fetch(`${BASEURL}/api/auth/change-password`, {
        method: "PUT",
        headers: getAuthHeaders(),
        body: JSON.stringify({ currentPassword, newPassword, confirmPassword }),
      });
    },
  },

  user: {
    getById: async (userId: string) => {
      return fetch(`${BASEURL}/api/users/${userId}`, {
        headers: getAuthHeaders(),
      });
    },

    getPlaylists: async (
      userId: string,
      options: {
        page?: number;
        limit?: number;
        privacy?: "public" | "private" | "unlisted";
      } = {}
    ) => {
      const query = buildQueryString(options);
      return fetch(`${BASEURL}/api/users/${userId}/playlists${query}`, {
        headers: getAuthHeaders(),
      });
    },

    /**
     * Get user's liked playlists
     * @param userId - ID of the user
     * @param options - Pagination options
     * @returns Promise<Response> - API response with liked playlists
     */
    getLikedPlaylists: async (
      userId: string,
      options: { page?: number; limit?: number } = {}
    ): Promise<Response> => {
      const token = localStorage.getItem("token");
      const params = new URLSearchParams();

      if (options.page) params.append("page", options.page.toString());
      if (options.limit) params.append("limit", options.limit.toString());

      return fetch(
        `http://localhost:5000/api/users/${userId}/liked-playlists?${params}`,
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );
    },

    getLikedArtists: async (
      userId: string,
      options: {
        page?: number;
        limit?: number;
      } = {}
    ) => {
      const query = buildQueryString(options);
      return fetch(`${BASEURL}/api/users/${userId}/liked-artists${query}`, {
        headers: getAuthHeaders(),
      });
    },

    getLikedSongs: async (userId: string) => {
      return fetch(`${BASEURL}/api/users/${userId}/liked-songs`, {
        headers: getAuthHeaders(),
      });
    },

    likeSong: async (userId: string, songId: string) => {
      return fetch(`${BASEURL}/api/users/${userId}/like/${songId}`, {
        method: "PATCH",
        headers: getAuthHeaders(),
      });
    },

    unlikeSong: async (userId: string, songId: string) => {
      return fetch(`${BASEURL}/api/users/${userId}/unlike/${songId}`, {
        method: "PATCH",
        headers: getAuthHeaders(),
      });
    },

    // New follow/like methods
    followArtist: async (userId: string, artistId: string) => {
      return fetch(`${BASEURL}/api/users/${userId}/follow/artist/${artistId}`, {
        method: "PUT",
        headers: getAuthHeaders(),
      });
    },

    unfollowArtist: async (userId: string, artistId: string) => {
      return fetch(
        `${BASEURL}/api/users/${userId}/unfollow/artist/${artistId}`,
        {
          method: "PUT",
          headers: getAuthHeaders(),
        }
      );
    },

    /**
     * Like a playlist
     * @param userId - ID of the user liking the playlist
     * @param playlistId - ID of the playlist to like
     * @returns Promise<Response> - API response
     */
    likePlaylist: async (
      userId: string,
      playlistId: string
    ): Promise<Response> => {
      const token = localStorage.getItem("token");

      return fetch(`http://localhost:5000/api/playlists/${playlistId}/like`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ userId }),
      });
    },

    /**
     * Unlike a playlist
     * @param userId - ID of the user unliking the playlist
     * @param playlistId - ID of the playlist to unlike
     * @returns Promise<Response> - API response
     */
    unlikePlaylist: async (
      userId: string,
      playlistId: string
    ): Promise<Response> => {
      const token = localStorage.getItem("token");

      return fetch(`http://localhost:5000/api/playlists/${playlistId}/like`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ userId }),
      });
    },

    // Update user profile
    updateProfile: async (userId: string, profileData: FormData) => {
      return fetch(`${BASEURL}/api/users/${userId}/profile`, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
        body: profileData,
      });
    },

    // Skip tracking
    syncSkipData: async (skipCount: number) => {
      return fetch(`${BASEURL}/api/users/skip-sync`, {
        method: "POST",
        headers: getAuthHeaders(),
        body: JSON.stringify({ skipCount }),
      });
    },
  },

  artist: {
    getAll: async (
      options: {
        page?: number;
        limit?: number;
        search?: string;
        genre?: string;
      } = {}
    ) => {
      const query = buildQueryString(options);
      return fetch(`${BASEURL}/api/artists${query}`, {
        headers: getAuthHeaders(false),
      });
    },

    getById: async (artistId: string) => {
      return fetch(`${BASEURL}/api/artists/${artistId}`, {
        headers: getAuthHeaders(false),
      });
    },

    getBySlug: async (slug: string) => {
      return fetch(`${BASEURL}/api/artists/slug/${slug}`, {
        headers: getAuthHeaders(false),
      });
    },

    getTracks: async (
      artistId: string,
      options: {
        page?: number;
        limit?: number;
        sortBy?: string;
        sortOrder?: number;
      } = {}
    ) => {
      const query = buildQueryString(options);
      return fetch(`${BASEURL}/api/artists/${artistId}/tracks${query}`, {
        headers: getAuthHeaders(false),
      });
    },

    getAlbums: async (
      artistId: string,
      options: {
        page?: number;
        limit?: number;
      } = {}
    ) => {
      const query = buildQueryString(options);
      return fetch(`${BASEURL}/api/artists/${artistId}/albums${query}`, {
        headers: getAuthHeaders(false),
      });
    },

    search: async (query: string, options: { limit?: number } = {}) => {
      const params = buildQueryString({ query, ...options });
      return fetch(`${BASEURL}/api/artists/search${params}`, {
        headers: getAuthHeaders(false),
      });
    },

    getPopular: async (options: { limit?: number } = {}) => {
      const query = buildQueryString(options);
      return fetch(`${BASEURL}/api/artists/popular${query}`, {
        headers: getAuthHeaders(false),
      });
    },

    becomeAnArtist: async (artistData: ArtistCreate) => {
      const formData = new FormData();
      formData.append("name", artistData.name);
      formData.append("bio", artistData.bio);
      formData.append("genres", JSON.stringify(artistData.genres));
      formData.append("socialLinks", JSON.stringify(artistData.socialLinks));
      if (artistData.imageFile) {
        formData.append("avatar", artistData.imageFile);
      }
      return fetch(`${BASEURL}/api/artists/become-artist`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
        body: formData,
      });
    },

    /**
     * Like an artist
     * @param artistId - ID of the artist to like
     * @returns Promise<Response> - API response
     */
    like: async (artistId: string): Promise<Response> => {
      return fetch(`${BASEURL}/api/artists/${artistId}/like`, {
        method: "POST",
        headers: getAuthHeaders(),
      });
    },

    /**
     * Unlike an artist
     * @param artistId - ID of the artist to unlike
     * @returns Promise<Response> - API response
     */
    unlike: async (artistId: string): Promise<Response> => {
      return fetch(`${BASEURL}/api/artists/${artistId}/like`, {
        method: "DELETE",
        headers: getAuthHeaders(),
      });
    },
  },

  playlist: {
    getAll: async (
      options: {
        page?: number;
        limit?: number;
        search?: string;
        category?: string;
        privacy?: "public" | "private" | "unlisted";
      } = {}
    ) => {
      const query = buildQueryString(options);
      return fetch(`${BASEURL}/api/playlists${query}`, {
        headers: getAuthHeaders(false),
      });
    },

    getById: async (playlistId: string) => {
      return fetch(`${BASEURL}/api/playlists/${playlistId}`, {
        headers: getAuthHeaders(),
      });
    },

    getTracks: async (
      playlistId: string,
      options: {
        page?: number;
        limit?: number;
      } = {}
    ) => {
      const query = buildQueryString(options);
      return fetch(`${BASEURL}/api/playlists/${playlistId}/tracks${query}`, {
        headers: getAuthHeaders(),
      });
    },

    create: async (playlistData: FormData) => {
      return fetch(`${BASEURL}/api/playlists`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
        body: playlistData,
      });
    },

    createQuick: async () => {
      return fetch(`${BASEURL}/api/playlists/quick`, {
        method: "POST",
        headers: getAuthHeaders(),
      });
    },

    update: async (playlistId: string, playlistData: FormData) => {
      return fetch(`${BASEURL}/api/playlists/${playlistId}`, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
        body: playlistData,
      });
    },

    delete: async (playlistId: string) => {
      return fetch(`${BASEURL}/api/playlists/${playlistId}`, {
        method: "DELETE",
        headers: getAuthHeaders(),
      });
    },

    addTrack: async (playlistId: string, trackId: string) => {
      return fetch(`${BASEURL}/api/playlists/${playlistId}/tracks/${trackId}`, {
        method: "POST",
        headers: getAuthHeaders(),
      });
    },

    removeTrack: async (playlistId: string, trackId: string) => {
      return fetch(`${BASEURL}/api/playlists/${playlistId}/tracks/${trackId}`, {
        method: "DELETE",
        headers: getAuthHeaders(),
      });
    },

    updateTrackOrder: async (
      playlistId: string,
      trackIds: string[],
      skipValidation = false
    ) => {
      return fetch(`${BASEURL}/api/playlists/${playlistId}/tracks/order`, {
        method: "PUT",
        headers: getAuthHeaders(),
        body: JSON.stringify({ trackIds, skipValidation }),
      });
    },

    /**
     * Like a playlist
     * @param playlistId - ID of the playlist to like
     * @returns Promise<Response> - API response
     */
    like: async (playlistId: string): Promise<Response> => {
      return fetch(`${BASEURL}/api/playlists/${playlistId}/like`, {
        method: "POST",
        headers: getAuthHeaders(),
      });
    },

    /**
     * Unlike a playlist
     * @param playlistId - ID of the playlist to unlike
     * @returns Promise<Response> - API response
     */
    unlike: async (playlistId: string): Promise<Response> => {
      return fetch(`${BASEURL}/api/playlists/${playlistId}/like`, {
        method: "DELETE",
        headers: getAuthHeaders(),
      });
    },

    /**
     * Get playlist like status for current user
     * @param playlistId - ID of the playlist
     * @returns Promise<Response> - API response with like status
     */
    getLikeStatus: async (playlistId: string): Promise<Response> => {
      return fetch(`${BASEURL}/api/playlists/${playlistId}/like-status`, {
        method: "GET",
        headers: getAuthHeaders(),
      });
    },

    /**
     * Get user's liked playlists
     * @param options - Pagination options
     * @returns Promise<Response> - API response with liked playlists
     */
    getLiked: async (
      options: { page?: number; limit?: number } = {}
    ): Promise<Response> => {
      const query = buildQueryString(options);
      return fetch(`${BASEURL}/api/playlists/user/liked${query}`, {
        headers: getAuthHeaders(),
      });
    },

    /**
     * Get playlist statistics including like count
     * @param playlistId - ID of the playlist
     * @returns Promise<Response> - API response with playlist stats
     */
    getStats: async (playlistId: string): Promise<Response> => {
      return fetch(`${BASEURL}/api/playlists/${playlistId}/statistics`, {
        method: "GET",
        headers: getAuthHeaders(),
      });
    },

    search: async (query: string, options: { limit?: number } = {}) => {
      const params = buildQueryString({ query, ...options });
      return fetch(`${BASEURL}/api/playlists/search${params}`, {
        headers: getAuthHeaders(false),
      });
    },

    getFeatured: async (options: { limit?: number } = {}) => {
      const query = buildQueryString(options);
      return fetch(`${BASEURL}/api/playlists/featured${query}`, {
        headers: getAuthHeaders(false),
      });
    },

    getByCategory: async (category: string) => {
      return fetch(`${BASEURL}/api/playlists/category/${category}`, {
        headers: getAuthHeaders(false),
      });
    },

    getByTag: async (tag: string) => {
      return fetch(`${BASEURL}/api/playlists/tag/${tag}`, {
        headers: getAuthHeaders(false),
      });
    },

    /**
     * Get playlists by user ID
     * @param userId - User ID
     * @param options - Query options
     * @returns Promise<Response> - API response
     */
    getByUser: async (
      userId: string,
      options: {
        page?: number;
        limit?: number;
        privacy?: "public" | "private" | "unlisted";
      } = {}
    ): Promise<Response> => {
      const query = buildQueryString(options);
      return fetch(`${BASEURL}/api/playlists/user/${userId}${query}`, {
        headers: getAuthHeaders(),
      });
    },
  },

  album: {
    getTracks: async (
      albumId: string,
      options: {
        page?: number;
        limit?: number;
        sortBy?: string;
        sortOrder?: number;
      } = {}
    ) => {
      const query = buildQueryString(options);
      return fetch(`${BASEURL}/api/albums/${albumId}/tracks${query}`, {
        headers: getAuthHeaders(false),
      });
    },
  },

  search: {
    global: async (query: string, options: { limit?: number } = {}) => {
      const params = buildQueryString({ q: query, ...options });
      return fetch(`${BASEURL}/api/search${params}`, {
        headers: getAuthHeaders(),
      });
    },

    getPopular: async () => {
      return fetch(`${BASEURL}/api/search/popular`, {
        headers: getAuthHeaders(),
      });
    },
  },

  track: {
    getById: async (trackId: string) => {
      return fetch(`${BASEURL}/api/tracks/${trackId}`, {
        headers: getAuthHeaders(false),
      });
    },

    getForPage: async (trackId: string) => {
      return fetch(`${BASEURL}/api/tracks/${trackId}/page`, {
        headers: getAuthHeaders(false),
      });
    },

    /**
     * Like a track
     * @param trackId - ID of the track to like
     * @returns Promise<Response> - API response
     */
    like: async (trackId: string): Promise<Response> => {
      return fetch(`${BASEURL}/api/tracks/${trackId}/like`, {
        method: "POST",
        headers: getAuthHeaders(),
      });
    },

    /**
     * Unlike a track
     * @param trackId - ID of the track to unlike
     * @returns Promise<Response> - API response
     */
    unlike: async (trackId: string): Promise<Response> => {
      return fetch(`${BASEURL}/api/tracks/${trackId}/like`, {
        method: "DELETE",
        headers: getAuthHeaders(),
      });
    },
  },

  /**
   * Recommendations API
   */
  recommendations: {
    /**
     * Get recommendations for user
     * @param userId - ID of the user
     * @param options - Query options
     * @returns Promise<Response> - API response with recommendations
     */
    getForUser: async (
      userId: string,
      options: { limit?: number } = {}
    ): Promise<Response> => {
      const query = buildQueryString({ userId, ...options });
      return fetch(`${BASEURL}/api/recommendations${query}`, {
        headers: getAuthHeaders(),
      });
    },
  },

  admin: {
    playlist: {
      // Получить все платформенные плейлисты
      getPlatform: async (
        options: {
          page?: number;
          limit?: number;
          search?: string;
        } = {}
      ) => {
        const query = buildQueryString(options);
        return fetch(`${BASEURL}/api/playlists/admin/platform${query}`, {
          headers: getAuthHeaders(),
        });
      },

      // Получить черновики платформенных плейлистов
      getDrafts: async (
        options: {
          page?: number;
          limit?: number;
        } = {}
      ) => {
        const query = buildQueryString(options);
        return fetch(`${BASEURL}/api/playlists/admin/platform/drafts${query}`, {
          headers: getAuthHeaders(),
        });
      },

      // Создать платформенный плейлист
      create: async (playlistData: FormData) => {
        return fetch(`${BASEURL}/api/playlists/admin/platform`, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
          body: playlistData,
        });
      },

      // Обновить платформенный плейлист
      update: async (playlistId: string, playlistData: FormData) => {
        return fetch(`${BASEURL}/api/playlists/admin/platform/${playlistId}`, {
          method: "PUT",
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
          body: playlistData,
        });
      },

      // Опубликовать платформенный плейлист
      publish: async (playlistId: string) => {
        return fetch(
          `${BASEURL}/api/playlists/admin/platform/${playlistId}/publish`,
          {
            method: "POST",
            headers: getAuthHeaders(),
          }
        );
      },

      // Удалить платформенный плейлист
      delete: async (playlistId: string) => {
        return fetch(`${BASEURL}/api/playlists/admin/platform/${playlistId}`, {
          method: "DELETE",
          headers: getAuthHeaders(),
        });
      },

      // Получить статистику платформенных плейлистов
      getStats: async () => {
        return fetch(`${BASEURL}/api/playlists/admin/platform/stats`, {
          headers: getAuthHeaders(),
        });
      },
    },
  },
};

// Type definitions for API responses
export interface PlaylistLikeResponse {
  success: boolean;
  message: string;
  data: {
    isLiked: boolean;
    likeCount: number;
    playlistId: string;
  };
}

export interface PlaylistStatsResponse {
  success: boolean;
  data: {
    trackCount: number;
    totalDuration: number;
    likeCount: number;
    createdAt: string;
    updatedAt: string;
  };
}

export interface LikedPlaylistsResponse {
  success: boolean;
  message: string;
  data: {
    playlists: Playlist[];
    pagination: {
      currentPage: number;
      totalPages: number;
      totalPlaylists: number;
      hasNextPage: boolean;
      hasPreviousPage: boolean;
    };
  };
}

export interface ArtistResponse {
  success: boolean;
  data: {
    _id: string;
    name: string;
    slug: string;
    avatar: string | null;
    bio: string;
    genres: string[];
    isVerified: boolean;
    followerCount: number;
    socialLinks?: object;
    createdAt: string;
    updatedAt: string;
  };
}

export interface ArtistsResponse {
  success: boolean;
  data: {
    artists: any[];
    pagination?: {
      currentPage: number;
      totalPages: number;
      totalArtists: number;
      hasNextPage: boolean;
      hasPrevPage: boolean;
    };
  };
}

export interface SearchArtistsResponse {
  success: boolean;
  data: {
    artists: any[];
    count: number;
    query: string;
  };
}

export interface PlaylistsResponse {
  success: boolean;
  data: {
    playlists: any[];
    pagination?: {
      currentPage: number;
      totalPages: number;
      totalPlaylists: number;
      hasNextPage: boolean;
      hasPreviousPage: boolean;
    };
  };
}

export interface SearchPlaylistsResponse {
  success: boolean;
  data: {
    playlists: any[];
    count: number;
    query: string;
  };
}

export interface RecommendationsResponse {
  success: boolean;
  data: any[];
}
