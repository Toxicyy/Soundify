import Track from "../models/Track.model.js";
import User from "../models/User.model.js";
import TrackService from "./TrackService.js";

class RecommendationService {
  /**
   * Main method for getting recommendations
   * @param {string} userId - User ID
   * @param {number} limit - Number of recommendations
   * @param {Object} queueState - Current queue state to filter duplicates
   * @returns {Promise<Array>} Filtered recommendations
   */
  async getRecommendations(userId, limit = 20, queueState = null) {
    try {
      const user = await User.findById(userId)
        .populate("likedSongs likedArtists likedPlaylists")
        .lean();

      if (!user) throw new Error("User not found");

      // 1. Personal recommendations
      let recommendations = await this.getPersonalRecommendations(
        user,
        limit * 2
      ); // Get more to account for filtering

      // 2. If not enough recommendations, add popular tracks
      if (recommendations.length < limit * 2) {
        const remaining = limit * 2 - recommendations.length;
        const popular = await this.getPopularTracks(remaining);
        recommendations = [...recommendations, ...popular];
      }

      // 3. Filter already known tracks
      let filteredRecommendations = this.filterExistingTracks(
        user,
        recommendations
      );

      // 4. Filter tracks already in queue/playing
      if (queueState) {
        filteredRecommendations = this.filterQueueTracks(
          filteredRecommendations,
          queueState
        );
      }

      return filteredRecommendations.slice(0, limit);
    } catch (error) {
      console.error("RecommendationService error:", error);
      const fallback = await this.getPopularTracks(limit * 2);
      const filtered = queueState
        ? this.filterQueueTracks(fallback, queueState)
        : fallback;
      return filtered.slice(0, limit);
    }
  }

  /**
   * Filter tracks that are already in queue or currently playing
   * @param {Array} tracks - Tracks to filter
   * @param {Object} queueState - Current queue state
   * @returns {Array} Filtered tracks
   */
  filterQueueTracks(tracks, queueState) {
    if (!queueState || !tracks.length) return tracks;

    const excludeIds = new Set();

    // Add current track ID
    if (queueState.currentTrack?._id) {
      excludeIds.add(queueState.currentTrack._id.toString());
    }

    // Add queue track IDs
    if (queueState.queue && Array.isArray(queueState.queue)) {
      queueState.queue.forEach((track) => {
        if (track._id) {
          excludeIds.add(track._id.toString());
        }
      });
    }

    // Add history track IDs (recent ones to avoid immediate repeats)
    if (queueState.history && Array.isArray(queueState.history)) {
      // Only exclude last 5 tracks from history to avoid too restrictive filtering
      const recentHistory = queueState.history.slice(-5);
      recentHistory.forEach((track) => {
        if (track._id) {
          excludeIds.add(track._id.toString());
        }
      });
    }

    // Filter out excluded tracks
    const filtered = tracks.filter((track) => {
      return !excludeIds.has(track._id.toString());
    });

    console.log(
      `Filtered ${
        tracks.length - filtered.length
      } tracks already in queue/history`
    );
    return filtered;
  }

  /**
   * Alternative method: Get recommendations with track IDs to exclude
   * @param {string} userId - User ID
   * @param {number} limit - Number of recommendations
   * @param {Array} excludeTrackIds - Array of track IDs to exclude
   * @returns {Promise<Array>} Filtered recommendations
   */
  async getRecommendationsExcluding(userId, limit = 20, excludeTrackIds = []) {
    try {
      const user = await User.findById(userId)
        .populate("likedSongs likedArtists likedPlaylists")
        .lean();

      if (!user) throw new Error("User not found");

      // Combine user's liked songs with excluded track IDs
      const allExcludedIds = [
        ...user.likedSongs.map((s) => s._id),
        ...excludeTrackIds,
      ];

      // Get recommendations with exclusions
      let recommendations = await this.getPersonalRecommendationsWithExclusions(
        user,
        limit * 2,
        allExcludedIds
      );

      // If not enough, add popular tracks
      if (recommendations.length < limit) {
        const remaining = limit - recommendations.length;
        const popular = await this.getPopularTracksExcluding(
          remaining,
          allExcludedIds
        );
        recommendations = [...recommendations, ...popular];
      }

      return recommendations.slice(0, limit);
    } catch (error) {
      console.error("RecommendationService error:", error);
      return this.getPopularTracksExcluding(limit, excludeTrackIds);
    }
  }

  // Personal recommendations
  async getPersonalRecommendations(user, limit) {
    const [fromArtists, fromGenres, fromPlaylists] = await Promise.all([
      this.getRecommendationsFromLikedArtists(user, Math.ceil(limit * 0.5)),
      this.getRecommendationsFromGenres(user, Math.ceil(limit * 0.3)),
      this.getRecommendationsFromPlaylists(user, Math.ceil(limit * 0.2)),
    ]);

    return this.removeDuplicates([
      ...fromArtists,
      ...fromGenres,
      ...fromPlaylists,
    ]);
  }

  /**
   * Personal recommendations with custom exclusions
   */
  async getPersonalRecommendationsWithExclusions(user, limit, excludeIds) {
    const [fromArtists, fromGenres, fromPlaylists] = await Promise.all([
      this.getRecommendationsFromLikedArtistsExcluding(
        user,
        Math.ceil(limit * 0.5),
        excludeIds
      ),
      this.getRecommendationsFromGenresExcluding(
        user,
        Math.ceil(limit * 0.3),
        excludeIds
      ),
      this.getRecommendationsFromPlaylistsExcluding(
        user,
        Math.ceil(limit * 0.2),
        excludeIds
      ),
    ]);

    return this.removeDuplicates([
      ...fromArtists,
      ...fromGenres,
      ...fromPlaylists,
    ]);
  }

  // Based on liked artists
  async getRecommendationsFromLikedArtists(user, limit) {
    if (!user.likedArtists?.length) return [];

    const tracks = await Track.find({
      artist: { $in: user.likedArtists.map((a) => a._id) },
      _id: { $nin: user.likedSongs.map((s) => s._id) },
      isPublic: true,
    })
      .sort({ likeCount: -1, createdAt: -1 })
      .populate("artist", "name avatar")
      .limit(limit)
      .lean();

    const tracksWithSignedUrls = await TrackService.addSignedUrlsToTracks(
      tracks
    );
    return tracksWithSignedUrls;
  }

  /**
   * Based on liked artists with custom exclusions
   */
  async getRecommendationsFromLikedArtistsExcluding(user, limit, excludeIds) {
    if (!user.likedArtists?.length) return [];

    const tracks = await Track.find({
      artist: { $in: user.likedArtists.map((a) => a._id) },
      _id: { $nin: excludeIds },
      isPublic: true,
    })
      .sort({ likeCount: -1, createdAt: -1 })
      .populate("artist", "name avatar")
      .limit(limit)
      .lean();

    const tracksWithSignedUrls = await TrackService.addSignedUrlsToTracks(
      tracks
    );
    return tracksWithSignedUrls;
  }

  // Based on genres of liked tracks
  async getRecommendationsFromGenres(user, limit) {
    if (!user.likedSongs?.length) return [];

    const likedTracks = await Track.find({
      _id: { $in: user.likedSongs.map((s) => s._id) },
    }).select("genre");

    const genres = [
      ...new Set(likedTracks.map((t) => t.genre).filter(Boolean)),
    ];
    if (!genres.length) return [];

    const tracks = await Track.find({
      genre: { $in: genres },
      _id: { $nin: user.likedSongs.map((s) => s._id) },
      isPublic: true,
    })
      .sort({ likeCount: -1, validListenCount: -1 })
      .populate("artist", "name avatar")
      .limit(limit)
      .lean();

    const tracksWithSignedUrls = await TrackService.addSignedUrlsToTracks(
      tracks
    );
    return tracksWithSignedUrls;
  }

  /**
   * Based on genres with custom exclusions
   */
  async getRecommendationsFromGenresExcluding(user, limit, excludeIds) {
    if (!user.likedSongs?.length) return [];

    const likedTracks = await Track.find({
      _id: { $in: user.likedSongs.map((s) => s._id) },
    }).select("genre");

    const genres = [
      ...new Set(likedTracks.map((t) => t.genre).filter(Boolean)),
    ];
    if (!genres.length) return [];

    const tracks = await Track.find({
      genre: { $in: genres },
      _id: { $nin: excludeIds },
      isPublic: true,
    })
      .sort({ likeCount: -1, validListenCount: -1 })
      .populate("artist", "name avatar")
      .limit(limit)
      .lean();

    const tracksWithSignedUrls = await TrackService.addSignedUrlsToTracks(
      tracks
    );
    return tracksWithSignedUrls;
  }

  // Based on user playlists
  async getRecommendationsFromPlaylists(user, limit) {
    if (!user.likedPlaylists?.length) return [];

    const playlistTracks = await User.aggregate([
      { $match: { _id: user._id } },
      { $unwind: "$likedPlaylists" },
      {
        $lookup: {
          from: "playlists",
          localField: "likedPlaylists",
          foreignField: "_id",
          as: "playlist",
        },
      },
      { $unwind: "$playlist" },
      { $project: { tracks: "$playlist.tracks" } },
      { $unwind: "$tracks" },
      { $group: { _id: "$tracks" } },
    ]);

    const trackIds = playlistTracks.map((p) => p._id);
    if (!trackIds.length) return [];

    const tracks = await Track.find({
      _id: { $in: trackIds },
      _id: { $nin: user.likedSongs.map((s) => s._id) },
      isPublic: true,
    })
      .sort({ likeCount: -1 })
      .populate("artist", "name avatar")
      .limit(limit)
      .lean();

    const tracksWithSignedUrls = await TrackService.addSignedUrlsToTracks(
      tracks
    );
    return tracksWithSignedUrls;
  }

  /**
   * Based on playlists with custom exclusions
   */
  async getRecommendationsFromPlaylistsExcluding(user, limit, excludeIds) {
    if (!user.likedPlaylists?.length) return [];

    const playlistTracks = await User.aggregate([
      { $match: { _id: user._id } },
      { $unwind: "$likedPlaylists" },
      {
        $lookup: {
          from: "playlists",
          localField: "likedPlaylists",
          foreignField: "_id",
          as: "playlist",
        },
      },
      { $unwind: "$playlist" },
      { $project: { tracks: "$playlist.tracks" } },
      { $unwind: "$tracks" },
      { $group: { _id: "$tracks" } },
    ]);

    const trackIds = playlistTracks.map((p) => p._id);
    if (!trackIds.length) return [];

    const tracks = await Track.find({
      _id: { $in: trackIds },
      _id: { $nin: excludeIds },
      isPublic: true,
    })
      .sort({ likeCount: -1 })
      .populate("artist", "name avatar")
      .limit(limit)
      .lean();

    const tracksWithSignedUrls = await TrackService.addSignedUrlsToTracks(
      tracks
    );
    return tracksWithSignedUrls;
  }

  // Popular tracks
  async getPopularTracks(limit) {
    const tracks = await Track.find({ isPublic: true })
      .sort({ validListenCount: -1, likeCount: -1 })
      .populate("artist", "name avatar")
      .limit(limit)
      .lean();

    const tracksWithSignedUrls = await TrackService.addSignedUrlsToTracks(
      tracks
    );
    return tracksWithSignedUrls;
  }

  /**
   * Popular tracks with exclusions
   */
  async getPopularTracksExcluding(limit, excludeIds = []) {
    const tracks = await Track.find({
      isPublic: true,
      _id: { $nin: excludeIds },
    })
      .sort({ validListenCount: -1, likeCount: -1 })
      .populate("artist", "name avatar")
      .limit(limit)
      .lean();

    const tracksWithSignedUrls = await TrackService.addSignedUrlsToTracks(
      tracks
    );
    return tracksWithSignedUrls;
  }

  // Filter already known tracks
  filterExistingTracks(user, tracks) {
    if (!tracks.length) return [];

    const excludedIds = user.likedSongs.map((s) => s._id);
    return tracks.filter(
      (track) => !excludedIds.some((id) => id.equals(track._id))
    );
  }

  // Remove duplicates
  removeDuplicates(tracks) {
    const seen = new Set();
    return tracks.filter((track) => {
      const duplicate = seen.has(track._id.toString());
      seen.add(track._id.toString());
      return !duplicate;
    });
  }
}

export default new RecommendationService();
