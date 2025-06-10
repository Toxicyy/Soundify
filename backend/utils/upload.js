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

    const response = await b2.uploadFile({
      bucketId: config.b2.bucketId,
      fileName,
      data: file.buffer,
      contentType: file.mimetype,
    });

    return (
      response.data.fileUrl ||
      `https://f003.backblazeb2.com/file/${config.b2.bucketName}/${fileName}`
    );
  } catch (error) {
    throw new Error(`Ошибка загрузки в B2: ${error.message}`);
  }
};
