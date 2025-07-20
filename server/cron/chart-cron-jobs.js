import cron from "node-cron";
import ChartService from "../services/ChartService.js";
import { config } from "../config/config.js";

/**
 * Cron jobs for chart system automation
 * Handles periodic aggregation and chart updates
 */

class ChartCronJobs {
  constructor() {
    this.jobs = new Map();
    this.isRunning = false;
  }

  /**
   * Start all chart-related cron jobs
   */
  start() {
    if (this.isRunning) {
      console.log("Chart cron jobs are already running");
      return;
    }

    try {
      // Job 1: Aggregate listen events every 15 minutes
      const aggregationJob = cron.schedule(
        "*/15 * * * *",
        async () => {
          await this.runListenEventsAggregation();
        },
        {
          scheduled: false,
          timezone: "UTC",
        }
      );

      // Job 2: Update charts every 15 minutes (offset by 5 minutes from aggregation)
      const chartUpdateJob = cron.schedule(
        "5,20,35,50 * * * *",
        async () => {
          await this.runChartUpdate();
        },
        {
          scheduled: false,
          timezone: "UTC",
        }
      );

      // Job 3: Full chart recalculation daily at 00:30 UTC
      const dailyRecalcJob = cron.schedule(
        "30 0 * * *",
        async () => {
          await this.runDailyChartRecalculation();
        },
        {
          scheduled: false,
          timezone: "UTC",
        }
      );

      // Job 4: Cleanup old data weekly on Sunday at 02:00 UTC
      const cleanupJob = cron.schedule(
        "0 2 * * 0",
        async () => {
          await this.runDataCleanup();
        },
        {
          scheduled: false,
          timezone: "UTC",
        }
      );

      // Job 5: Health check and stats logging every hour
      const healthCheckJob = cron.schedule(
        "0 * * * *",
        async () => {
          await this.runHealthCheck();
        },
        {
          scheduled: false,
          timezone: "UTC",
        }
      );

      // Store jobs for management
      this.jobs.set("aggregation", aggregationJob);
      this.jobs.set("chartUpdate", chartUpdateJob);
      this.jobs.set("dailyRecalc", dailyRecalcJob);
      this.jobs.set("cleanup", cleanupJob);
      this.jobs.set("healthCheck", healthCheckJob);

      // Start all jobs
      this.jobs.forEach((job, name) => {
        job.start();
        console.log(`Started ${name} cron job`);
      });

      this.isRunning = true;
      console.log("All chart cron jobs started successfully");

      // Run initial aggregation and chart update
      setTimeout(() => this.runListenEventsAggregation(), 5000);
      setTimeout(() => this.runChartUpdate(), 10000);
    } catch (error) {
      console.error("Failed to start chart cron jobs:", error);
      this.stop();
    }
  }

  /**
   * Stop all cron jobs
   */
  stop() {
    try {
      this.jobs.forEach((job, name) => {
        job.stop();
        console.log(`Stopped ${name} cron job`);
      });

      this.jobs.clear();
      this.isRunning = false;
      console.log("All chart cron jobs stopped");
    } catch (error) {
      console.error("Error stopping cron jobs:", error);
    }
  }

  /**
   * Restart all cron jobs
   */
  restart() {
    console.log("Restarting chart cron jobs...");
    this.stop();
    setTimeout(() => this.start(), 2000);
  }

  /**
   * Job 1: Aggregate listen events into daily statistics
   */
  async runListenEventsAggregation() {
    const startTime = Date.now();

    try {
      console.log("[CRON] Starting listen events aggregation...");

      const aggregatedCount = await ChartService.aggregateListenEvents();

      const duration = Date.now() - startTime;
      console.log(
        `[CRON] Listen events aggregation completed in ${duration}ms`
      );
      console.log(
        `[CRON] Processed ${aggregatedCount} track-country combinations`
      );

      // Log performance metrics
      if (duration > 30000) {
        // Warning if takes more than 30 seconds
        console.warn(
          `[CRON] Aggregation took ${duration}ms - consider optimization`
        );
      }
    } catch (error) {
      console.error("[CRON] Listen events aggregation failed:", error);

      // Send alert in production
      if (config.nodeEnv === "production") {
        await this.sendAlert("Listen Events Aggregation Failed", error.message);
      }
    }
  }

  /**
   * Job 2: Update chart rankings and cache
   */
  async runChartUpdate() {
    const startTime = Date.now();

    try {
      console.log("🏆 [CRON] Starting chart update...");

      const updateResult = await ChartService.updateAllCharts();

      const duration = Date.now() - startTime;
      console.log(`[CRON] Chart update completed in ${duration}ms`);
      console.log(
        `[CRON] Updated ${updateResult.totalUpdated} chart entries across ${updateResult.countriesUpdated} countries`
      );

      // Performance monitoring
      if (duration > 60000) {
        // Warning if takes more than 1 minute
        console.warn(
          `[CRON] Chart update took ${duration}ms - consider optimization`
        );
      }
    } catch (error) {
      console.error("[CRON] Chart update failed:", error);

      if (config.nodeEnv === "production") {
        await this.sendAlert("Chart Update Failed", error.message);
      }
    }
  }

  /**
   * Job 3: Daily full chart recalculation (more comprehensive)
   */
  async runDailyChartRecalculation() {
    const startTime = Date.now();

    try {
      console.log("[CRON] Starting daily chart recalculation...");

      // First, clean up any orphaned chart cache entries
      await this.cleanupOrphanedChartEntries();

      // Then run full chart update with extended lookback
      const updateResult = await ChartService.updateAllCharts();

      // Update track peak positions
      await this.updateTrackPeakPositions();

      const duration = Date.now() - startTime;
      console.log(
        `[CRON] Daily chart recalculation completed in ${duration}ms`
      );
      console.log(
        `[CRON] Recalculated ${updateResult.totalUpdated} chart entries`
      );
    } catch (error) {
      console.error("[CRON] Daily chart recalculation failed:", error);

      if (config.nodeEnv === "production") {
        await this.sendAlert("Daily Chart Recalculation Failed", error.message);
      }
    }
  }

  /**
   * Job 4: Weekly data cleanup
   */
  async runDataCleanup() {
    const startTime = Date.now();

    try {
      console.log("[CRON] Starting weekly data cleanup...");

      const results = {
        oldListenEvents: 0,
        oldChartCache: 0,
        orphanedStats: 0,
      };

      // Clean up old listen events (older than 24 hours)
      const oldListenEvents = await ListenEvent.deleteMany({
        timestamp: { $lt: new Date(Date.now() - 24 * 60 * 60 * 1000) },
      });
      results.oldListenEvents = oldListenEvents.deletedCount;

      // Clean up old chart cache (older than 7 days)
      const oldChartCache = await ChartCache.deleteMany({
        generatedAt: { $lt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) },
      });
      results.oldChartCache = oldChartCache.deletedCount;

      // Clean up daily stats for non-existent tracks
      const orphanedStats = await this.cleanupOrphanedDailyStats();
      results.orphanedStats = orphanedStats;

      const duration = Date.now() - startTime;
      console.log(`[CRON] Data cleanup completed in ${duration}ms`);
      console.log(
        `🗑️  [CRON] Cleaned: ${results.oldListenEvents} events, ${results.oldChartCache} cache entries, ${results.orphanedStats} orphaned stats`
      );
    } catch (error) {
      console.error("[CRON] Data cleanup failed:", error);
    }
  }

  /**
   * Job 5: Health check and system monitoring
   */
  async runHealthCheck() {
    try {
      console.log("[CRON] Running health check...");

      const stats = await ChartService.getChartStats();

      // Check for potential issues
      const issues = [];

      if (stats.pendingListenEvents > 10000) {
        issues.push(`High pending listen events: ${stats.pendingListenEvents}`);
      }

      if (stats.chartsGenerated === 0) {
        issues.push("No charts generated today");
      }

      if (stats.activeCountries < 5) {
        issues.push(`Low active countries: ${stats.activeCountries}`);
      }

      // Log health status
      if (issues.length === 0) {
        console.log("[HEALTH] Chart system healthy");
        console.log(
          `[HEALTH] Stats: ${stats.chartsGenerated} charts, ${stats.activeCountries} countries, ${stats.pendingListenEvents} pending events`
        );
      } else {
        console.warn("[HEALTH] Chart system issues detected:");
        issues.forEach((issue) => console.warn(`   - ${issue}`));

        if (config.nodeEnv === "production") {
          await this.sendAlert("Chart System Health Issues", issues.join("\n"));
        }
      }
    } catch (error) {
      console.error("[CRON] Health check failed:", error);
    }
  }

  /**
   * Helper: Clean up orphaned chart entries
   */
  async cleanupOrphanedChartEntries() {
    try {
      const orphanedEntries = await ChartCache.aggregate([
        {
          $lookup: {
            from: "tracks",
            localField: "trackId",
            foreignField: "_id",
            as: "track",
          },
        },
        {
          $match: {
            $or: [
              { track: { $size: 0 } }, // Track doesn't exist
              { "track.chartEligible": false }, // Track not chart eligible
            ],
          },
        },
        {
          $project: { _id: 1 },
        },
      ]);

      if (orphanedEntries.length > 0) {
        const orphanedIds = orphanedEntries.map((entry) => entry._id);
        const deleteResult = await ChartCache.deleteMany({
          _id: { $in: orphanedIds },
        });

        console.log(
          `🧹 Cleaned up ${deleteResult.deletedCount} orphaned chart entries`
        );
        return deleteResult.deletedCount;
      }

      return 0;
    } catch (error) {
      console.error("Error cleaning orphaned chart entries:", error);
      return 0;
    }
  }

  /**
   * Helper: Clean up orphaned daily stats
   */
  async cleanupOrphanedDailyStats() {
    try {
      const orphanedStats = await DailyTrackStats.aggregate([
        {
          $lookup: {
            from: "tracks",
            localField: "trackId",
            foreignField: "_id",
            as: "track",
          },
        },
        {
          $match: {
            track: { $size: 0 }, // Track doesn't exist
          },
        },
        {
          $project: { _id: 1 },
        },
      ]);

      if (orphanedStats.length > 0) {
        const orphanedIds = orphanedStats.map((stat) => stat._id);
        const deleteResult = await DailyTrackStats.deleteMany({
          _id: { $in: orphanedIds },
        });

        return deleteResult.deletedCount;
      }

      return 0;
    } catch (error) {
      console.error("Error cleaning orphaned daily stats:", error);
      return 0;
    }
  }

  /**
   * Helper: Update track peak positions
   */
  async updateTrackPeakPositions() {
    try {
      const topTracks = await ChartCache.find({
        type: "global",
        country: "GLOBAL",
      })
        .sort({ rank: 1 })
        .limit(100);

      for (const chartEntry of topTracks) {
        const track = await Track.findById(chartEntry.trackId);
        if (track) {
          let shouldUpdate = false;
          const updateData = {};

          if (
            !track.peakChartPosition?.global ||
            chartEntry.rank < track.peakChartPosition.global
          ) {
            updateData["peakChartPosition.global"] = chartEntry.rank;
            updateData["peakChartPosition.date"] = new Date();
            shouldUpdate = true;
          }

          if (shouldUpdate) {
            await Track.findByIdAndUpdate(chartEntry.trackId, updateData);
          }
        }
      }
    } catch (error) {
      console.error("Error updating track peak positions:", error);
    }
  }

  /**
   * Helper: Send alert notification (placeholder for future implementation)
   */
  async sendAlert(subject, message) {
    try {
      // TODO: Implement actual alerting (email, Slack, Discord, etc.)
      console.error(`ALERT: ${subject}`);
      console.error(`Message: ${message}`);

      // In production, you could send to:
      // - Email service
      // - Slack webhook
      // - Discord webhook
      // - SMS service
      // - Monitoring service (DataDog, New Relic, etc.)
    } catch (error) {
      console.error("Failed to send alert:", error);
    }
  }

  /**
   * Get status of all cron jobs
   */
  getStatus() {
    const status = {
      isRunning: this.isRunning,
      jobs: {},
    };

    this.jobs.forEach((job, name) => {
      status.jobs[name] = {
        running: job.running,
        destroyed: job.destroyed,
      };
    });

    return status;
  }

  /**
   * Manually trigger a specific job (for testing/debugging)
   */
  async triggerJob(jobName) {
    try {
      console.log(` Manually triggering ${jobName} job...`);

      switch (jobName) {
        case "aggregation":
          await this.runListenEventsAggregation();
          break;
        case "chartUpdate":
          await this.runChartUpdate();
          break;
        case "dailyRecalc":
          await this.runDailyChartRecalculation();
          break;
        case "cleanup":
          await this.runDataCleanup();
          break;
        case "healthCheck":
          await this.runHealthCheck();
          break;
        default:
          throw new Error(`Unknown job: ${jobName}`);
      }

      console.log(`Manually triggered ${jobName} completed`);
    } catch (error) {
      console.error(`Manual trigger of ${jobName} failed:`, error);
      throw error;
    }
  }
}

// Create singleton instance
const chartCronJobs = new ChartCronJobs();

// Export for use in main server file
export default chartCronJobs;

// Import necessary models
import {
  ListenEvent,
  DailyTrackStats,
  ChartCache,
} from "../models/Chart.model.js";
import Track from "../models/Track.model.js";
