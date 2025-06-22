import { config } from "../config/config.js";
import B2 from "backblaze-b2";

const b2 = new B2({
  applicationKeyId: config.b2.accountId,
  applicationKey: config.b2.secretKey,
});

// Кеширование авторизации
let authData = null;
let authExpiry = null;

// Функция для авторизации с кешированием
const ensureAuthorized = async () => {
  if (!authData || (authExpiry && Date.now() > authExpiry)) {
    try {
      console.log("🔐 Авторизация в B2...");
      authData = await b2.authorize();
      // Кешируем авторизацию на 23 часа (токен живет 24 часа)
      authExpiry = Date.now() + 23 * 60 * 60 * 1000;
      console.log("✅ Авторизация в B2 успешна");
    } catch (error) {
      console.error("❌ Ошибка авторизации B2:", error);
      throw error;
    }
  }
  return authData;
};

// Функция задержки для retry
const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

// Основная функция загрузки с retry механизмом
export const uploadToB2 = async (file, folder, maxRetries = 5) => {
  let lastError;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      if (attempt > 1) {
        console.log(
          `📤 Попытка загрузки ${attempt}/${maxRetries}: ${file.originalname}`
        );
      }

      // Авторизуемся перед каждой попыткой (используем кеширование)
      await ensureAuthorized();

      const fileName = `${folder}/${Date.now()}-${file.originalname}`;

      // Получаем URL для загрузки
      const uploadUrl = await b2.getUploadUrl({
        bucketId: config.b2.bucketId,
      });

      if (attempt === 1) {
        console.log(
          `⬆️ Загружаем файл: ${fileName} (${(
            file.buffer.length /
            1024 /
            1024
          ).toFixed(2)} MB)`
        );
      }

      // Загружаем файл
      const response = await b2.uploadFile({
        uploadUrl: uploadUrl.data.uploadUrl,
        uploadAuthToken: uploadUrl.data.authorizationToken,
        fileName,
        data: file.buffer,
      });

      if (attempt === 1) {
        console.log(`✅ Файл успешно загружен: ${fileName}`);
      } else {
        console.log(`✅ Файл загружен с попытки ${attempt}: ${fileName}`);
      }

      // Возвращаем объект с URL и fileId
      return {
        url:
          response.data.fileUrl ||
          `https://f003.backblazeb2.com/file/${config.b2.bucketName}/${fileName}`,
        fileId: response.data.fileId,
        fileName: fileName,
      };
    } catch (error) {
      lastError = error;

      if (attempt === 1) {
        console.error(
          `❌ Ошибка загрузки ${file.originalname}:`,
          error.message
        );
      } else {
        console.error(`❌ Попытка ${attempt} неудачна:`, error.message);
      }

      // Анализируем тип ошибки
      if (error.response) {
        const status = error.response.status;

        switch (status) {
          case 503:
            console.warn("⚠️ Сервис временно недоступен (503)");
            break;
          case 429:
            console.warn("⚠️ Превышен лимит запросов (429)");
            break;
          case 401:
            console.warn("⚠️ Ошибка авторизации (401), сбрасываем токен");
            authData = null;
            authExpiry = null;
            break;
          case 400:
            console.error("❌ Неверный запрос (400), не повторяем");
            throw new Error(`Ошибка загрузки в B2: ${error.message}`);
          default:
            console.error(`❌ HTTP ошибка: ${status}`);
        }
      }

      // Если это последняя попытка, выбрасываем ошибку
      if (attempt === maxRetries) {
        throw new Error(`Ошибка загрузки в B2: ${lastError.message}`);
      }

      // Увеличенная экспоненциальная задержка для 503 ошибок
      let delayMs;
      if (error.response && error.response.status === 503) {
        // Для 503 ошибок - более длительная задержка
        delayMs = Math.min(Math.pow(3, attempt) * 1000, 30000); // до 30 секунд
      } else {
        delayMs = Math.pow(2, attempt) * 1000;
      }
      await delay(delayMs);
    }
  }
};

// Функция для пакетной загрузки с ограничением параллельных загрузок
export const uploadMultipleToB2 = async (files, folder, concurrency = 3) => {

  const results = [];

  // Разбиваем файлы на батчи
  for (let i = 0; i < files.length; i += concurrency) {
    const batch = files.slice(i, i + concurrency);
    const batchNumber = Math.floor(i / concurrency) + 1;

    try {
      const batchResults = await Promise.all(
        batch.map((file) => uploadToB2(file, folder))
      );
      results.push(...batchResults);
    } catch (error) {
      console.error(`❌ Ошибка в батче ${batchNumber}:`, error.message);
      throw error;
    }

    // Небольшая пауза между батчами для снижения нагрузки на B2
    if (i + concurrency < files.length) {
      await delay(500);
    }
  }

  return results;
};

// Функция для проверки статуса B2
export const checkB2Status = async () => {
  try {
    await ensureAuthorized();

    // Пробуем получить информацию о bucket
    const buckets = await b2.listBuckets();
    const targetBucket = buckets.data.buckets.find(
      (bucket) => bucket.bucketId === config.b2.bucketId
    );

    if (!targetBucket) {
      throw new Error("Bucket не найден");
    }
    return true;
  } catch (error) {
    console.error("❌ Проблема с доступом к B2:", error.message);
    return false;
  }
};

// Для обратной совместимости (если где-то используется старый формат)
export const uploadToB2Legacy = async (file, folder) => {
  const result = await uploadToB2(file, folder);
  return result.url; // возвращаем только URL как раньше
};
