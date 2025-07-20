import TrackService from "./TrackService.js";
import ArtistService from "./ArtistService.js";
import AlbumService from "./AlbumService.js";
import PlaylistService from "./PlaylistService.js";

/**
 * Глобальный сервис поиска для объединения результатов из всех сущностей
 * Реализует поиск по трекам, артистам, альбомам и плейлистам
 */
class GlobalSearchService {
  /**
   * Выполняет глобальный поиск по всем сущностям
   * @param {string} query - Поисковый запрос
   * @param {Object} options - Опции поиска
   * @returns {Promise<Object>} Объединенные результаты поиска
   */
  async globalSearch(query, options = {}) {
    const {
      limit = 10,
      categories = ["tracks", "artists", "albums", "playlists"],
      userId = null, // Для доступа к приватным плейлистам
      includePrivate = false, // Включать ли приватные плейлисты пользователя
    } = options;

    if (!query || query.trim().length === 0) {
      throw new Error("Поисковый запрос не может быть пустым");
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
      // Выполняем поиск параллельно по всем категориям
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

      // Ждем все результаты
      const searchResults = await Promise.allSettled(searchPromises);

      // Обрабатываем результаты
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
      throw new Error(`Ошибка глобального поиска: ${error.message}`);
    }
  }

  /**
   * Поиск треков с обработкой ошибок
   * @param {string} query - Поисковый запрос
   * @param {number} limit - Лимит результатов
   * @returns {Promise<Array>} Найденные треки
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
      console.error("Ошибка поиска треков:", error.message);
      return [];
    }
  }

  /**
   * Поиск артистов с обработкой ошибок
   * @param {string} query - Поисковый запрос
   * @param {number} limit - Лимит результатов
   * @returns {Promise<Array>} Найденные артисты
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
      console.error("Ошибка поиска артистов:", error.message);
      return [];
    }
  }

  /**
   * Поиск альбомов с обработкой ошибок
   * @param {string} query - Поисковый запрос
   * @param {number} limit - Лимит результатов
   * @returns {Promise<Array>} Найденные альбомы
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
      console.error("Ошибка поиска альбомов:", error.message);
      return [];
    }
  }

  /**
   * Поиск плейлистов с обработкой ошибок
   * @param {string} query - Поисковый запрос
   * @param {number} limit - Лимит результатов
   * @param {string} userId - ID пользователя
   * @param {boolean} includePrivate - Включать приватные плейлисты
   * @returns {Promise<Array>} Найденные плейлисты
   */
  async searchPlaylists(query, limit, userId, includePrivate) {
    try {
      const playlistResults = await PlaylistService.searchPlaylist(query, {
        limit,
      });
      let playlists = playlistResults.playlists;

      // Если нужно включить приватные плейлисты пользователя
      if (includePrivate && userId) {
        try {
          const userPlaylists = await PlaylistService.getUserPlaylists(userId, {
            page: 1,
            limit: limit,
            privacy: "private",
          });

          // Фильтруем приватные плейлисты по запросу
          const filteredPrivatePlaylists = userPlaylists.playlists.filter(
            (playlist) =>
              playlist.name.toLowerCase().includes(query.toLowerCase())
          );

          playlists = [...playlists, ...filteredPrivatePlaylists];
        } catch (error) {
          console.warn("Ошибка получения приватных плейлистов:", error.message);
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
      console.error("Ошибка поиска плейлистов:", error.message);
      return [];
    }
  }

  /**
   * Поиск с приоритетом по типу контента
   * @param {string} query - Поисковый запрос
   * @param {string} primaryType - Приоритетный тип для поиска
   * @param {Object} options - Опции поиска
   * @returns {Promise<Object>} Результаты с приоритетом
   */
  async searchWithPriority(query, primaryType, options = {}) {
    const { limit = 10, secondaryLimit = 5 } = options;

    const results = await this.globalSearch(query, {
      ...options,
      limit: primaryType === "tracks" ? limit : secondaryLimit,
    });

    // Если есть приоритетный тип, делаем дополнительный поиск
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
   * Получение популярных результатов для пустого поиска
   * @param {Object} options - Опции
   * @returns {Promise<Object>} Популярные результаты
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

      // Параллельно получаем популярный контент
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
        `Ошибка получения популярного контента: ${error.message}`
      );
    }
  }

  /**
   * Расчет релевантности результата поиска
   * @param {string} query - Поисковый запрос
   * @param {string} title - Название элемента
   * @param {string} metadata - Дополнительные метаданные
   * @returns {number} Оценка релевантности (0-100)
   */
  calculateRelevance(query, title, metadata = "") {
    const queryLower = query.toLowerCase();
    const titleLower = title.toLowerCase();
    const metadataLower = metadata?.toLowerCase() || "";

    let score = 0;

    // Точное совпадение в начале названия - максимальный приоритет
    if (titleLower.startsWith(queryLower)) {
      score += 50;
    }
    // Содержит запрос в названии
    else if (titleLower.includes(queryLower)) {
      score += 30;
    }

    // Содержит запрос в метаданных
    if (metadataLower.includes(queryLower)) {
      score += 20;
    }

    // Бонус за длину совпадения
    const matchLength = query.length / title.length;
    score += Math.floor(matchLength * 10);

    return Math.min(score, 100);
  }

  /**
   * Сортировка результатов по релевантности
   * @param {Array} results - Результаты для сортировки
   * @returns {Array} Отсортированные результаты
   */
  sortByRelevance(results) {
    return results.sort((a, b) => {
      // Сначала по релевантности
      if (b.relevanceScore !== a.relevanceScore) {
        return b.relevanceScore - a.relevanceScore;
      }

      // Затем по популярности (если есть)
      if (a.listenCount && b.listenCount) {
        return b.listenCount - a.listenCount;
      }

      if (a.followerCount && b.followerCount) {
        return b.followerCount - a.followerCount;
      }

      if (a.likeCount && b.likeCount) {
        return b.likeCount - a.likeCount;
      }

      // По дате создания
      return new Date(b.createdAt) - new Date(a.createdAt);
    });
  }

  /**
   * Получение предложений для автодополнения
   * @param {string} query - Частичный запрос
   * @param {number} limit - Лимит предложений
   * @returns {Promise<Array>} Предложения для автодополнения
   */
  async getSearchSuggestions(query, limit = 5) {
    if (!query || query.trim().length < 2) {
      return [];
    }

    try {
      const results = await this.globalSearch(query, { limit: 3 });
      const suggestions = [];

      // Добавляем предложения из всех категорий
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
          secondary: `${artist.followerCount || 0} подписчиков`,
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
      console.error("Ошибка получения предложений:", error.message);
      return [];
    }
  }
}

export default new GlobalSearchService();
