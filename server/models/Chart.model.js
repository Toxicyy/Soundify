import mongoose from "mongoose";

/**
 * Listen event tracking for real-time statistics
 * Temporary collection that gets aggregated into DailyTrackStats
 */
const listenEventSchema = new mongoose.Schema(
  {
    trackId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: "Track",
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null, // null for anonymous listens
    },
    sessionId: {
      type: String, // For tracking unique anonymous listeners
      required: true,
    },
    country: {
      type: String,
      default: "GLOBAL",
    },
    listenDuration: {
      type: Number,
      required: true,
    },
    isValid: {
      type: Boolean, // Whether listen meets minimum duration requirement
      required: true,
    },
    userAgent: {
      type: String,
      default: null,
    },
    ipAddress: {
      type: String,
      default: null,
    },
    timestamp: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes for listen event processing
listenEventSchema.index({ trackId: 1, timestamp: 1 });
listenEventSchema.index({ timestamp: 1 });
listenEventSchema.index({ country: 1, timestamp: 1 });
listenEventSchema.index({ sessionId: 1, trackId: 1 });

// TTL index to automatically delete processed events after 24 hours
listenEventSchema.index({ timestamp: 1 }, { expireAfterSeconds: 24 * 60 * 60 });

/**
 * Daily track statistics for chart calculations
 * Stores listen data per track per day per country
 */
const dailyTrackStatsSchema = new mongoose.Schema(
  {
    trackId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: "Track",
    },
    date: {
      type: String, // Format: "YYYY-MM-DD"
      required: true,
    },
    country: {
      type: String, // ISO country code (US, RU, DE) or "GLOBAL"
      required: true,
      default: "GLOBAL",
    },
    // Total listens (including invalid ones)
    listenCount: {
      type: Number,
      default: 0,
    },
    // Valid listens (>= 30 seconds or 25% of track duration)
    validListenCount: {
      type: Number,
      default: 0,
    },
    // Unique users who listened to this track
    uniqueListeners: {
      type: Number,
      default: 0,
    },
    // Total listen duration in seconds
    totalListenDuration: {
      type: Number,
      default: 0,
    },
    // Average listen duration
    averageListenDuration: {
      type: Number,
      default: 0,
    },
    // Track metadata snapshot for faster queries
    trackSnapshot: {
      name: String,
      artist: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Artist",
      },
      genre: String,
      duration: Number,
    },
  },
  {
    timestamps: true,
  }
);

// Compound indexes for efficient queries
dailyTrackStatsSchema.index({ date: 1, country: 1 });
dailyTrackStatsSchema.index(
  { trackId: 1, date: 1, country: 1 },
  { unique: true }
);
dailyTrackStatsSchema.index({ date: 1, validListenCount: -1 });
dailyTrackStatsSchema.index({ country: 1, date: 1, validListenCount: -1 });
dailyTrackStatsSchema.index({
  "trackSnapshot.genre": 1,
  date: 1,
  validListenCount: -1,
});

// TTL index to automatically delete old stats after 90 days
dailyTrackStatsSchema.index(
  { createdAt: 1 },
  { expireAfterSeconds: 90 * 24 * 60 * 60 }
);

/**
 * Cached chart positions for fast API responses
 * Updated by cron job every 15 minutes
 */
const chartCacheSchema = new mongoose.Schema(
  {
    type: {
      type: String,
      enum: ["global", "country"],
      required: true,
    },
    country: {
      type: String, // null for global charts, ISO code for country charts
      default: null,
    },
    rank: {
      type: Number,
      required: true,
      min: 1,
    },
    trackId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: "Track",
    },
    // Calculated chart score using weighted algorithm
    chartScore: {
      type: Number,
      required: true,
    },
    // Trend indicators
    trend: {
      type: String,
      enum: ["up", "down", "stable", "new"],
      default: "stable",
    },
    previousRank: {
      type: Number,
      default: null,
    },
    rankChange: {
      type: Number, // Positive = moved up, Negative = moved down
      default: 0,
    },
    // Days in chart
    daysInChart: {
      type: Number,
      default: 1,
    },
    // Peak position achieved
    peakPosition: {
      type: Number,
      default: null,
    },
    // Track metadata for faster API responses
    trackSnapshot: {
      name: String,
      artist: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Artist",
      },
      genre: String,
      coverUrl: String,
      duration: Number,
      validListenCount: Number,
    },
    // Chart generation metadata
    chartDate: {
      type: String, // Format: "YYYY-MM-DD"
      required: true,
    },
    generatedAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes for fast chart queries
chartCacheSchema.index({ type: 1, country: 1, rank: 1 });
chartCacheSchema.index({ type: 1, country: 1, chartScore: -1 });
chartCacheSchema.index({ trackId: 1, type: 1, country: 1 });
chartCacheSchema.index({ chartDate: 1, type: 1, country: 1 });
chartCacheSchema.index({ trend: 1, type: 1, country: 1 });

// TTL index to automatically delete old cache after 7 days
chartCacheSchema.index(
  { generatedAt: 1 },
  { expireAfterSeconds: 7 * 24 * 60 * 60 }
);

// Ensure uniqueness of rank per chart type/country
chartCacheSchema.index(
  { type: 1, country: 1, rank: 1, chartDate: 1 },
  { unique: true }
);

// Export models
export const ListenEvent = mongoose.model("ListenEvent", listenEventSchema);
export const DailyTrackStats = mongoose.model(
  "DailyTrackStats",
  dailyTrackStatsSchema
);
export const ChartCache = mongoose.model("ChartCache", chartCacheSchema);
