import User from "../models/User.model.js";
import Artist from "../models/Artist.model.js";
import Playlist from "../models/Playlist.model.js";
import Track from "../models/Track.model.js";

class AnalyticsService {
  async getDashboardStats() {
    // Параллельные запросы для оптимизации
    const [totalUsers, activeArtists, platformPlaylists, monthlyStreams] =
      await Promise.all([
        User.countDocuments(),
        Artist.countDocuments(),
        Playlist.countDocuments({
          category: "featured",
          isDraft: false,
        }),
        this.getMonthlyStreamsCount(),
      ]);

    return {
      totalUsers,
      activeArtists,
      platformPlaylists,
      monthlyStreams,
      lastUpdated: new Date(),
    };
  }

  async getMonthlyStreamsCount() {
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);

    // Агрегация для подсчета прослушиваний за месяц
    const result = await Track.aggregate([
      {
        $match: {
          updatedAt: { $gte: startOfMonth },
        },
      },
      {
        $group: {
          _id: null,
          totalStreams: { $sum: "$listenCount" },
        },
      },
    ]);

    return result[0]?.totalStreams || 0;
  }

  async getUsersStats({ startDate, endDate }) {
    const query = {};

    if (startDate || endDate) {
      query.createdAt = {};
      if (startDate) query.createdAt.$gte = new Date(startDate);
      if (endDate) query.createdAt.$lte = new Date(endDate);
    }

    // Группировка по дням для графика
    const stats = await User.aggregate([
      { $match: query },
      {
        $group: {
          _id: {
            $dateToString: { format: "%Y-%m-%d", date: "$createdAt" },
          },
          count: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    return {
      total: await User.countDocuments(query),
      daily: stats,
      growth: this.calculateGrowth(stats),
    };
  }

  calculateGrowth(stats) {
    if (stats.length < 2) return 0;

    const lastWeek = stats.slice(-7).reduce((sum, day) => sum + day.count, 0);
    const previousWeek = stats
      .slice(-14, -7)
      .reduce((sum, day) => sum + day.count, 0);

    if (previousWeek === 0) return 100;
    return Math.round(((lastWeek - previousWeek) / previousWeek) * 100);
  }

  async getStreamsStats(period = "month") {
    const dateRange = this.getDateRange(period);

    const stats = await Track.aggregate([
      {
        $match: {
          updatedAt: { $gte: dateRange.start, $lte: dateRange.end },
        },
      },
      {
        $group: {
          _id: {
            $dateToString: {
              format: period === "day" ? "%Y-%m-%d %H:00" : "%Y-%m-%d",
              date: "$updatedAt",
            },
          },
          streams: { $sum: "$listenCount" },
          uniqueTracks: { $addToSet: "$_id" },
        },
      },
      {
        $project: {
          _id: 1,
          streams: 1,
          uniqueTracksCount: { $size: "$uniqueTracks" },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    return {
      period,
      data: stats,
      total: stats.reduce((sum, day) => sum + day.streams, 0),
    };
  }

  getDateRange(period) {
    const end = new Date();
    const start = new Date();

    switch (period) {
      case "day":
        start.setDate(start.getDate() - 1);
        break;
      case "week":
        start.setDate(start.getDate() - 7);
        break;
      case "month":
        start.setMonth(start.getMonth() - 1);
        break;
      case "year":
        start.setFullYear(start.getFullYear() - 1);
        break;
      default:
        start.setMonth(start.getMonth() - 1);
    }

    return { start, end };
  }
}

export default new AnalyticsService();
