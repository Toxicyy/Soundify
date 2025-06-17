import Track from "../models/Track.model.js";
import { uploadToB2 } from "../utils/upload.js";
import { generateSignedUrl, extractFileName } from "../utils/b2SignedUrl.js";

class TrackService {
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
}

export default new TrackService();
