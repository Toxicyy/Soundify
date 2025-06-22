import Track from "../models/Track.model.js";
import { uploadToB2 } from "../utils/upload.js";
import { generateSignedUrl, extractFileName } from "../utils/b2SignedUrl.js";
import {
  processAudioToHLS,
  checkFFmpegAvailability,
} from "../utils/audioProcessor.js";
import { config } from "../config/config.js";
import B2 from "backblaze-b2";
import fs from "fs/promises";

class TrackService {
  // Простая проверка B2 доступности
  async checkB2Access() {
    try {
      const b2 = new B2({
        applicationKeyId: config.b2.accountId,
        applicationKey: config.b2.secretKey,
      });

      await b2.authorize();
      console.log("✅ B2 авторизация успешна");

      // Проверяем доступ к bucket с обработкой ошибок
      try {
        const buckets = await b2.listBuckets();
        const targetBucket = buckets.data.buckets.find(
          (bucket) => bucket.bucketId === config.b2.bucketId
        );

        if (!targetBucket) {
          console.warn("⚠️ Bucket не найден среди доступных");
          return false;
        }

        console.log("✅ B2 bucket доступен:", targetBucket.bucketName);
        return true;
      } catch (bucketError) {
        console.warn("⚠️ Ошибка доступа к bucket:", bucketError.message);
        if (bucketError.response && bucketError.response.status === 401) {
          console.warn(
            "⚠️ Недостаточно прав для доступа к bucket. Проверьте права Application Key"
          );
        }
        // Возвращаем true, так как авторизация прошла, а bucket может быть недоступен из-за прав
        return true;
      }
    } catch (error) {
      console.error("❌ Проблема с B2:", error.message);
      return false;
    }
  }

  // Проверка системных требований при запуске сервиса
  async checkSystemRequirements() {
    console.log("🔍 Проверка системных требований TrackService...");

    let ffmpegReady = false;
    let b2Ready = false;

    try {
      // Проверяем FFmpeg с подробной диагностикой
      console.log("🎬 Детальная проверка FFmpeg в TrackService...");

      // Импортируем и проверяем ffmpeg прямо здесь
      const ffmpegPath = await import("@ffmpeg-installer/ffmpeg");
      console.log("📁 FFmpeg путь в TrackService:", ffmpegPath.default.path);

      // Проверяем функцию из audioProcessor
      const result = await checkFFmpegAvailability();
      console.log("✅ checkFFmpegAvailability вернула:", result);
      ffmpegReady = true;
    } catch (error) {
      console.error("❌ Ошибка FFmpeg в checkSystemRequirements:", error);
      ffmpegReady = false;
    }

    try {
      // Проверяем B2 (не критично для создания треков)
      const b2Result = await this.checkB2Access();
      b2Ready = b2Result;
    } catch (error) {
      console.warn("⚠️ B2 проверка не удалась:", error.message);
      b2Ready = false;
    }

    console.log(`📊 Статус системы: FFmpeg=${ffmpegReady}, B2=${b2Ready}`);

    // Возвращаем true если FFmpeg готов (B2 не критично для начальной проверки)
    return ffmpegReady;
  }

  async createTrack(trackData, files, userId) {
    const { name, artist, genre, tags, duration } = trackData;

    if (!files || !files.audio || !files.cover) {
      throw new Error("Аудио файл и обложка обязательны");
    }

    try {
      // Загружаем файлы в B2
      const audioUpload = await uploadToB2(files.audio[0], "audio");
      const coverUpload = await uploadToB2(files.cover[0], "images");

      const audioUrl = audioUpload.url;
      const coverUrl = coverUpload.url;

      // Создаем трек
      const track = new Track({
        name: name.trim(),
        artist: artist.trim(),
        audioUrl,
        coverUrl,
        genre: genre?.trim(),
        tags: tags ? tags.split(",").map((tag) => tag.trim()) : [],
        duration: parseInt(duration) || 0,
        isPublic: true,
        uploadedBy: userId,
      });

      await track.save();
      return track;
    } catch (error) {
      throw new Error(`Ошибка при создании трека: ${error.message}`);
    }
  }

  async createTrackWithHLS(trackData, files, userId) {
    const { name, artist, genre, tags } = trackData;

    if (!files || !files.audio || !files.cover) {
      throw new Error("Аудио файл и обложка обязательны");
    }

    console.log(`🎵 Начинаем создание HLS трека: ${name}`);
    console.log(
      `📁 Размер аудио файла: ${(
        files.audio[0].buffer.length /
        1024 /
        1024
      ).toFixed(2)} MB`
    );

    // Проверяем доступность ffmpeg с подробной диагностикой
    try {
      console.log("🔍 Проверяем FFmpeg перед созданием трека...");
      const ffmpegCheck = await this.checkSystemRequirements();
      if (!ffmpegCheck) {
        throw new Error(
          "FFmpeg недоступен. Проверьте установку @ffmpeg-installer/ffmpeg"
        );
      }
      console.log("✅ FFmpeg проверен и готов к работе");
    } catch (systemError) {
      console.error("❌ Ошибка проверки FFmpeg:", systemError);
      throw new Error(`FFmpeg недоступен: ${systemError.message}`);
    }

    let tempDir = null;

    try {
      console.log(`🎵 Начинаем обработку трека: ${name}`);

      // Обрабатываем аудио в HLS
      const hlsData = await processAudioToHLS(
        files.audio[0].buffer,
        files.audio[0].originalname
      );

      tempDir = hlsData.tempDir; // Сохраняем ссылку на временную директорию

      console.log(
        `📁 HLS обработка завершена, сегментов: ${hlsData.segments.length}`
      );

      // Загружаем обложку как обычно
      const coverUpload = await uploadToB2(files.cover[0], "images");

      // Загружаем HLS файлы в B2 с контролируемой параллельностью
      const folderName = `hls/${Date.now()}-${name.replace(
        /[^a-zA-Z0-9]/g,
        "-"
      )}`;

      console.log(`☁️ Загружаем HLS файлы в B2: ${folderName}`);

      // Сначала загружаем плейлист
      const playlistUpload = await uploadToB2(
        {
          buffer: Buffer.from(hlsData.playlist),
          originalname: "playlist.m3u8",
          mimetype: "application/vnd.apple.mpegurl",
        },
        folderName
      );

      console.log(`✅ Плейлист загружен: ${playlistUpload.fileName}`);

      // Загружаем сегменты пакетами (по 2 одновременно) для избежания 503 ошибок
      const segmentFiles = hlsData.segments.map((segment) => ({
        buffer: segment.buffer,
        originalname: segment.name,
        mimetype: "video/mp2t",
      }));

      const segmentUploads = [];
      const batchSize = 3; // Уменьшаем до 2 сегментов одновременно

      for (let i = 0; i < segmentFiles.length; i += batchSize) {
        const batch = segmentFiles.slice(i, i + batchSize);
        const batchNumber = Math.floor(i / batchSize) + 1;
        const totalBatches = Math.ceil(segmentFiles.length / batchSize);

        console.log(
          `📦 Загружаем батч ${batchNumber}/${totalBatches} (${batch.length} сегментов)`
        );

        try {
          const batchResults = await Promise.all(
            batch.map((segment) => uploadToB2(segment, folderName, 5)) // 5 попыток для каждого файла
          );
          segmentUploads.push(...batchResults);

          console.log(`✅ Батч ${batchNumber} загружен успешно`);

          // Увеличенная пауза между батчами для снижения нагрузки на B2
          if (i + batchSize < segmentFiles.length) {
            const pauseDuration = 1000; // 2 секунды между батчами
            console.log(
              `⏳ Пауза между батчами: ${pauseDuration / 1000} секунд`
            );
            await new Promise((resolve) => setTimeout(resolve, pauseDuration));
          }
        } catch (error) {
          console.error(`❌ Ошибка в батче ${batchNumber}:`, error.message);

          // Если батч не удался, попробуем загрузить файлы по одному
          console.log(
            `🔄 Пробуем загрузить файлы из батча ${batchNumber} по одному...`
          );
          try {
            for (const segment of batch) {
              console.log(
                `📤 Индивидуальная загрузка: ${segment.originalname}`
              );
              const result = await uploadToB2(segment, folderName, 5);
              segmentUploads.push(result);

              // Пауза между индивидуальными загрузками
              await new Promise((resolve) => setTimeout(resolve, 1000));
            }
            console.log(`✅ Батч ${batchNumber} загружен по одному файлу`);
          } catch (individualError) {
            console.error(
              `❌ Критическая ошибка загрузки в батче ${batchNumber}:`,
              individualError.message
            );
            throw individualError;
          }
        }
      }

      console.log(`✅ Все ${segmentUploads.length} сегментов загружены в B2`);

      // Очищаем временные файлы
      if (tempDir) {
        await fs.rm(tempDir, { recursive: true, force: true });
        console.log(`🗑️ Временные файлы очищены`);
      }

      // Вычисляем длительность из плейлиста
      const duration = calculateDurationFromPlaylist(hlsData.playlist);

      // Создаем трек
      const track = new Track({
        name: name.trim(),
        artist: artist.trim(),
        audioUrl: playlistUpload.url, // Ссылка на m3u8
        hlsSegments: segmentUploads.map((upload) => upload.url), // Массив сегментов
        coverUrl: coverUpload.url,
        genre: genre?.trim(),
        tags: tags ? tags.split(",").map((tag) => tag.trim()) : [],
        duration: Math.round(duration),
        isPublic: true,
        isHLS: true, // Флаг HLS трека
        uploadedBy: userId,
      });

      await track.save();
      console.log(`💾 Трек сохранен в базе данных: ${track._id}`);

      return track;
    } catch (error) {
      // Очищаем временные файлы при ошибке
      if (tempDir) {
        try {
          await fs.rm(tempDir, { recursive: true, force: true });
          console.log(`🗑️ Временные файлы очищены после ошибки`);
        } catch (cleanupError) {
          console.error("Ошибка очистки временных файлов:", cleanupError);
        }
      }

      console.error(`❌ Ошибка создания HLS трека:`, error);
      throw new Error(`Ошибка при создании HLS трека: ${error.message}`);
    }
  }

  async getAllTracks({
    page = 1,
    limit = 20,
    sortBy = "createdAt",
    sortOrder = -1,
  }) {
    try {
      const skip = (page - 1) * limit;
      const sort = { [sortBy]: sortOrder };

      const tracks = await Track.find({ isPublic: true })
        .sort(sort)
        .skip(skip)
        .limit(limit)
        .populate("uploadedBy", "name username avatar");

      const total = await Track.countDocuments({ isPublic: true });
      const totalPages = Math.ceil(total / limit);

      const tracksWithSignedUrls = await this.addSignedUrlsToTracks(tracks);

      return {
        tracks: tracksWithSignedUrls,
        pagination: {
          currentPage: page,
          totalPages,
          totalTracks: total,
          hasNextPage: page < totalPages,
          hasPrevPage: page > 1,
        },
      };
    } catch (error) {
      throw new Error(`Ошибка при получении треков: ${error.message}`);
    }
  }

  async searchTracks(query, { page = 1, limit = 20 }) {
    try {
      const skip = (page - 1) * limit;

      const searchCondition = {
        $and: [
          { isPublic: true },
          {
            $or: [
              { name: { $regex: query, $options: "i" } },
              { artist: { $regex: query, $options: "i" } },
              { genre: { $regex: query, $options: "i" } },
              { tags: { $in: [new RegExp(query, "i")] } },
            ],
          },
        ],
      };

      const tracks = await Track.find(searchCondition)
        .sort({ listenCount: -1, createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate("uploadedBy", "name username avatar");

      const total = await Track.countDocuments(searchCondition);
      const totalPages = Math.ceil(total / limit);
      const tracksWithSignedUrls = await this.addSignedUrlsToTracks(tracks);
      return {
        tracks: tracksWithSignedUrls,
        query,
        pagination: {
          currentPage: page,
          totalPages,
          totalTracks: total,
          hasNextPage: page < totalPages,
          hasPrevPage: page > 1,
        },
      };
    } catch (error) {
      throw new Error(`Ошибка при поиске треков: ${error.message}`);
    }
  }

  async incrementListenCount(trackId) {
    try {
      const track = await Track.findByIdAndUpdate(
        trackId,
        { $inc: { listenCount: 1 } },
        { new: true }
      ).populate("uploadedBy", "name username avatar");

      return track;
    } catch (error) {
      throw new Error(`Ошибка при обновлении счетчика: ${error.message}`);
    }
  }

  async getTrackById(trackId) {
    try {
      const track = await Track.findById(trackId).populate(
        "uploadedBy",
        "name username avatar"
      );

      if (!track) {
        throw new Error("Трек не найден");
      }
      const trackWithSignedUrls = await this.addSignedUrlsToTracks(track);
      return trackWithSignedUrls;
    } catch (error) {
      throw new Error(`Ошибка при получении трека: ${error.message}`);
    }
  }

  async addSignedUrlsToTracks(tracks) {
    try {
      // Проверяем, передан ли массив или один объект
      const isArray = Array.isArray(tracks);
      const tracksArray = isArray ? tracks : [tracks];

      const tracksWithSignedUrls = await Promise.all(
        tracksArray.map(async (track) => {
          const trackObj = track.toObject ? track.toObject() : track;

          // Обрабатываем coverUrl (обложку трека)
          if (trackObj.coverUrl) {
            const coverFileName = extractFileName(trackObj.coverUrl);
            if (coverFileName) {
              const signedCoverUrl = await generateSignedUrl(
                coverFileName,
                7200
              ); // 2 часа
              if (signedCoverUrl) {
                trackObj.coverUrl = signedCoverUrl;
              }
            }
          }

          // Обрабатываем audioUrl (аудио файл)
          if (trackObj.audioUrl) {
            const audioFileName = extractFileName(trackObj.audioUrl);
            if (audioFileName) {
              const signedAudioUrl = await generateSignedUrl(
                audioFileName,
                7200
              ); // 2 часа
              if (signedAudioUrl) {
                trackObj.audioUrl = signedAudioUrl;
              }
            }
          }

          // Если трек содержит данные артиста, обрабатываем и его аватар
          if (trackObj.artist && trackObj.artist.avatar) {
            const artistAvatarFileName = extractFileName(
              trackObj.artist.avatar
            );
            if (artistAvatarFileName) {
              const signedAvatarUrl = await generateSignedUrl(
                artistAvatarFileName,
                7200
              );
              if (signedAvatarUrl) {
                trackObj.artist.avatar = signedAvatarUrl;
              }
            }
          }

          return trackObj;
        })
      );

      // Возвращаем в том же формате, что и получили
      return isArray ? tracksWithSignedUrls : tracksWithSignedUrls[0];
    } catch (error) {
      console.error("Ошибка создания подписанных URL для треков:", error);

      // Обработка ошибок с учетом типа входных данных
      const isArray = Array.isArray(tracks);
      const fallbackResult = isArray
        ? tracks.map((track) => ({
            ...(track.toObject ? track.toObject() : track),
            coverUrl: null,
            audioUrl: track.audioUrl, // Оставляем оригинальный audioUrl при ошибке
          }))
        : {
            ...(tracks.toObject ? tracks.toObject() : tracks),
            coverUrl: null,
            audioUrl: tracks.audioUrl, // Оставляем оригинальный audioUrl при ошибке
          };

      return fallbackResult;
    }
  }

  async convertExistingTrackToHLS(trackId) {
    // Проверяем доступность ffmpeg
    const ffmpegAvailable = await this.checkSystemRequirements();
    if (!ffmpegAvailable) {
      throw new Error(
        "FFmpeg не найден. Проверьте установку @ffmpeg-installer/ffmpeg"
      );
    }

    let tempDir = null;

    try {
      const track = await Track.findById(trackId);

      if (!track || track.isHLS) {
        throw new Error("Трек не найден или уже в HLS формате");
      }

      console.log(`🔄 Конвертируем трек в HLS: ${track.name}`);

      // Скачиваем оригинальный аудио файл
      const audioUrl = await generateSignedUrl(
        extractFileName(track.audioUrl),
        3600
      );
      const response = await fetch(audioUrl);
      const audioBuffer = Buffer.from(await response.arrayBuffer());

      // Конвертируем в HLS
      const hlsData = await processAudioToHLS(audioBuffer, track.name);
      tempDir = hlsData.tempDir;

      // Загружаем HLS файлы
      const folderName = `hls/${Date.now()}-${track.name.replace(
        /[^a-zA-Z0-9]/g,
        "-"
      )}-converted`;

      const playlistUpload = await uploadToB2(
        {
          buffer: Buffer.from(hlsData.playlist),
          originalname: "playlist.m3u8",
          mimetype: "application/vnd.apple.mpegurl",
        },
        folderName
      );

      const segmentUploads = await Promise.all(
        hlsData.segments.map((segment) =>
          uploadToB2(
            {
              buffer: segment.buffer,
              originalname: segment.name,
              mimetype: "video/mp2t",
            },
            folderName
          )
        )
      );

      // Очищаем временные файлы
      if (tempDir) {
        await fs.rm(tempDir, { recursive: true, force: true });
      }

      // Обновляем трек
      track.audioUrl = playlistUpload.url;
      track.hlsSegments = segmentUploads.map((upload) => upload.url);
      track.isHLS = true;
      track.audioQuality = "128k";

      await track.save();

      console.log(`✅ Трек конвертирован в HLS: ${track._id}`);

      return await this.addSignedUrlsToTracks(track);
    } catch (error) {
      // Очищаем временные файлы при ошибке
      if (tempDir) {
        try {
          await fs.rm(tempDir, { recursive: true, force: true });
        } catch (cleanupError) {
          console.error("Ошибка очистки временных файлов:", cleanupError);
        }
      }

      throw new Error(`Ошибка при конвертации в HLS: ${error.message}`);
    }
  }

  async deleteTrack(trackId, userId) {
    try {
      const track = await Track.findById(trackId);

      if (!track) {
        return null;
      }

      // Проверяем права на удаление
      if (track.uploadedBy.toString() !== userId) {
        return null;
      }

      await Track.findByIdAndDelete(trackId);
      return true;
    } catch (error) {
      throw new Error(`Ошибка при удалении трека: ${error.message}`);
    }
  }

  async updateTrack(trackId, updateData, userId) {
    try {
      const track = await Track.findById(trackId);

      if (!track) {
        return null;
      }

      // Проверяем права на обновление
      if (track.uploadedBy.toString() !== userId) {
        return null;
      }

      const updatedTrack = await Track.findByIdAndUpdate(
        trackId,
        { ...updateData, updatedAt: new Date() },
        { new: true }
      ).populate("uploadedBy", "name username avatar");

      return await this.addSignedUrlsToTracks(updatedTrack);
    } catch (error) {
      throw new Error(`Ошибка при обновлении трека: ${error.message}`);
    }
  }
}

// Функция для расчета длительности из m3u8
const calculateDurationFromPlaylist = (playlist) => {
  const lines = playlist.split("\n");
  let totalDuration = 0;

  lines.forEach((line) => {
    if (line.startsWith("#EXTINF:")) {
      const duration = parseFloat(line.split(":")[1].split(",")[0]);
      totalDuration += duration;
    }
  });

  return totalDuration;
};

export default new TrackService();
