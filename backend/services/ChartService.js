import {
  DailyTrackStats,
  ChartCache,
  ListenEvent,
} from "../models/Chart.model.js";
import Track from "../models/Track.model.js";

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
      console.log("Starting listen events aggregation...");

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
      console.log(
        `Found ${aggregatedData.length} track-country combinations to update`
      );

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

      console.log(
        `Aggregation complete. Deleted ${deletedCount.deletedCount} old listen events`
      );
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
      console.log(`Calculating chart scores for ${country}...`);

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
      console.log(`Calculated scores for ${chartData.length} tracks`);

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
      console.log(
        `Updating ${chartType} chart cache for ${country || "GLOBAL"}...`
      );

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

      console.log(
        `Updated ${chartType} chart cache with ${newChartEntries.length} entries`
      );
      return newChartEntries.length;
    } catch (error) {
      console.error("Chart cache update failed:", error);
      throw new Error(`Chart cache update failed: ${error.message}`);
    }
  }

  /**
   * Get cached chart data for API responses
   */
  async getChart(chartType = "global", country = null, limit = 50) {
    try {
      const targetCountry = country || "GLOBAL";

      const chart = await ChartCache.find({
        type: chartType,
        country: targetCountry,
      })
        .sort({ rank: 1 })
        .limit(limit)
        .populate("trackId", "name coverUrl duration validListenCount")
        .populate("trackSnapshot.artist", "name avatar")
        .lean();

      return chart.map((entry) => ({
        rank: entry.rank,
        track: {
          _id: entry.trackId._id,
          name: entry.trackSnapshot.name,
          artist: entry.trackSnapshot.artist,
          coverUrl: entry.trackSnapshot.coverUrl,
          duration: entry.trackSnapshot.duration,
          validListenCount: entry.trackSnapshot.validListenCount,
        },
        chartScore: entry.chartScore,
        trend: entry.trend,
        rankChange: entry.rankChange,
        daysInChart: entry.daysInChart,
        peakPosition: entry.peakPosition,
        lastUpdated: entry.generatedAt,
      }));
    } catch (error) {
      console.error("Get chart failed:", error);
      throw new Error(`Failed to get chart: ${error.message}`);
    }
  }

  /**
   * Get trending tracks (biggest gainers)
   */
  async getTrendingTracks(country = "GLOBAL", limit = 20) {
    try {
      const trending = await ChartCache.find({
        type: "global",
        country: country,
        $or: [{ trend: "up" }, { trend: "new" }],
      })
        .sort({ rankChange: -1, chartScore: -1 })
        .limit(limit)
        .populate("trackSnapshot.artist", "name avatar")
        .lean();

      return trending.map((entry) => ({
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
      }));
    } catch (error) {
      console.error("Get trending tracks failed:", error);
      throw new Error(`Failed to get trending tracks: ${error.message}`);
    }
  }

  /**
   * Update all charts (global + country charts)
   * Called by cron job
   */
  async updateAllCharts() {
    try {
      console.log("Starting full chart update...");

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

      console.log(
        `Found ${activeCountries.length} active countries for charts`
      );

      // Update country charts
      for (const countryData of activeCountries) {
        try {
          const countryUpdated = await this.updateChartCache(
            "country",
            countryData.country
          );
          totalUpdated += countryUpdated;
          console.log(
            `Updated ${countryData.country} chart: ${countryUpdated} tracks`
          );
        } catch (error) {
          console.error(
            `Failed to update ${countryData.country} chart:`,
            error.message
          );
        }
      }

      console.log(
        `Chart update complete! Total entries updated: ${totalUpdated}`
      );
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
}

export default new ChartService();
