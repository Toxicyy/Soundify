import ChartService from "../services/ChartService.js";
import chartCronJobs from "../cron/chart-cron-jobs.js";
import { ApiResponse } from "../utils/responses.js";
import { catchAsync } from "../utils/helpers.js";
import { ChartCache, DailyTrackStats } from "../models/Chart.model.js";

/**
 * Chart controller handling HTTP requests for chart operations
 * Manages global charts, country charts, trending tracks, and chart administration
 */

/**
 * Get global charts (Top 50 worldwide)
 * GET /api/charts/global?limit=50
 */
export const getGlobalChart = catchAsync(async (req, res) => {
  const { limit = 50 } = req.query;
  const parsedLimit = Math.min(parseInt(limit) || 50, 100); // Max 100

  const chart = await ChartService.getChart("global", "GLOBAL", parsedLimit);

  if (chart.length === 0) {
    return res
      .status(404)
      .json(ApiResponse.error("Global chart not available yet"));
  }

  res.json(
    ApiResponse.success("Global chart retrieved successfully", {
      chart,
      metadata: {
        type: "global",
        country: "GLOBAL",
        limit: parsedLimit,
        totalTracks: chart.length,
        lastUpdated: chart[0]?.lastUpdated,
        generatedAt: new Date(),
      },
    })
  );
});

/**
 * Get country-specific charts
 * GET /api/charts/country/:countryCode?limit=50
 */
export const getCountryChart = catchAsync(async (req, res) => {
  const { countryCode } = req.params;
  const { limit = 50 } = req.query;

  if (!countryCode || countryCode.length !== 2) {
    return res
      .status(400)
      .json(ApiResponse.error("Valid 2-letter country code is required"));
  }

  const parsedLimit = Math.min(parseInt(limit) || 50, 100);
  const upperCountryCode = countryCode.toUpperCase();

  const chart = await ChartService.getChart(
    "country",
    upperCountryCode,
    parsedLimit
  );

  if (chart.length === 0) {
    return res
      .status(404)
      .json(
        ApiResponse.error(`Chart for ${upperCountryCode} not available yet`)
      );
  }

  res.json(
    ApiResponse.success(`${upperCountryCode} chart retrieved successfully`, {
      chart,
      metadata: {
        type: "country",
        country: upperCountryCode,
        limit: parsedLimit,
        totalTracks: chart.length,
        lastUpdated: chart[0]?.lastUpdated,
        generatedAt: new Date(),
      },
    })
  );
});

/**
 * Get trending tracks (biggest gainers)
 * GET /api/charts/trending?country=GLOBAL&limit=20
 */
export const getTrendingTracks = catchAsync(async (req, res) => {
  const { country = "GLOBAL", limit = 20 } = req.query;
  const parsedLimit = Math.min(parseInt(limit) || 20, 50);
  const upperCountry = country.toUpperCase();

  const trending = await ChartService.getTrendingTracks(
    upperCountry,
    parsedLimit
  );

  res.json(
    ApiResponse.success("Trending tracks retrieved successfully", {
      trending,
      metadata: {
        type: "trending",
        country: upperCountry,
        limit: parsedLimit,
        totalTracks: trending.length,
        generatedAt: new Date(),
      },
    })
  );
});

/**
 * Get available countries with charts
 * GET /api/charts/countries
 */
export const getAvailableCountries = catchAsync(async (req, res) => {
  const countries = await ChartCache.aggregate([
    {
      $match: {
        type: "country",
        country: { $ne: "GLOBAL" },
      },
    },
    {
      $group: {
        _id: "$country",
        trackCount: { $sum: 1 },
        lastUpdated: { $max: "$generatedAt" },
      },
    },
    {
      $project: {
        countryCode: "$_id",
        trackCount: 1,
        lastUpdated: 1,
        _id: 0,
      },
    },
    {
      $sort: { trackCount: -1 },
    },
  ]);

  res.json(
    ApiResponse.success("Available countries retrieved successfully", {
      countries,
      metadata: {
        totalCountries: countries.length,
        generatedAt: new Date(),
      },
    })
  );
});

/**
 * Get chart position history for a specific track
 * GET /api/charts/track/:trackId/history?country=GLOBAL&days=30
 */
export const getTrackChartHistory = catchAsync(async (req, res) => {
  const { trackId } = req.params;
  const { country = "GLOBAL", days = 30 } = req.query;

  const parsedDays = Math.min(parseInt(days) || 30, 90);
  const upperCountry = country.toUpperCase();

  // Get chart history for the track
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - parsedDays);

  const chartHistory = await ChartCache.find({
    trackId,
    country: upperCountry,
    generatedAt: { $gte: startDate },
  })
    .sort({ generatedAt: 1 })
    .select("rank chartScore trend chartDate generatedAt")
    .lean();

  if (chartHistory.length === 0) {
    return res
      .status(404)
      .json(ApiResponse.error("No chart history found for this track"));
  }

  // Get current track info
  const currentEntry = await ChartCache.findOne({
    trackId,
    country: upperCountry,
  })
    .populate("trackSnapshot.artist", "name")
    .sort({ generatedAt: -1 });

  res.json(
    ApiResponse.success("Track chart history retrieved successfully", {
      track: currentEntry
        ? {
            _id: trackId,
            name: currentEntry.trackSnapshot.name,
            artist: currentEntry.trackSnapshot.artist,
          }
        : null,
      history: chartHistory,
      metadata: {
        trackId,
        country: upperCountry,
        daysRequested: parsedDays,
        entriesFound: chartHistory.length,
        dateRange: {
          from: startDate.toISOString().split("T")[0],
          to: new Date().toISOString().split("T")[0],
        },
      },
    })
  );
});

/**
 * Get chart statistics and system health
 * GET /api/charts/stats
 */
export const getChartStats = catchAsync(async (req, res) => {
  const stats = await ChartService.getChartStats();

  // Get additional statistics
  const additionalStats = await Promise.all([
    // Top countries by chart activity
    ChartCache.aggregate([
      { $match: { type: "country" } },
      { $group: { _id: "$country", tracks: { $sum: 1 } } },
      { $sort: { tracks: -1 } },
      { $limit: 10 },
    ]),

    // Chart update frequency
    ChartCache.aggregate([
      {
        $group: {
          _id: { $dateToString: { format: "%Y-%m-%d", date: "$generatedAt" } },
          updates: { $sum: 1 },
        },
      },
      { $sort: { _id: -1 } },
      { $limit: 7 },
    ]),
  ]);

  res.json(
    ApiResponse.success("Chart statistics retrieved successfully", {
      ...stats,
      topCountries: additionalStats[0],
      recentActivity: additionalStats[1],
      cronJobs: chartCronJobs.getStatus(),
    })
  );
});

/**
 * ADMIN: Manually trigger chart update
 * POST /api/charts/admin/update
 */
export const triggerChartUpdate = catchAsync(async (req, res) => {
  // Check if user is admin
  if (req.user?.status !== "ADMIN") {
    return res.status(403).json(ApiResponse.error("Admin access required"));
  }

  const { type = "all" } = req.body;

  try {
    let result;

    switch (type) {
      case "aggregation":
        result = await ChartService.aggregateListenEvents();
        break;
      case "charts":
        result = await ChartService.updateAllCharts();
        break;
      case "all":
        await ChartService.aggregateListenEvents();
        result = await ChartService.updateAllCharts();
        break;
      default:
        return res
          .status(400)
          .json(
            ApiResponse.error(
              "Invalid update type. Use: aggregation, charts, or all"
            )
          );
    }

    res.json(
      ApiResponse.success(`Chart ${type} update completed successfully`, result)
    );
  } catch (error) {
    res
      .status(500)
      .json(ApiResponse.error(`Chart update failed: ${error.message}`));
  }
});

/**
 * ADMIN: Trigger specific cron job
 * POST /api/charts/admin/cron/:jobName
 */
export const triggerCronJob = catchAsync(async (req, res) => {
  if (req.user?.status !== "ADMIN") {
    return res.status(403).json(ApiResponse.error("Admin access required"));
  }

  const { jobName } = req.params;
  const validJobs = [
    "aggregation",
    "chartUpdate",
    "dailyRecalc",
    "cleanup",
    "healthCheck",
  ];

  if (!validJobs.includes(jobName)) {
    return res
      .status(400)
      .json(
        ApiResponse.error(
          `Invalid job name. Valid jobs: ${validJobs.join(", ")}`
        )
      );
  }

  try {
    await chartCronJobs.triggerJob(jobName);

    res.json(ApiResponse.success(`Cron job ${jobName} triggered successfully`));
  } catch (error) {
    res
      .status(500)
      .json(ApiResponse.error(`Cron job trigger failed: ${error.message}`));
  }
});

/**
 * ADMIN: Get detailed chart cache info
 * GET /api/charts/admin/cache?type=global&country=GLOBAL
 */
export const getChartCacheInfo = catchAsync(async (req, res) => {
  if (req.user?.status !== "ADMIN") {
    return res.status(403).json(ApiResponse.error("Admin access required"));
  }

  const { type, country, limit = 10 } = req.query;

  const query = {};
  if (type) query.type = type;
  if (country) query.country = country.toUpperCase();

  const cacheEntries = await ChartCache.find(query)
    .sort({ generatedAt: -1, rank: 1 })
    .limit(parseInt(limit))
    .populate("trackSnapshot.artist", "name")
    .lean();

  const cacheStats = await ChartCache.aggregate([
    { $match: query },
    {
      $group: {
        _id: { type: "$type", country: "$country" },
        count: { $sum: 1 },
        lastUpdated: { $max: "$generatedAt" },
        avgScore: { $avg: "$chartScore" },
      },
    },
  ]);

  res.json(
    ApiResponse.success("Chart cache info retrieved successfully", {
      entries: cacheEntries,
      stats: cacheStats,
      query,
      metadata: {
        totalFound: cacheEntries.length,
        generatedAt: new Date(),
      },
    })
  );
});

/**
 * ADMIN: Clear chart cache
 * DELETE /api/charts/admin/cache
 */
export const clearChartCache = catchAsync(async (req, res) => {
  if (req.user?.status !== "ADMIN") {
    return res.status(403).json(ApiResponse.error("Admin access required"));
  }

  const { type, country } = req.query;

  const deleteQuery = {};
  if (type) deleteQuery.type = type;
  if (country) deleteQuery.country = country.toUpperCase();

  const deleteResult = await ChartCache.deleteMany(deleteQuery);

  res.json(
    ApiResponse.success("Chart cache cleared successfully", {
      deletedCount: deleteResult.deletedCount,
      query: deleteQuery,
    })
  );
});

/**
 * Get chart performance metrics
 * GET /api/charts/performance
 */
export const getChartPerformance = catchAsync(async (req, res) => {
  const { days = 7 } = req.query;
  const parsedDays = Math.min(parseInt(days) || 7, 30);

  const startDate = new Date();
  startDate.setDate(startDate.getDate() - parsedDays);

  // Performance metrics
  const metrics = await Promise.all([
    // Daily chart generation count
    ChartCache.aggregate([
      {
        $match: {
          generatedAt: { $gte: startDate },
        },
      },
      {
        $group: {
          _id: { $dateToString: { format: "%Y-%m-%d", date: "$generatedAt" } },
          chartsGenerated: { $sum: 1 },
          avgScore: { $avg: "$chartScore" },
          countries: { $addToSet: "$country" },
        },
      },
      {
        $addFields: {
          countryCount: { $size: "$countries" },
        },
      },
      {
        $sort: { _id: 1 },
      },
    ]),

    // Listen events processing stats
    DailyTrackStats.aggregate([
      {
        $match: {
          createdAt: { $gte: startDate },
        },
      },
      {
        $group: {
          _id: "$date",
          totalListens: { $sum: "$listenCount" },
          validListens: { $sum: "$validListenCount" },
          uniqueTracks: { $addToSet: "$trackId" },
          countries: { $addToSet: "$country" },
        },
      },
      {
        $addFields: {
          trackCount: { $size: "$uniqueTracks" },
          countryCount: { $size: "$countries" },
          validityRate: {
            $cond: [
              { $gt: ["$totalListens", 0] },
              { $divide: ["$validListens", "$totalListens"] },
              0,
            ],
          },
        },
      },
      {
        $sort: { _id: 1 },
      },
    ]),
  ]);

  res.json(
    ApiResponse.success("Chart performance metrics retrieved successfully", {
      chartGeneration: metrics[0],
      listenProcessing: metrics[1],
      metadata: {
        daysAnalyzed: parsedDays,
        dateRange: {
          from: startDate.toISOString().split("T")[0],
          to: new Date().toISOString().split("T")[0],
        },
        generatedAt: new Date(),
      },
    })
  );
});

/**
 * Get top movers in charts
 * GET /api/charts/movers?country=GLOBAL&limit=20&direction=up
 */
export const getTopMovers = catchAsync(async (req, res) => {
  const { country = "GLOBAL", limit = 20, direction = "up" } = req.query;
  const parsedLimit = Math.min(parseInt(limit) || 20, 50);
  const upperCountry = country.toUpperCase();

  const sortOrder = direction === "up" ? -1 : 1; // Up = highest positive change first

  const movers = await ChartCache.find({
    country: upperCountry,
    rankChange: direction === "up" ? { $gt: 0 } : { $lt: 0 },
  })
    .sort({ rankChange: sortOrder })
    .limit(parsedLimit)
    .populate("trackSnapshot.artist", "name")
    .lean();

  res.json(
    ApiResponse.success(`Top ${direction} movers retrieved successfully`, {
      movers: movers.map((entry) => ({
        rank: entry.rank,
        previousRank: entry.previousRank,
        rankChange: entry.rankChange,
        track: {
          _id: entry.trackId,
          name: entry.trackSnapshot.name,
          artist: entry.trackSnapshot.artist,
          coverUrl: entry.trackSnapshot.coverUrl,
        },
        chartScore: entry.chartScore,
        trend: entry.trend,
      })),
      metadata: {
        country: upperCountry,
        direction,
        limit: parsedLimit,
        totalFound: movers.length,
        generatedAt: new Date(),
      },
    })
  );
});
