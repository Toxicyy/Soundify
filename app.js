import express from "express";
import cors from "cors";
import connectDB from "./server/config/db.js";
import { config } from "./server/config/config.js";
import routes from "./server/routes/index.js";
import { errorHandler } from "./server/middleware/error.middleware.js";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

// Подключение к БД
connectDB();

// Middleware
app.use(
  cors({
    origin: true,
    credentials: true,
  })
);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// API роуты должны быть ПЕРВЫМИ
app.use("/api", routes);

// Статические файлы
const staticPath = path.join(__dirname, "client/dist");
app.use(express.static(staticPath));

app.use((req, res, next) => {
  if (req.method !== 'GET') return next();
  if (req.path.startsWith('/api')) return next();
  
  if (path.extname(req.path)) return next();

  if (req.accepts('html')) {
    res.sendFile(path.join(staticPath, 'index.html'));
  } else {
    next();
  }
});

app.get('/api/health', (req, res) => {
  res.status(200).json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

// Обработчик ошибок
app.use(errorHandler);

const PORT = config.port;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
