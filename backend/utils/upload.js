import { config } from "../config/config.js";
import B2 from "backblaze-b2";

const b2 = new B2({
  applicationKeyId: config.b2.accountId,
  applicationKey: config.b2.secretKey,
});

export const uploadToB2 = async (file, folder) => {
  try {
    await b2.authorize();

    const fileName = `${folder}/${Date.now()}-${file.originalname}`;

    const uploadUrl = await b2.getUploadUrl({
      bucketId: config.b2.bucketId,
    });

    const response = await b2.uploadFile({
      uploadUrl: uploadUrl.data.uploadUrl,
      uploadAuthToken: uploadUrl.data.authorizationToken,
      fileName,
      data: file.buffer,
    });

    // Возвращаем объект с URL и fileId
    return {
      url:
        response.data.fileUrl ||
        `https://f003.backblazeb2.com/file/${config.b2.bucketName}/${fileName}`,
      fileId: response.data.fileId,
      fileName: fileName,
    };
  } catch (error) {
    throw new Error(`Ошибка загрузки в B2: ${error.message}`);
  }
};

// Для обратной совместимости (если где-то используется старый формат)
export const uploadToB2Legacy = async (file, folder) => {
  const result = await uploadToB2(file, folder);
  return result.url; // возвращаем только URL как раньше
};
