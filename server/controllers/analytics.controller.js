// controllers/analytics.controller.js
import { catchAsync } from "../utils/helpers.js";
import AnalyticsService from "../services/AnalyticsService.js";
import { ApiResponse } from "../utils/responses.js";

export const getDashboardStats = catchAsync(async (req, res) => {
  const stats = await AnalyticsService.getDashboardStats();
  res.json(ApiResponse.success("Статистика получена", stats));
});

export const getUsersStats = catchAsync(async (req, res) => {
  const { startDate, endDate } = req.query;
  const stats = await AnalyticsService.getUsersStats({ startDate, endDate });
  res.json(ApiResponse.success("Статистика пользователей получена", stats));
});

export const getStreamsStats = catchAsync(async (req, res) => {
  const { period = "month" } = req.query;
  const stats = await AnalyticsService.getStreamsStats(period);
  res.json(ApiResponse.success("Статистика прослушиваний получена", stats));
});
