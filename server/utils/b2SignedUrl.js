import B2 from "backblaze-b2";
import { config } from "../config/config.js";

const b2 = new B2({
  applicationKeyId: config.b2.accountId,
  applicationKey: config.b2.secretKey,
});

let authData = null;
let authExpiry = null;

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

export const generateSignedUrl = async (fileName, durationInSeconds = 3600) => {
  try {
    await ensureAuthorized();
    const response = await b2.getDownloadAuthorization({
      bucketId: config.b2.bucketId,
      fileNamePrefix: fileName,
      validDurationInSeconds: durationInSeconds,
    });
    let baseUrl = authData.data.downloadUrl;

    // Принудительно HTTPS
    baseUrl = baseUrl.replace("http://", "https://");

    const downloadUrl = `${baseUrl}/file/${config.b2.bucketName}/${fileName}?Authorization=${response.data.authorizationToken}`;


    return downloadUrl;
  } catch (error) {
    console.error("Ошибка создания подписанного URL:", error);
    return null;
  }
};

export const generateSignedUrlV2 = async (
  fileName,
  durationInSeconds = 3600
) => {
  try {
    await ensureAuthorized();

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

export const extractFileName = (fullUrl) => {
  if (!fullUrl) return null;

  const parts = fullUrl.split("/file/SoundifyPet/");
  return parts.length > 1 ? parts[1] : null;
};
