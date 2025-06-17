import Artist from "../models/Artist.model.js";
import Track from "../models/Track.model.js";
import Album from "../models/Album.model.js";
import { uploadToB2 } from "../utils/upload.js";
import { generateSignedUrl, extractFileName } from "../utils/b2SignedUrl.js";
import TrackService from "./TrackService.js";

class ArtistService {
  async createArtist(artistData, avatarFile) {
    const { name, bio, genres, socialLinks } = artistData;

    // Проверка на существование артиста
    const existingArtist = await Artist.findOne({
      name: new RegExp(`^${name}$`, "i"),
    });

    if (existingArtist) {
      throw new Error("Артист с таким именем уже существует");
    }

    try {
      // Загрузка аватара, если есть
      let avatarUrl = null;
      let avatarFileId = null;
      if (avatarFile) {
        const uploadResult = await uploadToB2(avatarFile, "artistAvatars");
        if (typeof uploadResult === "string") {
          avatarUrl = uploadResult; // старый формат
        } else {
          avatarUrl = uploadResult.url; // новый формат
          avatarFileId = uploadResult.fileId;
        }
      }

      // Парсинг данных если нужно
      let parsedGenres = genres;
      if (typeof genres === "string") {
        try {
          parsedGenres = JSON.parse(genres);
        } catch (e) {
          parsedGenres = genres.split(",").map((g) => g.trim());
        }
      }

      let parsedSocialLinks = socialLinks;
      if (typeof socialLinks === "string") {
        try {
          parsedSocialLinks = JSON.parse(socialLinks);
        } catch (e) {
          parsedSocialLinks = null;
        }
      }

      // Создание артиста
      const newArtist = new Artist({
        name: name.trim(),
        bio: bio?.trim(),
        avatar: avatarUrl,
        avatarFileId: avatarFileId,
        genres: parsedGenres || [],
        socialLinks: parsedSocialLinks,
      });

      await newArtist.save();
      return newArtist;
    } catch (error) {
      throw new Error(`Ошибка при создании артиста: ${error.message}`);
    }
  }

  async getAllArtists({ page = 1, limit = 20, search, genre }) {
    try {
      const skip = (page - 1) * limit;

      // Построение фильтра
      const filter = {};
      if (search) {
        filter.$or = [
          { name: { $regex: search, $options: "i" } },
          { slug: { $regex: search, $options: "i" } },
        ];
      }
      if (genre) {
        filter.genres = genre;
      }

      const artists = await Artist.find(filter)
        .sort({ followerCount: -1, isVerified: -1, createdAt: -1 })
        .skip(skip)
        .limit(limit);

      const total = await Artist.countDocuments(filter);
      const totalPages = Math.ceil(total / limit);

      return {
        artists,
        pagination: {
          currentPage: page,
          totalPages,
          totalArtists: total,
          hasNextPage: page < totalPages,
          hasPrevPage: page > 1,
        },
      };
    } catch (error) {
      throw new Error(`Ошибка при получении артистов: ${error.message}`);
    }
  }

  async getArtistById(id) {
    try {
      const artist = await Artist.findById(id);

      if (!artist) {
        throw new Error("Артист не найден");
      }
      const artistWithSignedUrls = await this.addSignedUrlsToArtists(artist);

      return artistWithSignedUrls;
    } catch (error) {
      throw new Error(`Ошибка при получении артиста: ${error.message}`);
    }
  }

  async getArtistBySlug(slug) {
    try {
      const artist = await Artist.findOne({ slug });

      if (!artist) {
        throw new Error("Артист не найден");
      }
      const artistWithSignedUrls = await this.addSignedUrlsToArtists(artist);
      return artistWithSignedUrls;
    } catch (error) {
      throw new Error(`Ошибка при получении артиста: ${error.message}`);
    }
  }

  async updateArtist(id, updates, avatarFile) {
    try {
      // Если есть новый аватар, загружаем его
      if (avatarFile) {
        const uploadResult = await uploadToB2(avatarFile, "artistAvatars");

        if (typeof uploadResult === "string") {
          updates.avatar = uploadResult;
        } else {
          updates.avatar = uploadResult.url;
          updates.avatarFileId = uploadResult.fileId;
        }
      }

      // Парсинг данных если нужно
      if (updates.genres && typeof updates.genres === "string") {
        try {
          updates.genres = JSON.parse(updates.genres);
        } catch (e) {
          updates.genres = updates.genres.split(",").map((g) => g.trim());
        }
      }

      if (updates.socialLinks && typeof updates.socialLinks === "string") {
        try {
          updates.socialLinks = JSON.parse(updates.socialLinks);
        } catch (e) {
          delete updates.socialLinks;
        }
      }

      const artist = await Artist.findByIdAndUpdate(
        id,
        { ...updates, updatedAt: new Date() },
        { new: true, runValidators: true }
      );

      if (!artist) {
        throw new Error("Артист не найден");
      }

      return artist;
    } catch (error) {
      throw new Error(`Ошибка при обновлении артиста: ${error.message}`);
    }
  }

  async deleteArtist(id) {
    try {
      // Проверка наличия треков у артиста
      const trackCount = await Track.countDocuments({ artist: id });
      if (trackCount > 0) {
        throw new Error(
          `Невозможно удалить артиста. У него есть ${trackCount} треков`
        );
      }

      // Проверка наличия альбомов
      const albumCount = await Album.countDocuments({ artist: id });
      if (albumCount > 0) {
        throw new Error(
          `Невозможно удалить артиста. У него есть ${albumCount} альбомов`
        );
      }

      const artist = await Artist.findByIdAndDelete(id);
      if (!artist) {
        throw new Error("Артист не найден");
      }

      return artist;
    } catch (error) {
      throw new Error(`Ошибка при удалении артиста: ${error.message}`);
    }
  }

  async getArtistTracks(
    artistId,
    { page = 1, limit = 20, sortBy = "createdAt", sortOrder = -1 }
  ) {
    try {
      // Проверка существования артиста
      const artist = await Artist.findById(artistId);
      if (!artist) {
        throw new Error("Артист не найден");
      }

      const skip = (page - 1) * limit;
      const sort = { [sortBy]: sortOrder };

      const tracks = await Track.find({ artist: artistId })
        .populate("album", "name coverUrl")
        .sort(sort)
        .skip(skip)
        .limit(limit);

      const total = await Track.countDocuments({ artist: artistId });
      const totalPages = Math.ceil(total / limit);

      const tracksWithSignedUrls = await TrackService.addSignedUrlsToTracks(tracks);

      return {
        tracks: tracksWithSignedUrls,
        artistName: artist.name,
        pagination: {
          currentPage: page,
          totalPages,
          totalTracks: total,
          hasNextPage: page < totalPages,
          hasPrevPage: page > 1,
        },
      };
    } catch (error) {
      throw new Error(`Ошибка при получении треков артиста: ${error.message}`);
    }
  }

  async getArtistAlbums(artistId, { page = 1, limit = 20 }) {
    try {
      const skip = (page - 1) * limit;

      const albums = await Album.find({ artist: artistId })
        .populate("tracks", "name duration")
        .sort("-releaseDate")
        .skip(skip)
        .limit(limit);

      const total = await Album.countDocuments({ artist: artistId });
      const totalPages = Math.ceil(total / limit);

      return {
        albums,
        pagination: {
          currentPage: page,
          totalPages,
          totalAlbums: total,
          hasNextPage: page < totalPages,
          hasPrevPage: page > 1,
        },
      };
    } catch (error) {
      throw new Error(
        `Ошибка при получении альбомов артиста: ${error.message}`
      );
    }
  }

  async searchArtists(query, { limit = 10 }) {
    if (!query || query.trim().length === 0) {
      throw new Error("Поисковый запрос не может быть пустым");
    }

    try {
      // Создаем регулярное выражение для поиска
      const searchRegex = new RegExp(`^${query}`, "i");

      // Ищем артистов по имени и slug
      const artists = await Artist.find({
        $or: [{ name: searchRegex }, { slug: searchRegex }],
      })
        .select("name slug avatar isVerified followerCount genres")
        .sort({ followerCount: -1, isVerified: -1 })
        .limit(limit);

      const artistsWithSignedUrls = await this.addSignedUrlsToArtists(artists);
      return {
        artists: artistsWithSignedUrls,
        count: artists.length,
        query,
      };
    } catch (error) {
      throw new Error(`Ошибка при поиске артистов: ${error.message}`);
    }
  }

  async getPopularArtists({ limit = 15 }) {
    try {
      const artists = await Artist.find({})
        .select("name slug avatar isVerified followerCount genres")
        .sort({
          followerCount: -1, // Сначала по количеству подписчиков
          isVerified: -1, // Затем по статусу верификации
          createdAt: -1, // И по дате создания
        })
        .limit(limit);

      const artistsWithSignedUrls = await this.addSignedUrlsToArtists(artists);
      return {
        artists: artistsWithSignedUrls,
        count: artists.length,
      };
    } catch (error) {
      throw new Error(
        `Ошибка при получении популярных артистов: ${error.message}`
      );
    }
  }

  async addSignedUrlsToArtists(artists) {
    try {
      // Проверяем, передан ли массив или один объект
      const isArray = Array.isArray(artists);
      const artistsArray = isArray ? artists : [artists];

      const artistsWithSignedUrls = await Promise.all(
        artistsArray.map(async (artist) => {
          const artistObj = artist.toObject ? artist.toObject() : artist;

          if (artistObj.avatar) {
            const fileName = extractFileName(artistObj.avatar);
            if (fileName) {
              const signedUrl = await generateSignedUrl(fileName, 7200); // 2 часа
              if (signedUrl) {
                artistObj.avatar = signedUrl;
              }
            }
          }

          return artistObj;
        })
      );

      // Возвращаем в том же формате, что и получили
      return isArray ? artistsWithSignedUrls : artistsWithSignedUrls[0];
    } catch (error) {
      console.error("Ошибка создания подписанных URL:", error);

      // Обработка ошибок с учетом типа входных данных
      const isArray = Array.isArray(artists);
      const fallbackResult = isArray
        ? artists.map((artist) => ({
            ...(artist.toObject ? artist.toObject() : artist),
            avatar: null,
          }))
        : {
            ...(artists.toObject ? artists.toObject() : artists),
            avatar: null,
          };

      return fallbackResult;
    }
  }
}

export default new ArtistService();
