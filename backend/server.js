import express from "express";
import cors from "cors";
import connectDB from "./config/db.js";
import { config } from "./config/config.js";
import routes from "./routes/index.js";
import { errorHandler } from "./middleware/error.middleware.js";
import chartCronJobs from "./cron/chart-cron-jobs.js";

// Подключение к базе данных
connectDB();

const app = express();

// Middleware
app.use(
  cors({
    origin: config.corsOrigin,
    credentials: true,
  })
);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Маршруты
app.use("/api", routes);

// Обработка 404 - используем функцию без параметра пути
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: "Маршрут не найден",
  });
});

// Глобальная обработка ошибок
app.use(errorHandler);

const PORT = config.port;

/**
 * Initialize chart system cron jobs
 * Only start in production or if explicitly enabled
 */
const initializeChartJobs = () => {
  const shouldStartCron =
    process.env.NODE_ENV === "production" ||
    process.env.ENABLE_CHART_CRON === "true";

  if (shouldStartCron) {
    console.log("Initializing chart cron jobs...");
    chartCronJobs.start();

    // Graceful shutdown handling
    process.on("SIGTERM", () => {
      console.log("SIGTERM received, stopping chart cron jobs...");
      chartCronJobs.stop();
    });

    process.on("SIGINT", () => {
      console.log("SIGINT received, stopping chart cron jobs...");
      chartCronJobs.stop();
      process.exit(0);
    });
  } else {
    console.log(
      "Chart cron jobs disabled (set ENABLE_CHART_CRON=true to enable)"
    );
  }
};

initializeChartJobs();

export { initializeChartJobs, chartCronJobs };

app.listen(PORT, () => {
  console.log(`Сервер запущен на порту ${PORT} в режиме ${config.nodeEnv}`);
});
