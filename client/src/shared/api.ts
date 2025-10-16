import type { ArtistCreate } from "../Pages/BecomeAnArtist";
import type { Playlist } from "../types/Playlist";

export const BASEURL = import.meta.env.VITE_API_BASE_URL;

/**
 * Get authorization headers
 */
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

/**
 * Build query string from params object
 */
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

    getLikedPlaylists: async (
      options: { page?: number; limit?: number } = {}
    ): Promise<Response> => {
      const token = localStorage.getItem("token");
      const params = new URLSearchParams();

      if (options.page) params.append("page", options.page.toString());
      if (options.limit) params.append("limit", options.limit.toString());

      return fetch(`${BASEURL}/api/playlists/user/liked?${params}`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });
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

    likePlaylist: async (
      userId: string,
      playlistId: string
    ): Promise<Response> => {
      const token = localStorage.getItem("token");

      return fetch(`${BASEURL}/api/playlists/${playlistId}/like`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ userId }),
      });
    },

    unlikePlaylist: async (
      userId: string,
      playlistId: string
    ): Promise<Response> => {
      const token = localStorage.getItem("token");

      return fetch(`${BASEURL}/api/playlists/${playlistId}/like`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ userId }),
      });
    },

    updateProfile: async (userId: string, profileData: FormData) => {
      return fetch(`${BASEURL}/api/users/${userId}/profile`, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
        body: profileData,
      });
    },

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

    like: async (artistId: string): Promise<Response> => {
      return fetch(`${BASEURL}/api/artists/${artistId}/like`, {
        method: "POST",
        headers: getAuthHeaders(),
      });
    },

    unlike: async (artistId: string): Promise<Response> => {
      return fetch(`${BASEURL}/api/artists/${artistId}/like`, {
        method: "DELETE",
        headers: getAuthHeaders(),
      });
    },

    update: async (artistId: string, artistData: any, isFormData = false) => {
      return fetch(`${BASEURL}/api/artists/${artistId}`, {
        method: "PUT",
        headers: {
          ...(isFormData ? {} : { "Content-Type": "application/json" }),
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
        body: isFormData ? artistData : JSON.stringify(artistData),
      });
    },

    getArtistTracks: async (
      artistId: string,
      limit?: number
    ): Promise<Response> => {
      const query = buildQueryString({ limit });
      return fetch(`${BASEURL}/api/artists/${artistId}/tracks${query}`, {
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

    like: async (playlistId: string): Promise<Response> => {
      return fetch(`${BASEURL}/api/playlists/${playlistId}/like`, {
        method: "POST",
        headers: getAuthHeaders(),
      });
    },

    unlike: async (playlistId: string): Promise<Response> => {
      return fetch(`${BASEURL}/api/playlists/${playlistId}/like`, {
        method: "DELETE",
        headers: getAuthHeaders(),
      });
    },

    getLikeStatus: async (playlistId: string): Promise<Response> => {
      return fetch(`${BASEURL}/api/playlists/${playlistId}/like-status`, {
        method: "GET",
        headers: getAuthHeaders(),
      });
    },

    getLiked: async (
      options: { page?: number; limit?: number } = {}
    ): Promise<Response> => {
      const query = buildQueryString(options);
      return fetch(`${BASEURL}/api/playlists/user/liked${query}`, {
        headers: getAuthHeaders(),
      });
    },

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

    likePlaylist: async (
      playlistId: string,
      like: boolean
    ): Promise<Response> => {
      return fetch(`${BASEURL}/api/playlists/${playlistId}/like`, {
        method: like ? "POST" : "DELETE",
        headers: {
          ...getAuthHeaders(),
          "Content-Type": "application/json",
        },
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

    like: async (trackId: string): Promise<Response> => {
      return fetch(`${BASEURL}/api/tracks/${trackId}/like`, {
        method: "POST",
        headers: getAuthHeaders(),
      });
    },

    unlike: async (trackId: string): Promise<Response> => {
      return fetch(`${BASEURL}/api/tracks/${trackId}/like`, {
        method: "DELETE",
        headers: getAuthHeaders(),
      });
    },

    getPlaylistUrl: (trackId: string) => {
      return `${BASEURL}/api/tracks/${trackId}/playlist.m3u8`;
    },

    search: async (query: string, options: { limit?: number } = {}) => {
      const params = buildQueryString({ q: query, ...options });
      return fetch(`${BASEURL}/api/tracks/search${params}`, {
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
        },
      });
    },

    getTrack: async (
      trackId: string,
      auth: boolean = true
    ): Promise<Response> => {
      return fetch(`${BASEURL}/api/tracks/${encodeURIComponent(trackId)}`, {
        headers: auth
          ? getAuthHeaders()
          : {
              Accept: "application/json",
              "Content-Type": "application/json",
            },
      });
    },

    uploadTrack: (
      formData: FormData,
      progressCallback?: (progress: number) => void
    ): Promise<Response> => {
      return new Promise((resolve, reject) => {
        const xhr = new XMLHttpRequest();

        xhr.upload.addEventListener("progress", (event) => {
          if (event.lengthComputable && progressCallback) {
            const progress = (event.loaded / event.total) * 70;
            progressCallback(progress);
          }
        });

        xhr.onload = function () {
          if (xhr.status >= 200 && xhr.status < 300) {
            let conversionProgress = 70;
            const conversionInterval = setInterval(() => {
              if (progressCallback) {
                conversionProgress += Math.random() * 3 + 1;
                if (conversionProgress >= 100) {
                  conversionProgress = 100;
                  clearInterval(conversionInterval);
                  progressCallback(conversionProgress);
                  resolve(
                    new Response(xhr.responseText, { status: xhr.status })
                  );
                }
                progressCallback(conversionProgress);
              }
            }, 200);
          } else {
            reject(new Error(`Upload failed with status ${xhr.status}`));
          }
        };

        xhr.onerror = () => reject(new Error("Network error occurred"));
        xhr.ontimeout = () => reject(new Error("Upload timeout"));

        xhr.open("POST", `${BASEURL}/api/tracks`);
        xhr.setRequestHeader(
          "Authorization",
          `Bearer ${localStorage.getItem("token")}`
        );
        xhr.timeout = 300000;
        xhr.send(formData);
      });
    },
  },

  recommendations: {
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

      create: async (playlistData: FormData) => {
        return fetch(`${BASEURL}/api/playlists/admin/platform`, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
          body: playlistData,
        });
      },

      update: async (playlistId: string, playlistData: FormData) => {
        return fetch(`${BASEURL}/api/playlists/admin/platform/${playlistId}`, {
          method: "PUT",
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
          body: playlistData,
        });
      },

      publish: async (playlistId: string) => {
        return fetch(
          `${BASEURL}/api/playlists/admin/platform/${playlistId}/publish`,
          {
            method: "POST",
            headers: getAuthHeaders(),
          }
        );
      },

      delete: async (playlistId: string) => {
        return fetch(`${BASEURL}/api/playlists/admin/platform/${playlistId}`, {
          method: "DELETE",
          headers: getAuthHeaders(),
        });
      },

      getStats: async () => {
        return fetch(`${BASEURL}/api/playlists/admin/platform/stats`, {
          headers: getAuthHeaders(),
        });
      },

      createPlatform: async (playlistData: any) => {
        return fetch(`${BASEURL}/api/playlists/admin/platform`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
          body: JSON.stringify(playlistData),
        });
      },

      updatePlatform: async (playlistId: string, playlistData: any) => {
        return fetch(`${BASEURL}/api/playlists/admin/platform/${playlistId}`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
          body: JSON.stringify(playlistData),
        });
      },
    },
  },

  analytics: {
    getDashboard: async () => {
      return fetch(`${BASEURL}/api/analytics/dashboard`, {
        headers: getAuthHeaders(),
      });
    },

    getUsers: async (queryParams: string) => {
      return fetch(`${BASEURL}/api/analytics/users?${queryParams}`, {
        headers: getAuthHeaders(),
      });
    },

    getStreams: async (period: string) => {
      return fetch(`${BASEURL}/api/analytics/streams?period=${period}`, {
        headers: getAuthHeaders(),
      });
    },
  },

  charts: {
    getGlobal: async (limit: number = 50): Promise<Response> => {
      const query = buildQueryString({ limit });
      return fetch(`${BASEURL}/api/charts/global${query}`, {
        headers: getAuthHeaders(),
        cache: "no-store",
      });
    },

    getTrending: async (limit: number = 50): Promise<Response> => {
      const query = buildQueryString({ limit });
      return fetch(`${BASEURL}/api/charts/trending${query}`, {
        headers: getAuthHeaders(),
        cache: "no-store",
      });
    },

    getCountry: async (
      countryCode: string,
      limit: number = 50
    ): Promise<Response> => {
      const query = buildQueryString({ limit });
      return fetch(`${BASEURL}/api/charts/country/${countryCode}${query}`, {
        headers: getAuthHeaders(),
        cache: "no-store",
      });
    },

    getAvailableCountries: async (): Promise<Response> => {
      return fetch(`${BASEURL}/api/charts/countries`, {
        headers: getAuthHeaders(),
      });
    },

    getStats: async (): Promise<Response> => {
      return fetch(`${BASEURL}/api/charts/stats`, {
        headers: getAuthHeaders(),
      });
    },
  },
};

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

export interface ChartTrack {
  rank: number;
  track: {
    _id: string;
    name: string;
    artist: {
      _id: string;
      name: string;
      avatar?: string;
    };
    coverUrl?: string;
    duration: number;
    validListenCount?: number;
  };
  chartScore: number;
  trend: "up" | "down" | "stable" | "new";
  rankChange: number;
  daysInChart: number;
  peakPosition: number;
  lastUpdated: string;
}

export interface ChartMetadata {
  type: string;
  country: string;
  limit: number;
  totalTracks: number;
  lastUpdated: string;
  generatedAt: string;
}

export interface ChartResponse {
  success: boolean;
  message: string;
  data: {
    chart?: ChartTrack[];
    trending?: ChartTrack[];
    metadata: ChartMetadata;
  };
}

export interface CountriesResponse {
  success: boolean;
  data: {
    countries: Array<{
      countryCode: string;
      trackCount: number;
      lastUpdated: string;
    }>;
  };
}

export interface ChartStatsResponse {
  success: boolean;
  data: any;
}