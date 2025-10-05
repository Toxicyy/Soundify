/**
 * Analytics Controller
 * Handles HTTP requests for analytics and statistics
 * Provides dashboard stats, user analytics, and streaming statistics
 */

import { catchAsync } from "../utils/helpers.js";
import AnalyticsService from "../services/AnalyticsService.js";
import { ApiResponse } from "../utils/responses.js";

/**
 * Get dashboard statistics
 * Returns overview statistics for admin dashboard
 */
export const getDashboardStats = catchAsync(async (req, res) => {
  const stats = await AnalyticsService.getDashboardStats();
  res.json(ApiResponse.success("Statistics retrieved successfully", stats));
});

/**
 * Get user statistics with optional date range
 * Returns user growth and activity metrics
 */
export const getUsersStats = catchAsync(async (req, res) => {
  const { startDate, endDate } = req.query;
  const stats = await AnalyticsService.getUsersStats({ startDate, endDate });
  res.json(ApiResponse.success("User statistics retrieved successfully", stats));
});

/**
 * Get streaming statistics by period
 * Returns listening activity and trends
 * @param {string} period - Time period (day/week/month/year)
 */
export const getStreamsStats = catchAsync(async (req, res) => {
  const { period = "month" } = req.query;
  const stats = await AnalyticsService.getStreamsStats(period);
  res.json(ApiResponse.success("Streaming statistics retrieved successfully", stats));
});