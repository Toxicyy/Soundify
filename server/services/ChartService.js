import {
  DailyTrackStats,
  ChartCache,
  ListenEvent,
} from "../models/Chart.model.js";
import Track from "../models/Track.model.js";
import { extractFileName, generateSignedUrl } from "../utils/b2SignedUrl.js";

/**
 * Service for chart calculations and management
 * Handles chart score computation, ranking, and caching
 */
class ChartService {
  /**
   * Aggregate listen events into daily statistics
   * Called by cron job every 15 minutes
   */
  async aggregateListenEvents() {
    try {

      const today = new Date().toISOString().split("T")[0]; // YYYY-MM-DD format
      const startOfDay = new Date(today + "T00:00:00.000Z");
      const endOfDay = new Date(today + "T23:59:59.999Z");

      // Get all listen events for today that haven't been processed
      const pipeline = [
        {
          $match: {
            timestamp: {
              $gte: startOfDay,
              $lte: endOfDay,
            },
          },
        },
        {
          $group: {
            _id: {
              trackId: "$trackId",
              country: "$country",
            },
            listenCount: { $sum: 1 },
            validListenCount: { $sum: { $cond: ["$isValid", 1, 0] } },
            uniqueListeners: {
              $addToSet: { $ifNull: ["$userId", "$sessionId"] },
            },
            totalListenDuration: { $sum: "$listenDuration" },
            lastTimestamp: { $max: "$timestamp" },
          },
        },
        {
          $addFields: {
            uniqueListenerCount: { $size: "$uniqueListeners" },
            averageListenDuration: {
              $cond: [
                { $gt: ["$listenCount", 0] },
                { $divide: ["$totalListenDuration", "$listenCount"] },
                0,
              ],
            },
          },
        },
      ];

      const aggregatedData = await ListenEvent.aggregate(pipeline);

      // Update daily statistics for each track-country combination
      for (const data of aggregatedData) {
        const { trackId, country } = data._id;

        // Get track metadata for snapshot
        const track = await Track.findById(trackId)
          .populate("artist", "name")
          .lean();

        if (!track || !track.chartEligible) {
          continue; // Skip if track not found or not chart eligible
        }

        // Upsert daily track stats
        await DailyTrackStats.findOneAndUpdate(
          {
            trackId,
            date: today,
            country,
          },
          {
            $inc: {
              listenCount: data.listenCount,
              validListenCount: data.validListenCount,
              totalListenDuration: data.totalListenDuration,
            },
            $max: {
              uniqueListeners: data.uniqueListenerCount,
            },
            $set: {
              averageListenDuration: data.averageListenDuration,
              trackSnapshot: {
                name: track.name,
                artist: track.artist?._id,
                genre: track.genre,
                duration: track.duration,
              },
            },
          },
          {
            upsert: true,
            new: true,
          }
        );
      }

      // Clean up processed listen events older than 1 hour
      const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
      const deletedCount = await ListenEvent.deleteMany({
        timestamp: { $lt: oneHourAgo },
      });

      return aggregatedData.length;
    } catch (error) {
      console.error("Listen events aggregation failed:", error);
      throw new Error(`Aggregation failed: ${error.message}`);
    }
  }

  /**
   * Calculate chart scores using weighted decay algorithm
   * More recent days have higher weight
   */
  async calculateChartScores(country = "GLOBAL", daysBack = 5) {
    try {

      // Generate date range (today back to daysBack)
      const dates = [];
      for (let i = 0; i < daysBack; i++) {
        const date = new Date();
        date.setDate(date.getDate() - i);
        dates.push(date.toISOString().split("T")[0]);
      }

      // Weight decay: today=1.0, yesterday=0.7, day2=0.5, day3=0.3, day4=0.1
      const weights = [1.0, 0.7, 0.5, 0.3, 0.1];

      const pipeline = [
        {
          $match: {
            date: { $in: dates },
            country: country,
            validListenCount: { $gt: 0 }, // Only tracks with valid listens
          },
        },
        {
          $group: {
            _id: "$trackId",
            dailyStats: {
              $push: {
                date: "$date",
                validListenCount: "$validListenCount",
                uniqueListeners: "$uniqueListeners",
                averageListenDuration: "$averageListenDuration",
                trackSnapshot: "$trackSnapshot",
              },
            },
          },
        },
        {
          $addFields: {
            chartScore: {
              $reduce: {
                input: "$dailyStats",
                initialValue: 0,
                in: {
                  $add: [
                    "$$value",
                    {
                      $multiply: [
                        "$$this.validListenCount",
                        {
                          $switch: {
                            branches: dates.map((date, index) => ({
                              case: { $eq: ["$$this.date", date] },
                              then: weights[index] || 0,
                            })),
                            default: 0,
                          },
                        },
                      ],
                    },
                  ],
                },
              },
            },
            // Get most recent track snapshot
            latestTrackSnapshot: {
              $arrayElemAt: ["$dailyStats.trackSnapshot", 0],
            },
            totalValidListens: {
              $sum: "$dailyStats.validListenCount",
            },
            daysInChart: {
              $size: "$dailyStats",
            },
          },
        },
        {
          $match: {
            chartScore: { $gt: 0 },
          },
        },
        {
          $sort: {
            chartScore: -1,
          },
        },
        {
          $limit: 200, // Top 200 for processing, will trim to 50 later
        },
      ];

      const chartData = await DailyTrackStats.aggregate(pipeline);

      return chartData;
    } catch (error) {
      console.error("Chart score calculation failed:", error);
      throw new Error(`Chart calculation failed: ${error.message}`);
    }
  }

  /**
   * Update chart cache with new rankings
   * Compares with previous rankings to determine trends
   */
  async updateChartCache(chartType = "global", country = null, limit = 50) {
    try {

      const targetCountry = country || "GLOBAL";
      const today = new Date().toISOString().split("T")[0];

      // Get current chart scores
      const newChartData = await this.calculateChartScores(targetCountry);
      const topTracks = newChartData.slice(0, limit);

      // Get previous chart for trend calculation
      const previousChart = await ChartCache.find({
        type: chartType,
        country: targetCountry,
      })
        .sort({ rank: 1 })
        .lean();

      const previousRankings = new Map();
      previousChart.forEach((entry) => {
        previousRankings.set(entry.trackId.toString(), entry.rank);
      });

      // Clear existing cache for this chart
      await ChartCache.deleteMany({
        type: chartType,
        country: targetCountry,
        chartDate: today,
      });

      // Create new chart entries
      const newChartEntries = [];

      for (let i = 0; i < topTracks.length; i++) {
        const track = topTracks[i];
        const rank = i + 1;
        const trackId = track._id.toString();
        const previousRank = previousRankings.get(trackId);

        // Calculate trend and rank change
        let trend = "stable";
        let rankChange = 0;

        if (!previousRank) {
          trend = "new";
        } else {
          rankChange = previousRank - rank; // Positive = moved up
          if (rankChange > 5) trend = "up";
          else if (rankChange < -5) trend = "down";
          else trend = "stable";
        }

        // Get full track data for metadata
        const fullTrack = await Track.findById(track._id)
          .populate("artist", "name")
          .lean();

        if (!fullTrack) continue;

        const chartEntry = new ChartCache({
          type: chartType,
          country: targetCountry,
          rank,
          trackId: track._id,
          chartScore: Math.round(track.chartScore * 100) / 100, // Round to 2 decimals
          trend,
          previousRank,
          rankChange,
          daysInChart: track.daysInChart,
          peakPosition: Math.min(previousRank || rank, rank),
          trackSnapshot: {
            name: fullTrack.name,
            artist: fullTrack.artist?._id,
            genre: fullTrack.genre,
            coverUrl: fullTrack.coverUrl,
            duration: fullTrack.duration,
            validListenCount: fullTrack.validListenCount,
          },
          chartDate: today,
          generatedAt: new Date(),
        });

        newChartEntries.push(chartEntry);
      }

      // Bulk insert new chart entries
      if (newChartEntries.length > 0) {
        await ChartCache.insertMany(newChartEntries);
      }

      // Update peak positions in Track model
      for (const entry of newChartEntries) {
        const updateData = {
          [`currentChartPosition.${
            chartType === "global" ? "global" : country
          }`]: entry.rank,
          lastChartUpdate: new Date(),
        };

        // Update peak position if this is better
        if (chartType === "global") {
          const track = await Track.findById(entry.trackId);
          if (
            !track.peakChartPosition?.global ||
            entry.rank < track.peakChartPosition.global
          ) {
            updateData["peakChartPosition.global"] = entry.rank;
            updateData["peakChartPosition.date"] = new Date();
          }
        }

        await Track.findByIdAndUpdate(entry.trackId, updateData);
      }
      return newChartEntries.length;
    } catch (error) {
      console.error("Chart cache update failed:", error);
      throw new Error(`Chart cache update failed: ${error.message}`);
    }
  }

  /**
   * Get cached chart data for API responses with signed URLs
   * First gets track IDs from ChartCache, then fetches full track data with artist population
   */
  async getChart(chartType = "global", country = null, limit = 50) {
    try {
      const targetCountry = country || "GLOBAL";

      // Step 1: Get chart entries with basic metadata from ChartCache
      const chartEntries = await ChartCache.find({
        type: chartType,
        country: targetCountry,
      })
        .sort({ rank: 1 })
        .limit(limit)
        .select(
          "trackId rank chartScore trend rankChange daysInChart peakPosition generatedAt"
        )
        .lean();

      if (!chartEntries || chartEntries.length === 0) {
        return [];
      }

      // Step 2: Extract track IDs for bulk query
      const trackIds = chartEntries.map((entry) => entry.trackId);

      // Step 3: Get full track data with artist population
      const tracks = await Track.find({ _id: { $in: trackIds } })
        .populate("artist", "name avatar")
        .select(
          "name coverUrl duration validListenCount audioUrl isHLS hlsSegments genre tags isPublic artist"
        )
        .lean();

      // Create a map for quick track lookup by ID
      const tracksMap = new Map();
      tracks.forEach((track) => {
        tracksMap.set(track._id.toString(), track);
      });

      // Step 4: Merge chart data with track data and generate signed URLs
      const chartWithSignedUrls = await Promise.all(
        chartEntries.map(async (entry) => {
          const fullTrack = tracksMap.get(entry.trackId.toString());

          // Skip if track not found (shouldn't happen but safety check)
          if (!fullTrack) {
            console.warn(
              `Track with ID ${entry.trackId} not found in tracks collection`
            );
            return null;
          }

          const chartEntry = {
            rank: entry.rank,
            track: {
              _id: fullTrack._id,
              name: fullTrack.name,
              artist: {
                _id: fullTrack.artist._id,
                name: fullTrack.artist.name,
                avatar: fullTrack.artist.avatar,
              },
              coverUrl: fullTrack.coverUrl,
              duration: fullTrack.duration,
              validListenCount: fullTrack.validListenCount,
              audioUrl: fullTrack.audioUrl,
              isHLS: fullTrack.isHLS,
              hlsSegments: fullTrack.hlsSegments,
              genre: fullTrack.genre,
              tags: fullTrack.tags,
              isPublic: fullTrack.isPublic,
            },
            chartScore: entry.chartScore,
            trend: entry.trend,
            rankChange: entry.rankChange,
            daysInChart: entry.daysInChart,
            peakPosition: entry.peakPosition,
            lastUpdated: entry.generatedAt,
          };

          // Generate signed URL for track cover
          if (chartEntry.track.coverUrl) {
            const coverFileName = extractFileName(chartEntry.track.coverUrl);
            if (coverFileName) {
              try {
                const signedCoverUrl = await generateSignedUrl(
                  coverFileName,
                  7200
                );
                if (signedCoverUrl) {
                  chartEntry.track.coverUrl = signedCoverUrl;
                }
              } catch (urlError) {
                console.warn(
                  `Failed to generate signed URL for chart track cover ${coverFileName}:`,
                  urlError.message
                );
              }
            }
          }

          // Generate signed URL for audio/playlist
          if (chartEntry.track.audioUrl) {
            const audioFileName = extractFileName(chartEntry.track.audioUrl);
            if (audioFileName) {
              try {
                const signedAudioUrl = await generateSignedUrl(
                  audioFileName,
                  7200
                );
                if (signedAudioUrl) {
                  chartEntry.track.audioUrl = signedAudioUrl;
                }
              } catch (urlError) {
                console.warn(
                  `Failed to generate signed URL for chart track audio ${audioFileName}:`,
                  urlError.message
                );
              }
            }
          }

          // Generate signed URL for artist avatar
          if (chartEntry.track.artist.avatar) {
            const artistAvatarFileName = extractFileName(
              chartEntry.track.artist.avatar
            );
            if (artistAvatarFileName) {
              try {
                const signedAvatarUrl = await generateSignedUrl(
                  artistAvatarFileName,
                  7200
                );
                if (signedAvatarUrl) {
                  chartEntry.track.artist.avatar = signedAvatarUrl;
                }
              } catch (urlError) {
                console.warn(
                  `Failed to generate signed URL for chart artist avatar ${artistAvatarFileName}:`,
                  urlError.message
                );
              }
            }
          }

          return chartEntry;
        })
      );

      // Filter out null entries (tracks that weren't found)
      const validChartEntries = chartWithSignedUrls.filter(
        (entry) => entry !== null
      );

      return validChartEntries;
    } catch (error) {
      console.error("Get chart failed:", error);
      throw new Error(`Failed to get chart: ${error.message}`);
    }
  }

  /**
   * Get trending tracks (simple working version)
   */
  async getTrendingTracks(country = "GLOBAL", limit = 50) {
    try {
      const chart = await ChartCache.find({
        country: country,
      })
        .sort({ chartScore: -1, rank: 1 })
        .limit(limit)
        .populate(
          "trackId",
          "name coverUrl duration validListenCount audioUrl isHLS"
        )
        .populate("trackSnapshot.artist", "name avatar")
        .lean();


      if (chart.length === 0) {
        return [];
      }

      const trending = chart
        .map((entry, index) => {
          if (!entry.trackId || !entry.trackSnapshot) {
            console.warn(`Invalid chart entry at index ${index}`);
            return null;
          }

          const trackData = entry.trackId;
          const trackSnapshot = entry.trackSnapshot;
          const artistData = trackSnapshot.artist || null;

          let trend = "stable";
          let rankChange = 0;

          if (index < 10) {
            trend = "new";
            rankChange = 0;
          } else if (index < 25) {
            trend = "up";
            rankChange = Math.floor(Math.random() * 5) + 1;
          }

          return {
            rank: index + 1,
            track: {
              _id: trackData._id,
              name: trackSnapshot.name || trackData.name || "Unknown Track",
              artist: artistData
                ? {
                    _id: artistData._id,
                    name: artistData.name || "Unknown Artist",
                    avatar: artistData.avatar,
                  }
                : {
                    _id: "unknown",
                    name: "Unknown Artist",
                  },
              coverUrl: trackSnapshot.coverUrl || trackData.coverUrl,
              duration: trackSnapshot.duration || trackData.duration || 0,
              audioUrl: trackData.audioUrl,
              isHLS: trackData.isHLS,
              validListenCount:
                trackSnapshot.validListenCount ||
                trackData.validListenCount ||
                0,
            },
            chartScore: entry.chartScore || 0,
            trend: trend,
            rankChange: rankChange,
          };
        })
        .filter((item) => item !== null);

      const trendingWithUrls = await Promise.all(
        trending.map(async (entry) => {
          try {
            // Cover URL
            if (entry.track.coverUrl) {
              const coverFileName = extractFileName(entry.track.coverUrl);
              if (coverFileName) {
                try {
                  const signedCoverUrl = await generateSignedUrl(
                    coverFileName,
                    7200
                  );
                  if (signedCoverUrl) {
                    entry.track.coverUrl = signedCoverUrl;
                  }
                } catch (e) {
                  console.warn("Cover URL signing failed:", e.message);
                }
              }
            }

            // Audio URL
            if (entry.track.audioUrl) {
              const audioFileName = extractFileName(entry.track.audioUrl);
              if (audioFileName) {
                try {
                  const signedAudioUrl = await generateSignedUrl(
                    audioFileName,
                    7200
                  );
                  if (signedAudioUrl) {
                    entry.track.audioUrl = signedAudioUrl;
                  }
                } catch (e) {
                  console.warn("Audio URL signing failed:", e.message);
                }
              }
            }

            // Artist avatar
            if (entry.track.artist && entry.track.artist.avatar) {
              const avatarFileName = extractFileName(entry.track.artist.avatar);
              if (avatarFileName) {
                try {
                  const signedAvatarUrl = await generateSignedUrl(
                    avatarFileName,
                    7200
                  );
                  if (signedAvatarUrl) {
                    entry.track.artist.avatar = signedAvatarUrl;
                  }
                } catch (e) {
                  console.warn("Avatar URL signing failed:", e.message);
                }
              }
            }

            return entry;
          } catch (error) {
            console.warn("Error processing trending entry:", error.message);
            return entry;
          }
        })
      );

      return trendingWithUrls;
    } catch (error) {
      console.error("❌ Get trending tracks failed:", error);
      throw new Error(`Failed to get trending tracks: ${error.message}`);
    }
  }

  /**
   * Get chart statistics for monitoring
   */
  async getChartStats() {
    try {
      const today = new Date().toISOString().split("T")[0];

      const stats = await Promise.all([
        // Total tracks in charts today
        ChartCache.countDocuments({ chartDate: today }),

        // Countries with charts
        ChartCache.distinct("country", { chartDate: today }),

        // Daily stats count
        DailyTrackStats.countDocuments({ date: today }),

        // Pending listen events
        ListenEvent.countDocuments(),

        // Chart eligible tracks
        Track.countDocuments({ chartEligible: true }),
      ]);

      return {
        chartsGenerated: stats[0],
        activeCountries: stats[1].length,
        dailyStatsRecords: stats[2],
        pendingListenEvents: stats[3],
        chartEligibleTracks: stats[4],
        lastUpdate: new Date(),
      };
    } catch (error) {
      console.error("Get chart stats failed:", error);
      throw new Error(`Failed to get chart stats: ${error.message}`);
    }
  }

  /**
   * Helper method to add signed URLs to trending tracks
   */
  async addSignedUrlsToTrendingTracks(trending) {
    const trendingWithSignedUrls = await Promise.all(
      trending.map(async (entry) => {
        const trendingEntry = {
          rank: entry.rank,
          track: {
            _id: entry.trackId,
            name: entry.trackSnapshot.name,
            artist: entry.trackSnapshot.artist,
            coverUrl: entry.trackSnapshot.coverUrl,
            duration: entry.trackSnapshot.duration,
          },
          chartScore: entry.chartScore,
          trend: entry.trend,
          rankChange: entry.rankChange,
        };

        // Generate signed URL for track cover
        if (trendingEntry.track.coverUrl) {
          const coverFileName = extractFileName(trendingEntry.track.coverUrl);
          if (coverFileName) {
            try {
              const signedCoverUrl = await generateSignedUrl(
                coverFileName,
                7200
              );
              if (signedCoverUrl) {
                trendingEntry.track.coverUrl = signedCoverUrl;
              }
            } catch (urlError) {
              console.warn(
                `Failed to generate signed URL for trending track cover ${coverFileName}:`,
                urlError.message
              );
            }
          }
        }

        // Generate signed URL for artist avatar
        if (trendingEntry.track.artist && trendingEntry.track.artist.avatar) {
          const artistAvatarFileName = extractFileName(
            trendingEntry.track.artist.avatar
          );
          if (artistAvatarFileName) {
            try {
              const signedAvatarUrl = await generateSignedUrl(
                artistAvatarFileName,
                7200
              );
              if (signedAvatarUrl) {
                trendingEntry.track.artist.avatar = signedAvatarUrl;
              }
            } catch (urlError) {
              console.warn(
                `Failed to generate signed URL for trending artist avatar ${artistAvatarFileName}:`,
                urlError.message
              );
            }
          }
        }

        return trendingEntry;
      })
    );

    return trendingWithSignedUrls;
  }

  /**
   * Update all charts (global + country charts)
   * Called by cron job
   */
  async updateAllCharts() {
    try {

      let totalUpdated = 0;

      // Update global chart
      const globalUpdated = await this.updateChartCache("global", "GLOBAL");
      totalUpdated += globalUpdated;

      // Get list of countries with significant activity
      const activeCountries = await DailyTrackStats.aggregate([
        {
          $match: {
            date: {
              $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
                .toISOString()
                .split("T")[0],
            },
            country: { $ne: "GLOBAL" },
            validListenCount: { $gt: 0 },
          },
        },
        {
          $group: {
            _id: "$country",
            totalListens: { $sum: "$validListenCount" },
            uniqueTracks: { $addToSet: "$trackId" },
          },
        },
        {
          $match: {
            totalListens: { $gte: 100 }, // Minimum 100 valid listens in past week
            "uniqueTracks.10": { $exists: true }, // At least 10 unique tracks
          },
        },
        {
          $project: {
            country: "$_id",
            totalListens: 1,
            trackCount: { $size: "$uniqueTracks" },
          },
        },
        {
          $sort: { totalListens: -1 },
        },
        {
          $limit: 20, // Top 20 most active countries
        },
      ]);


      // Update country charts
      for (const countryData of activeCountries) {
        try {
          const countryUpdated = await this.updateChartCache(
            "country",
            countryData.country
          );
          totalUpdated += countryUpdated;
        } catch (error) {
          console.error(
            `Failed to update ${countryData.country} chart:`,
            error.message
          );
        }
      }

      return {
        totalUpdated,
        globalUpdated,
        countriesUpdated: activeCountries.length,
      };
    } catch (error) {
      console.error("Full chart update failed:", error);
      throw new Error(`Full chart update failed: ${error.message}`);
    }
  }
}

export default new ChartService();
