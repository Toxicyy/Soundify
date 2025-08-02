import Track from "../models/Track.model.js";
import User from "../models/User.model.js";

class RecommendationService {
  // Основной метод получения рекомендаций
  async getRecommendations(userId, limit = 20) {
    try {
      const user = await User.findById(userId)
        .populate("likedSongs likedArtists likedPlaylists")
        .lean();

      if (!user) throw new Error("User not found");

      // 1. Персональные рекомендации
      let recommendations = await this.getPersonalRecommendations(user, limit);

      // 2. Если рекомендаций мало, добавляем популярные треки
      if (recommendations.length < limit) {
        const remaining = limit - recommendations.length;
        const popular = await this.getPopularTracks(remaining);
        recommendations = [...recommendations, ...popular];
      }

      // Фильтрация уже известных треков
      return this.filterExistingTracks(user, recommendations.slice(0, limit));
    } catch (error) {
      console.error("RecommendationService error:", error);
      return this.getPopularTracks(limit); // Fallback
    }
  }

  // Персональные рекомендации
  async getPersonalRecommendations(user, limit) {
    const [fromArtists, fromGenres, fromPlaylists] = await Promise.all([
      this.getRecommendationsFromLikedArtists(user, Math.ceil(limit * 0.5)),
      this.getRecommendationsFromGenres(user, Math.ceil(limit * 0.3)),
      this.getRecommendationsFromPlaylists(user, Math.ceil(limit * 0.2)),
    ]);

    return this.removeDuplicates([...fromArtists, ...fromGenres, ...fromPlaylists]);
  }

  // На основе лайкнутых артистов
  async getRecommendationsFromLikedArtists(user, limit) {
    if (!user.likedArtists?.length) return [];

    return Track.find({
      artist: { $in: user.likedArtists.map(a => a._id) },
      _id: { $nin: user.likedSongs.map(s => s._id) },
      isPublic: true,
    })
      .sort({ likeCount: -1, createdAt: -1 })
      .limit(limit)
      .lean();
  }

  // На основе жанров лайкнутых треков
  async getRecommendationsFromGenres(user, limit) {
    if (!user.likedSongs?.length) return [];

    const likedTracks = await Track.find({
      _id: { $in: user.likedSongs.map(s => s._id) }
    }).select("genre");

    const genres = [...new Set(likedTracks.map(t => t.genre).filter(Boolean))];
    if (!genres.length) return [];

    return Track.find({
      genre: { $in: genres },
      _id: { $nin: user.likedSongs.map(s => s._id) },
      isPublic: true
    })
      .sort({ likeCount: -1, validListenCount: -1 })
      .limit(limit)
      .lean();
  }

  // На основе плейлистов пользователя
  async getRecommendationsFromPlaylists(user, limit) {
    if (!user.likedPlaylists?.length) return [];

    const playlistTracks = await User.aggregate([
      { $match: { _id: user._id } },
      { $unwind: "$likedPlaylists" },
      { $lookup: {
          from: "playlists",
          localField: "likedPlaylists",
          foreignField: "_id",
          as: "playlist"
      }},
      { $unwind: "$playlist" },
      { $project: { tracks: "$playlist.tracks" } },
      { $unwind: "$tracks" },
      { $group: { _id: "$tracks" } }
    ]);

    const trackIds = playlistTracks.map(p => p._id);
    if (!trackIds.length) return [];

    return Track.find({
      _id: { $in: trackIds },
      _id: { $nin: user.likedSongs.map(s => s._id) },
      isPublic: true
    })
      .sort({ likeCount: -1 })
      .limit(limit)
      .lean();
  }

  // Популярные треки (замена ChartCache)
  async getPopularTracks(limit) {
    return Track.find({ isPublic: true })
      .sort({ validListenCount: -1, likeCount: -1 })
      .limit(limit)
      .lean();
  }

  // Фильтрация уже известных треков
  async filterExistingTracks(user, tracks) {
    if (!tracks.length) return [];
    
    const excludedIds = user.likedSongs.map(s => s._id);
    return tracks.filter(track => !excludedIds.some(id => id.equals(track._id)));
  }

  // Удаление дубликатов
  removeDuplicates(tracks) {
    const seen = new Set();
    return tracks.filter(track => {
      const duplicate = seen.has(track._id.toString());
      seen.add(track._id.toString());
      return !duplicate;
    });
  }
}

export default new RecommendationService();