import type { ArtistCreate } from "../Pages/BecomeAnArtist";

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
      userId: string,
      options: {
        page?: number;
        limit?: number;
      } = {}
    ) => {
      const query = buildQueryString(options);
      return fetch(`${BASEURL}/api/users/${userId}/playlists/liked${query}`, {
        headers: getAuthHeaders(),
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

    likePlaylist: async (userId: string, playlistId: string) => {
      return fetch(
        `${BASEURL}/api/users/${userId}/like/playlist/${playlistId}`,
        {
          method: "PUT",
          headers: getAuthHeaders(),
        }
      );
    },

    unlikePlaylist: async (userId: string, playlistId: string) => {
      return fetch(
        `${BASEURL}/api/users/${userId}/unlike/playlist/${playlistId}`,
        {
          method: "PUT",
          headers: getAuthHeaders(),
        }
      );
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

    like: async (playlistId: string) => {
      return fetch(`${BASEURL}/api/playlists/${playlistId}/like`, {
        method: "POST",
        headers: getAuthHeaders(),
      });
    },

    unlike: async (playlistId: string) => {
      return fetch(`${BASEURL}/api/playlists/${playlistId}/like`, {
        method: "DELETE",
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

    getStats: async (playlistId: string) => {
      return fetch(`${BASEURL}/api/playlists/${playlistId}/statistics`, {
        headers: getAuthHeaders(false),
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
};
