import express from "express";
import cors from "cors";
import connectDB from "./config/db.js";
import { config } from "./config/config.js";
import routes from "./routes/index.js";
import { errorHandler } from "./middleware/error.middleware.js";

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

app.listen(PORT, () => {
  console.log(`Сервер запущен на порту ${PORT} в режиме ${config.nodeEnv}`);
});
