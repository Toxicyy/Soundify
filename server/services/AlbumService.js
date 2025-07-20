import Album from "../models/Album.model.js";
import Track from "../models/Track.model.js";
import Artist from "../models/Artist.model.js";
import TrackService from "./TrackService.js";
import { uploadToB2 } from "../utils/upload.js";
import { generateSignedUrl, extractFileName } from "../utils/b2SignedUrl.js";
import { extractFileIdFromUrl, deleteFileFromB2 } from "../utils/b2Utils.js";

/**
 * Service for managing albums and their associated data
 * Handles album CRUD operations, track management, and file operations
 */
class AlbumService {
  /**
   * Create new album with optional cover image
   * @param {Object} albumData - Album data (name, artist, description, etc.)
   * @param {Object} coverFile - Cover image file from multer
   * @returns {Promise<Object>} Created album document with signed URLs
   */
  async createAlbum(albumData, coverFile) {
    const { name, artist, description, releaseDate, tracks, genre, type } =
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
        coverUrl = uploadResult.url;
        coverFileId =
          uploadResult.fileId || extractFileIdFromUrl(uploadResult.url);
      }

      // Parse genre from string or array (note: model uses 'genre' not 'genres')
      let parsedGenres = genre;
      if (typeof genre === "string") {
        try {
          parsedGenres = JSON.parse(genre);
        } catch (e) {
          parsedGenres = genre.split(",").map((g) => g.trim());
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

      // Save album
      const savedAlbum = await newAlbum.save();

      // Update artist's albums array
      await Artist.findByIdAndUpdate(
        artist.trim(),
        { $addToSet: { albums: savedAlbum._id } }, // Use $addToSet to prevent duplicates
        { new: true }
      );

      return await this.addSignedUrlsToAlbumsSimple(savedAlbum);
    } catch (error) {
      throw new Error(`Album creation failed: ${error.message}`);
    }
  }

  /**
   * Get album by ID with populated data
   * @param {string} id - Album ID
   * @returns {Promise<Object>} Album with signed URLs
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
   * @param {string} id - Album ID
   * @param {Object} updates - Update data
   * @param {Object} coverFile - Optional new cover file
   * @returns {Promise<Object>} Updated album with signed URLs
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
            await deleteFileFromB2(existingAlbum.coverFileId);
          } catch (error) {
            console.warn(`Failed to delete old cover file: ${error.message}`);
          }
        }

        // Upload new cover
        const uploadResult = await uploadToB2(coverFile, "albumCovers");
        updates.coverUrl = uploadResult.url;
        updates.coverFileId =
          uploadResult.fileId || extractFileIdFromUrl(uploadResult.url);
      }

      // Parse genre if provided
      if (updates.genre && typeof updates.genre === "string") {
        try {
          updates.genre = JSON.parse(updates.genre);
        } catch (e) {
          updates.genre = updates.genre.split(",").map((g) => g.trim());
        }
      }

      const updatedAlbum = await Album.findByIdAndUpdate(
        id,
        { ...updates, updatedAt: new Date() },
        { new: true, runValidators: true }
      ).populate("artist", "name avatar");

      return await this.addSignedUrlsToAlbumsSimple(updatedAlbum);
    } catch (error) {
      throw new Error(`Album update failed: ${error.message}`);
    }
  }

  /**
   * Delete album and its cover file
   * @param {string} id - Album ID
   * @returns {Promise<boolean>} Success status
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
          await deleteFileFromB2(album.coverFileId);
        } catch (error) {
          console.warn(`Failed to delete cover file: ${error.message}`);
        }
      }

      // Remove album from artist's albums array
      await Artist.findByIdAndUpdate(album.artist, { $pull: { albums: id } });

      // Delete the album
      await Album.findByIdAndDelete(id);

      return true;
    } catch (error) {
      throw new Error(`Album deletion failed: ${error.message}`);
    }
  }

  /**
   * Get paginated list of albums with search and filtering
   * @param {Object} options - Query options
   * @returns {Promise<Object>} Albums with pagination info
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
   * @param {string} albumId - Album ID
   * @param {Object} options - Query options
   * @returns {Promise<Object>} Album tracks with pagination info
   */
  async getAlbumTracks(
    albumId,
    { page = 1, limit = 20, sortBy = "createdAt", sortOrder = -1 }
  ) {
    if (!albumId) {
      throw new Error("Album ID is required");
    }

    try {
      const album = await Album.findById(albumId).populate("artist", "name");
      if (!album) {
        throw new Error("Album not found");
      }

      const skip = (page - 1) * limit;
      const sort = { [sortBy]: sortOrder };

      const [tracks, total] = await Promise.all([
        Track.find({ _id: { $in: album.tracks } })
          .populate("artist", "name avatar")
          .sort(sort)
          .skip(skip)
          .limit(limit),
        Track.countDocuments({ _id: { $in: album.tracks } }),
      ]);

      const totalPages = Math.ceil(total / limit);
      const tracksWithSignedUrls = await TrackService.addSignedUrlsToTracks(
        tracks
      );
      const albumWithSignedUrls = await this.addSignedUrlsToAlbumsSimple([
        album,
      ]);

      return {
        data: {
          album: {
            name: albumWithSignedUrls[0].name,
            coverUrl: albumWithSignedUrls[0].coverUrl,
            artist: {
              name: albumWithSignedUrls[0].artist.name,
            },
          },
          tracks: tracksWithSignedUrls.map((track) => {
            const { hlsSegments, hlsSegmentFileIds, ...trackWithoutHls } =
              track;
            return trackWithoutHls;
          }),
        },
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
   * @param {string} query - Search query
   * @param {Object} options - Search options
   * @returns {Promise<Object>} Search results
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
   * @param {string} genre - Genre to filter by
   * @returns {Promise<Array>} Albums in the specified genre
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
   * @param {string} type - Album type
   * @returns {Promise<Array>} Albums of the specified type
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
   * @param {string} albumId - Album ID
   * @param {string} trackId - Track ID
   * @returns {Promise<Object>} Updated album
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
        Album.findByIdAndUpdate(albumId, { $addToSet: { tracks: trackId } }),
        Track.findByIdAndUpdate(trackId, { album: albumId }),
      ]);

      return await this.getAlbumById(albumId);
    } catch (error) {
      throw new Error(`Failed to add track to album: ${error.message}`);
    }
  }

  /**
   * Remove track from album
   * @param {string} albumId - Album ID
   * @param {string} trackId - Track ID
   * @returns {Promise<Object>} Updated album
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
   * @returns {Promise<Object>} Updated album
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

      await Album.findByIdAndUpdate(
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
   * @param {Object|Array} albums - Album(s) to process
   * @returns {Promise<Object|Array>} Albums with signed URLs
   */
  async addSignedUrlsToAlbumsSimple(albums) {
    try {
      const isArray = Array.isArray(albums);
      const albumsArray = isArray ? albums : [albums];

      const albumsWithSignedUrls = await Promise.all(
        albumsArray.map(async (album) => {
          let albumObj;
          if (album.toObject) {
            albumObj = album.toObject();
          } else {
            albumObj = JSON.parse(JSON.stringify(album));
          }

          // Generate signed URL for album cover
          if (albumObj.coverUrl) {
            const coverFileName = extractFileName(albumObj.coverUrl);
            if (coverFileName) {
              try {
                const signedCoverUrl = await generateSignedUrl(
                  coverFileName,
                  7200
                );
                if (signedCoverUrl) {
                  albumObj.coverUrl = signedCoverUrl;
                }
              } catch (urlError) {
                console.warn(
                  `Failed to generate signed URL for album cover ${coverFileName}:`,
                  urlError.message
                );
              }
            }
          }

          // Handle artist avatar if populated
          if (albumObj.artist && albumObj.artist.avatar) {
            const avatarFileName = extractFileName(albumObj.artist.avatar);
            if (avatarFileName) {
              try {
                const signedAvatarUrl = await generateSignedUrl(
                  avatarFileName,
                  7200
                );
                if (signedAvatarUrl) {
                  albumObj.artist.avatar = signedAvatarUrl;
                }
              } catch (urlError) {
                console.warn(
                  `Failed to generate signed URL for artist avatar ${avatarFileName}:`,
                  urlError.message
                );
              }
            }
          }

          return albumObj;
        })
      );

      return isArray ? albumsWithSignedUrls : albumsWithSignedUrls[0];
    } catch (error) {
      console.error("Error creating signed URLs for albums:", error);

      const isArray = Array.isArray(albums);
      const fallbackAlbums = isArray
        ? albums.map((album) => {
            const albumObj = album.toObject ? album.toObject() : { ...album };
            return {
              ...albumObj,
              coverUrl: albumObj.coverUrl || null,
              artist: albumObj.artist
                ? {
                    ...albumObj.artist,
                    avatar: albumObj.artist.avatar || null,
                  }
                : albumObj.artist,
            };
          })
        : (() => {
            const albumObj = albums.toObject
              ? albums.toObject()
              : { ...albums };
            return {
              ...albumObj,
              coverUrl: albumObj.coverUrl || null,
              artist: albumObj.artist
                ? {
                    ...albumObj.artist,
                    avatar: albumObj.artist.avatar || null,
                  }
                : albumObj.artist,
            };
          })();

      return fallbackAlbums;
    }
  }

  /**
   * Add signed URLs to albums with full nested data processing
   * @param {Object|Array} albums - Album(s) to process
   * @returns {Promise<Object|Array>} Albums with signed URLs
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
              try {
                const signedCoverUrl = await generateSignedUrl(
                  coverFileName,
                  7200
                );
                if (signedCoverUrl) {
                  albumObj.coverUrl = signedCoverUrl;
                }
              } catch (urlError) {
                console.warn(
                  `Failed to generate signed URL for album cover ${coverFileName}:`,
                  urlError.message
                );
              }
            }
          }

          // Handle nested artist avatar if populated
          if (albumObj.artist && albumObj.artist.avatar) {
            const artistAvatarFileName = extractFileName(
              albumObj.artist.avatar
            );
            if (artistAvatarFileName) {
              try {
                const signedAvatarUrl = await generateSignedUrl(
                  artistAvatarFileName,
                  7200
                );
                if (signedAvatarUrl) {
                  albumObj.artist.avatar = signedAvatarUrl;
                }
              } catch (urlError) {
                console.warn(
                  `Failed to generate signed URL for artist avatar ${artistAvatarFileName}:`,
                  urlError.message
                );
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
                    try {
                      const signedTrackCoverUrl = await generateSignedUrl(
                        trackCoverFileName,
                        7200
                      );
                      if (signedTrackCoverUrl) {
                        trackObj.coverUrl = signedTrackCoverUrl;
                      }
                    } catch (urlError) {
                      console.warn(
                        `Failed to generate signed URL for track cover ${trackCoverFileName}:`,
                        urlError.message
                      );
                    }
                  }
                }

                // Generate signed URL for track audio
                if (trackObj.audioUrl) {
                  const trackAudioFileName = extractFileName(trackObj.audioUrl);
                  if (trackAudioFileName) {
                    try {
                      const signedTrackAudioUrl = await generateSignedUrl(
                        trackAudioFileName,
                        7200
                      );
                      if (signedTrackAudioUrl) {
                        trackObj.audioUrl = signedTrackAudioUrl;
                      }
                    } catch (urlError) {
                      console.warn(
                        `Failed to generate signed URL for track audio ${trackAudioFileName}:`,
                        urlError.message
                      );
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
}

export default new AlbumService();
