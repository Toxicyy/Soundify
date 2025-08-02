import B2 from "backblaze-b2";
import { config } from "../config/config.js";

// Инициализация B2 клиента
const b2 = new B2({
  applicationKeyId: config.b2.accountId,
  applicationKey: config.b2.secretKey,
});

let authData = null;
let authExpiry = null;

// Функция для авторизации (с кешированием)
const ensureAuthorized = async () => {
  if (!authData || (authExpiry && Date.now() > authExpiry)) {
    try {
      authData = await b2.authorize();
      // Кешируем авторизацию на 23 часа (токен живет 24 часа)
      authExpiry = Date.now() + 23 * 60 * 60 * 1000;
    } catch (error) {
      console.error("Ошибка авторизации B2:", error);
      throw error;
    }
  }
  return authData;
};

// Генерация подписанного URL для скачивания
export const generateSignedUrl = async (fileName, durationInSeconds = 3600) => {
  try {
    console.log("🔍 GENERATING SIGNED URL FOR:", fileName);

    await ensureAuthorized();
    console.log("🔍 AUTH DATA:", authData.data.downloadUrl);

    const response = await b2.getDownloadAuthorization({
      bucketId: config.b2.bucketId,
      fileNamePrefix: fileName,
      validDurationInSeconds: durationInSeconds,
    });

    console.log("🔍 B2 RESPONSE:", response.data);

    // Проверяем что получили
    let baseUrl = authData.data.downloadUrl;
    console.log("🔍 BASE URL BEFORE:", baseUrl);

    // Принудительно HTTPS
    baseUrl = baseUrl.replace("http://", "https://");
    console.log("🔍 BASE URL AFTER:", baseUrl);

    const downloadUrl = `${baseUrl}/file/${config.b2.bucketName}/${fileName}?Authorization=${response.data.authorizationToken}`;

    console.log("🔍 FINAL URL:", downloadUrl);
    console.log(
      "🔍 URL STARTS WITH HTTPS?",
      downloadUrl.startsWith("https://")
    );

    return downloadUrl;
  } catch (error) {
    console.error("❌ Ошибка создания подписанного URL:", error);
    return null;
  }
};

// Альтернативный способ через getFileInfo + подписанный URL
export const generateSignedUrlV2 = async (
  fileName,
  durationInSeconds = 3600
) => {
  try {
    await ensureAuthorized();

    // Получаем информацию о файле
    const fileInfo = await b2.getFileInfo({
      fileId: fileName, // Если у вас есть fileId
    });

    // Создаем подписанный URL
    const authToken = await b2.getDownloadAuthorization({
      bucketId: config.b2.bucketId,
      fileNamePrefix: fileName,
      validDurationInSeconds: durationInSeconds,
    });

    const signedUrl = `${authData.data.downloadUrl}/file/${config.b2.bucketName}/${fileName}?Authorization=${authToken.data.authorizationToken}`;

    return signedUrl;
  } catch (error) {
    console.error("Ошибка создания подписанного URL v2:", error);
    return null;
  }
};

// Извлекает имя файла из полного URL
export const extractFileName = (fullUrl) => {
  if (!fullUrl) return null;

  // Из https://f003.backblazeb2.com/file/SoundifyPet/artistAvatars/filename.jpg
  // Получаем artistAvatars/filename.jpg
  const parts = fullUrl.split("/file/SoundifyPet/");
  return parts.length > 1 ? parts[1] : null;
};
