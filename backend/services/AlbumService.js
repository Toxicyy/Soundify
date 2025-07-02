import Album from "../models/Album.model.js";
import Track from "../models/Track.model.js";
import TrackService from "./TrackService.js";
import { uploadToB2 } from "../utils/upload.js";
import { generateSignedUrl, extractFileName } from "../utils/b2SignedUrl.js";
import { config } from "../config/config.js";
import B2 from "backblaze-b2";

/**
 * Service for managing albums and their associated data
 */
class AlbumService {
  /**
   * Create new album with optional cover image
   * @param {Object} albumData - Album data (name, artist, description, etc.)
   * @param {Object} coverFile - Cover image file from multer
   * @returns {Object} Created album document
   */
  async createAlbum(albumData, coverFile) {
    const { name, artist, description, releaseDate, tracks, genres, type } =
      albumData;

    if (!name || !artist) {
      throw new Error("Album name and artist are required");
    }

    try {
      let coverUrl = null;
      let coverFileId = null;

      // Upload cover image if provided
      if (coverFile) {
        const uploadResult = await uploadToB2(coverFile, "albumCovers");
        if (typeof uploadResult === "string") {
          coverUrl = uploadResult;
          coverFileId = this.extractFileIdFromUrl(uploadResult);
        } else {
          coverUrl = uploadResult.url || uploadResult.coverUrl;
          coverFileId =
            uploadResult.fileId || this.extractFileIdFromUrl(coverUrl);
        }
      }

      // Parse genres from string or array
      let parsedGenres = genres;
      if (typeof genres === "string") {
        try {
          parsedGenres = JSON.parse(genres);
        } catch (e) {
          parsedGenres = genres.split(",").map((g) => g.trim());
        }
      }

      const newAlbum = new Album({
        name: name.trim(),
        artist: artist.trim(),
        description: description?.trim(),
        coverUrl,
        coverFileId,
        releaseDate: releaseDate ? new Date(releaseDate) : null,
        tracks: Array.isArray(tracks) ? tracks : [],
        genre: parsedGenres,
        type: type || "album",
      });

      await newAlbum.save();
      return await this.addSignedUrlsToAlbums(newAlbum);
    } catch (error) {
      throw new Error(`Album creation failed: ${error.message}`);
    }
  }

  /**
   * Get album by ID with populated data
   * @param {string} id - Album ID
   * @returns {Object} Album with signed URLs
   */
  async getAlbumById(id) {
    if (!id) {
      throw new Error("Album ID is required");
    }

    try {
      const album = await Album.findById(id)
        .populate("artist", "name avatar")
        .populate("tracks", "name duration coverUrl");

      if (!album) {
        throw new Error("Album not found");
      }

      return await this.addSignedUrlsToAlbums(album);
    } catch (error) {
      throw new Error(`Failed to retrieve album: ${error.message}`);
    }
  }

  /**
   * Update album with optional new cover image
   * Handles file cleanup for replaced covers
   */
  async updateAlbum(id, updates, coverFile) {
    if (!id) {
      throw new Error("Album ID is required");
    }

    try {
      const existingAlbum = await Album.findById(id);
      if (!existingAlbum) {
        throw new Error("Album not found");
      }

      // Handle new cover upload
      if (coverFile) {
        // Delete old cover file if exists
        if (existingAlbum.coverFileId) {
          try {
            await this.deleteFileFromB2(existingAlbum.coverFileId);
          } catch (error) {
            console.warn(`Failed to delete old cover file: ${error.message}`);
          }
        }

        // Upload new cover
        const uploadResult = await uploadToB2(coverFile, "albumCovers");
        if (typeof uploadResult === "string") {
          updates.coverUrl = uploadResult;
          updates.coverFileId = this.extractFileIdFromUrl(uploadResult);
        } else {
          updates.coverUrl = uploadResult.url || uploadResult.coverUrl;
          updates.coverFileId =
            uploadResult.fileId || this.extractFileIdFromUrl(updates.coverUrl);
        }
      }

      // Parse genres if provided
      if (updates.genres && typeof updates.genres === "string") {
        try {
          updates.genres = JSON.parse(updates.genres);
        } catch (e) {
          updates.genres = updates.genres.split(",").map((g) => g.trim());
        }
      }

      const updatedAlbum = await Album.findByIdAndUpdate(
        id,
        { ...updates, updatedAt: new Date() },
        { new: true, runValidators: true }
      ).populate("artist", "name avatar");

      return await this.addSignedUrlsToAlbums(updatedAlbum);
    } catch (error) {
      throw new Error(`Album update failed: ${error.message}`);
    }
  }

  /**
   * Delete album and its cover file
   * Prevents deletion if album has tracks
   */
  async deleteAlbum(id) {
    if (!id) {
      throw new Error("Album ID is required");
    }

    try {
      const album = await Album.findById(id);
      if (!album) {
        throw new Error("Album not found");
      }

      // Check for associated tracks
      const trackCount = await Track.countDocuments({ album: id });
      if (trackCount > 0) {
        throw new Error(
          `Cannot delete album with ${trackCount} associated tracks`
        );
      }

      // Delete cover file from B2 if exists
      if (album.coverFileId) {
        try {
          await this.deleteFileFromB2(album.coverFileId);
        } catch (error) {
          console.warn(`Failed to delete cover file: ${error.message}`);
        }
      }

      await Album.findByIdAndDelete(id);
      return true;
    } catch (error) {
      throw new Error(`Album deletion failed: ${error.message}`);
    }
  }

  /**
   * Get paginated list of albums with search and filtering
   */
  async getAllAlbums({ page = 1, limit = 20, search, genre, type, artist }) {
    try {
      const skip = (page - 1) * limit;
      const filter = {};

      // Build search filter
      if (search) {
        filter.$or = [
          { name: { $regex: search, $options: "i" } },
          { description: { $regex: search, $options: "i" } },
        ];
      }

      if (genre) filter.genre = genre;
      if (type) filter.type = type;
      if (artist) filter.artist = artist;

      const [albums, total] = await Promise.all([
        Album.find(filter)
          .populate("artist", "name avatar")
          .sort({ createdAt: -1 })
          .skip(skip)
          .limit(limit),
        Album.countDocuments(filter),
      ]);

      const totalPages = Math.ceil(total / limit);
      const albumsWithSignedUrls = await this.addSignedUrlsToAlbumsSimple(
        albums
      );

      return {
        albums: albumsWithSignedUrls,
        pagination: {
          currentPage: page,
          totalPages,
          totalAlbums: total,
          hasNextPage: page < totalPages,
          hasPrevPage: page > 1,
        },
      };
    } catch (error) {
      throw new Error(`Failed to retrieve albums: ${error.message}`);
    }
  }

  /**
   * Get tracks from specific album with pagination
   */
  async getAlbumTracks(
    albumId,
    { page = 1, limit = 20, sortBy = "createdAt", sortOrder = -1 }
  ) {
    if (!albumId) {
      throw new Error("Album ID is required");
    }

    try {
      const album = await Album.findById(albumId);
      if (!album) {
        throw new Error("Album not found");
      }

      const skip = (page - 1) * limit;
      const sort = { [sortBy]: sortOrder };

      const [tracks, total] = await Promise.all([
        Track.find({ album: albumId })
          .populate("artist", "name avatar")
          .sort(sort)
          .skip(skip)
          .limit(limit),
        Track.countDocuments({ album: albumId }),
      ]);

      const totalPages = Math.ceil(total / limit);
      const tracksWithSignedUrls = await TrackService.addSignedUrlsToTracks(
        tracks
      );

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
      throw new Error(`Failed to retrieve album tracks: ${error.message}`);
    }
  }

  /**
   * Search albums by name with prefix matching
   */
  async searchAlbum(query, { limit = 10 }) {
    if (!query || query.trim().length === 0) {
      throw new Error("Search query cannot be empty");
    }

    try {
      const searchRegex = new RegExp(`^${query.trim()}`, "i");

      const albums = await Album.find({ name: searchRegex })
        .populate("artist", "name")
        .select("name coverUrl artist genre type releaseDate")
        .sort({ createdAt: -1 })
        .limit(limit);

      const albumsWithSignedUrls = await this.addSignedUrlsToAlbumsSimple(
        albums
      );

      return {
        albums: albumsWithSignedUrls,
        count: albums.length,
        query: query.trim(),
      };
    } catch (error) {
      throw new Error(`Album search failed: ${error.message}`);
    }
  }

  /**
   * Get albums by genre
   */
  async getAlbumsByGenre(genre) {
    if (!genre) {
      throw new Error("Genre is required");
    }

    try {
      const albums = await Album.find({ genre })
        .populate("artist", "name avatar")
        .sort({ createdAt: -1 });

      return await this.addSignedUrlsToAlbumsSimple(albums);
    } catch (error) {
      throw new Error(`Failed to retrieve albums by genre: ${error.message}`);
    }
  }

  /**
   * Get albums by type (album/ep/single)
   */
  async getAlbumsByType(type) {
    if (!type) {
      throw new Error("Type is required");
    }

    try {
      const albums = await Album.find({ type })
        .populate("artist", "name avatar")
        .sort({ createdAt: -1 });

      return await this.addSignedUrlsToAlbumsSimple(albums);
    } catch (error) {
      throw new Error(`Failed to retrieve albums by type: ${error.message}`);
    }
  }

  /**
   * Add track to album
   * Also updates track's album reference
   */
  async addTrackToAlbum(albumId, trackId) {
    if (!albumId || !trackId) {
      throw new Error("Album ID and Track ID are required");
    }

    try {
      const [album, track] = await Promise.all([
        Album.findById(albumId),
        Track.findById(trackId),
      ]);

      if (!album) throw new Error("Album not found");
      if (!track) throw new Error("Track not found");

      // Check if track is already in album
      if (album.tracks.includes(trackId)) {
        throw new Error("Track is already in this album");
      }

      // Add track to album and update track's album reference
      await Promise.all([
        Album.findByIdAndUpdate(albumId, { $push: { tracks: trackId } }),
        Track.findByIdAndUpdate(trackId, { album: albumId }),
      ]);

      return await this.getAlbumById(albumId);
    } catch (error) {
      throw new Error(`Failed to add track to album: ${error.message}`);
    }
  }

  /**
   * Remove track from album
   * Also clears track's album reference
   */
  async removeTrackFromAlbum(albumId, trackId) {
    if (!albumId || !trackId) {
      throw new Error("Album ID and Track ID are required");
    }

    try {
      const album = await Album.findById(albumId);
      if (!album) {
        throw new Error("Album not found");
      }

      // Remove track from album and clear track's album reference
      await Promise.all([
        Album.findByIdAndUpdate(albumId, { $pull: { tracks: trackId } }),
        Track.findByIdAndUpdate(trackId, { $unset: { album: "" } }),
      ]);

      return await this.getAlbumById(albumId);
    } catch (error) {
      throw new Error(`Failed to remove track from album: ${error.message}`);
    }
  }

  /**
   * Update track order in album
   * @param {string} albumId - Album ID
   * @param {Array} trackIds - Ordered array of track IDs
   */
  async updateTrackOrder(albumId, trackIds) {
    if (!albumId || !Array.isArray(trackIds)) {
      throw new Error("Album ID and track IDs array are required");
    }

    try {
      const album = await Album.findById(albumId);
      if (!album) {
        throw new Error("Album not found");
      }

      // Validate that all track IDs exist in the album
      const validTrackIds = trackIds.filter((id) => album.tracks.includes(id));
      if (validTrackIds.length !== trackIds.length) {
        throw new Error("Some track IDs are not part of this album");
      }

      const updatedAlbum = await Album.findByIdAndUpdate(
        albumId,
        { tracks: trackIds, updatedAt: new Date() },
        { new: true }
      );

      return await this.getAlbumById(albumId);
    } catch (error) {
      throw new Error(`Failed to update track order: ${error.message}`);
    }
  }

  /**
   * Add signed URLs to albums (simple version for ObjectId references)
   * Only processes album cover URLs
   */
  async addSignedUrlsToAlbumsSimple(albums) {
    try {
      const isArray = Array.isArray(albums);
      const albumsArray = isArray ? albums : [albums];

      const albumsWithSignedUrls = await Promise.all(
        albumsArray.map(async (album) => {
          const albumObj = album.toObject ? album.toObject() : album;

          // Generate signed URL for album cover
          if (albumObj.coverUrl) {
            const coverFileName = extractFileName(albumObj.coverUrl);
            if (coverFileName) {
              const signedCoverUrl = await generateSignedUrl(
                coverFileName,
                7200
              );
              if (signedCoverUrl) {
                albumObj.coverUrl = signedCoverUrl;
              }
            }
          }

          // Handle artist avatar if populated
          if (albumObj.artist && albumObj.artist.avatar) {
            const avatarFileName = extractFileName(albumObj.artist.avatar);
            if (avatarFileName) {
              const signedAvatarUrl = await generateSignedUrl(
                avatarFileName,
                7200
              );
              if (signedAvatarUrl) {
                albumObj.artist.avatar = signedAvatarUrl;
              }
            }
          }

          return albumObj;
        })
      );

      return isArray ? albumsWithSignedUrls : albumsWithSignedUrls[0];
    } catch (error) {
      console.error("Error creating signed URLs for albums:", error);

      // Return original albums with cleared coverUrl on error
      const isArray = Array.isArray(albums);
      return isArray
        ? albums.map((album) => ({
            ...(album.toObject ? album.toObject() : album),
            coverUrl: null,
          }))
        : {
            ...(albums.toObject ? albums.toObject() : albums),
            coverUrl: null,
          };
    }
  }

  /**
   * Add signed URLs to albums with full nested data processing
   * For use with populated tracks and artist data
   */
  async addSignedUrlsToAlbums(albums) {
    try {
      const isArray = Array.isArray(albums);
      const albumsArray = isArray ? albums : [albums];

      const albumsWithSignedUrls = await Promise.all(
        albumsArray.map(async (album) => {
          const albumObj = album.toObject ? album.toObject() : album;

          // Generate signed URL for album cover
          if (albumObj.coverUrl) {
            const coverFileName = extractFileName(albumObj.coverUrl);
            if (coverFileName) {
              const signedCoverUrl = await generateSignedUrl(
                coverFileName,
                7200
              );
              if (signedCoverUrl) {
                albumObj.coverUrl = signedCoverUrl;
              }
            }
          }

          // Handle nested artist avatar if populated
          if (albumObj.artist && albumObj.artist.avatar) {
            const artistAvatarFileName = extractFileName(
              albumObj.artist.avatar
            );
            if (artistAvatarFileName) {
              const signedAvatarUrl = await generateSignedUrl(
                artistAvatarFileName,
                7200
              );
              if (signedAvatarUrl) {
                albumObj.artist.avatar = signedAvatarUrl;
              }
            }
          }

          // Handle nested tracks if populated
          if (albumObj.tracks && Array.isArray(albumObj.tracks)) {
            albumObj.tracks = await Promise.all(
              albumObj.tracks.map(async (track) => {
                if (typeof track === "string") return track; // ObjectId reference

                const trackObj = { ...track };

                // Generate signed URL for track cover
                if (trackObj.coverUrl) {
                  const trackCoverFileName = extractFileName(trackObj.coverUrl);
                  if (trackCoverFileName) {
                    const signedTrackCoverUrl = await generateSignedUrl(
                      trackCoverFileName,
                      7200
                    );
                    if (signedTrackCoverUrl) {
                      trackObj.coverUrl = signedTrackCoverUrl;
                    }
                  }
                }

                // Generate signed URL for track audio
                if (trackObj.audioUrl) {
                  const trackAudioFileName = extractFileName(trackObj.audioUrl);
                  if (trackAudioFileName) {
                    const signedTrackAudioUrl = await generateSignedUrl(
                      trackAudioFileName,
                      7200
                    );
                    if (signedTrackAudioUrl) {
                      trackObj.audioUrl = signedTrackAudioUrl;
                    }
                  }
                }

                return trackObj;
              })
            );
          }

          return albumObj;
        })
      );

      return isArray ? albumsWithSignedUrls : albumsWithSignedUrls[0];
    } catch (error) {
      console.error(
        "Error creating signed URLs for albums with nested data:",
        error
      );
      return this.addSignedUrlsToAlbumsSimple(albums); // Fallback to simple version
    }
  }

  // Utility methods

  /**
   * Extract file ID from BackBlaze B2 URL
   */
  extractFileIdFromUrl(url) {
    if (!url) return null;

    try {
      const urlParts = url.split("/");
      const fileIndex = urlParts.indexOf("file");

      if (fileIndex === -1 || fileIndex + 2 >= urlParts.length) {
        return null;
      }

      const pathParts = urlParts.slice(fileIndex + 2);
      return pathParts.join("/");
    } catch (error) {
      return null;
    }
  }

  /**
   * Delete file from BackBlaze B2 using file ID
   */
  async deleteFileFromB2(fileId) {
    try {
      const b2 = new B2({
        applicationKeyId: config.b2.accountId,
        applicationKey: config.b2.secretKey,
      });

      await b2.authorize();

      const fileInfo = await b2.getFileInfo({ fileId });
      await b2.deleteFileVersion({
        fileId: fileId,
        fileName: fileInfo.data.fileName,
      });

      console.log(`Deleted file: ${fileInfo.data.fileName}`);
    } catch (error) {
      throw new Error(`B2 file deletion failed: ${error.message}`);
    }
  }
}

export default new AlbumService();
