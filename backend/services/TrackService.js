import Track from "../models/Track.model.js";
import { uploadToB2 } from "../utils/upload.js";

class TrackService {
  async createTrack(trackData, files, userId) {
    const { name, artist, genre, tags } = trackData;

    if (!files || !files.audio || !files.cover) {
      throw new Error("Аудио файл и обложка обязательны");
    }

    try {
      // Загружаем файлы в B2
      const audioUrl = await uploadToB2(files.audio[0], "audio");
      const coverUrl = await uploadToB2(files.cover[0], "images");

      // Создаем трек
      const track = new Track({
        name: name.trim(),
        artist: artist.trim(),
        audioUrl,
        coverUrl,
        genre: genre?.trim(),
        tags: tags ? tags.split(",").map((tag) => tag.trim()) : [],
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

      return {
        tracks,
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

      return {
        tracks,
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

      return track;
    } catch (error) {
      throw new Error(`Ошибка при получении трека: ${error.message}`);
    }
  }
}

export default new TrackService();
