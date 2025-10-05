import Artist from "../models/Artist.model.js";
import Track from "../models/Track.model.js";
import Album from "../models/Album.model.js";
import { uploadToB2 } from "../utils/upload.js";
import { generateSignedUrl, extractFileName } from "../utils/b2SignedUrl.js";
import TrackService from "./TrackService.js";
import mongoose from "mongoose";
import AlbumService from "./AlbumService.js";
import User from "../models/User.model.js";

/**
 * Service for managing artists and their content
 * Handles artist CRUD operations, content retrieval, and profile management
 */
class ArtistService {
  /**
   * Create new artist with optional avatar
   * @param {Object} artistData - Artist data (name, bio, genres, socialLinks)
   * @param {Object} avatarFile - Avatar file from multer
   * @returns {Promise<Object>} Created artist document
   */
  async createArtist(artistData, avatarFile) {
    const { name, bio, genres, socialLinks } = artistData;

    // Check if artist already exists
    const existingArtist = await Artist.findOne({
      name: new RegExp(`^${name}$`, "i"),
    });

    if (existingArtist) {
      throw new Error("Artist with this name already exists");
    }

    try {
      // Upload avatar if provided
      let avatarUrl = null;
      let avatarFileId = null;
      if (avatarFile) {
        const uploadResult = await uploadToB2(avatarFile, "artistAvatars");
        if (typeof uploadResult === "string") {
          avatarUrl = uploadResult; // Old format
        } else {
          avatarUrl = uploadResult.url; // New format
          avatarFileId = uploadResult.fileId;
        }
      }

      // Parse data if needed
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

      // Create artist
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
      throw new Error(`Artist creation failed: ${error.message}`);
    }
  }

  /**
   * Get all artists with pagination and filtering
   * @param {Object} options - Query options
   * @returns {Promise<Object>} Artists with pagination info
   */
  async getAllArtists({ page = 1, limit = 20, search, genre }) {
    try {
      const skip = (page - 1) * limit;

      // Build filter
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
      throw new Error(`Failed to retrieve artists: ${error.message}`);
    }
  }

  /**
   * Get artist by ID
   * @param {string} id - Artist ID
   * @returns {Promise<Object>} Artist with signed URLs
   */
  async getArtistById(id) {
    try {
      const artist = await Artist.findById(id);

      if (!artist) {
        throw new Error("Artist not found");
      }
      const artistWithSignedUrls = await this.addSignedUrlsToArtists(artist);

      return artistWithSignedUrls;
    } catch (error) {
      throw new Error(`Failed to retrieve artist: ${error.message}`);
    }
  }

  /**
   * Get artist by slug
   * @param {string} slug - Artist slug
   * @returns {Promise<Object>} Artist with signed URLs
   */
  async getArtistBySlug(slug) {
    try {
      const artist = await Artist.findOne({ slug });

      if (!artist) {
        throw new Error("Artist not found");
      }
      const artistWithSignedUrls = await this.addSignedUrlsToArtists(artist);
      return artistWithSignedUrls;
    } catch (error) {
      throw new Error(`Failed to retrieve artist: ${error.message}`);
    }
  }

  /**
   * Update artist data with optional new avatar
   * @param {string} id - Artist ID
   * @param {Object} updates - Update data
   * @param {Object} avatarFile - Optional new avatar file
   * @returns {Promise<Object>} Updated artist
   */
  async updateArtist(id, updates, avatarFile) {
    try {
      // Upload new avatar if provided
      if (avatarFile) {
        const uploadResult = await uploadToB2(avatarFile, "artistAvatars");

        if (typeof uploadResult === "string") {
          updates.avatar = uploadResult;
        } else {
          updates.avatar = uploadResult.url;
          updates.avatarFileId = uploadResult.fileId;
        }
      }

      // Parse data if needed
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
        throw new Error("Artist not found");
      }

      return artist;
    } catch (error) {
      throw new Error(`Artist update failed: ${error.message}`);
    }
  }

  /**
   * Delete artist
   * @param {string} id - Artist ID
   * @returns {Promise<Object>} Deleted artist
   */
  async deleteArtist(id) {
    try {
      // Check for tracks
      const trackCount = await Track.countDocuments({ artist: id });
      if (trackCount > 0) {
        throw new Error(
          `Cannot delete artist. They have ${trackCount} tracks`
        );
      }

      // Check for albums
      const albumCount = await Album.countDocuments({ artist: id });
      if (albumCount > 0) {
        throw new Error(
          `Cannot delete artist. They have ${albumCount} albums`
        );
      }

      const artist = await Artist.findByIdAndDelete(id);
      if (!artist) {
        throw new Error("Artist not found");
      }

      return artist;
    } catch (error) {
      throw new Error(`Artist deletion failed: ${error.message}`);
    }
  }

  /**
   * Get artist tracks with pagination
   * @param {string} artistId - Artist ID
   * @param {Object} options - Query options
   * @returns {Promise<Object>} Tracks with pagination info
   */
  async getArtistTracks(
    artistId,
    { page = 1, limit = 20, sortBy = "createdAt", sortOrder = -1 }
  ) {
    try {
      // Check if artist exists
      const artist = await Artist.findById(artistId);
      if (!artist) {
        throw new Error("Artist not found");
      }

      const skip = (page - 1) * limit;
      const sort = { [sortBy]: sortOrder };

      const tracks = await Track.find({ artist: artistId })
        .populate("artist", "name")
        .sort(sort)
        .skip(skip)
        .limit(limit);

      // Populate only for tracks with ObjectId in album field
      for (let track of tracks) {
        if (
          track.album &&
          track.album !== "single" &&
          mongoose.Types.ObjectId.isValid(track.album)
        ) {
          await track.populate("album", "name coverUrl");
        }
      }
      const total = await Track.countDocuments({ artist: artistId });
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
      throw new Error(`Failed to retrieve artist tracks: ${error.message}`);
    }
  }

  /**
   * Get artist albums with pagination
   * @param {string} artistId - Artist ID
   * @param {Object} options - Query options
   * @returns {Promise<Object>} Albums with pagination info
   */
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
      const albumsWithSignedUrls = await AlbumService.addSignedUrlsToAlbums(
        albums
      );

      return {
        albumsWithSignedUrls,
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
        `Failed to retrieve artist albums: ${error.message}`
      );
    }
  }

  /**
   * Search artists by name and slug
   * @param {string} query - Search query
   * @param {Object} options - Search options
   * @returns {Promise<Object>} Search results
   */
  async searchArtists(query, { limit = 10 }) {
    if (!query || query.trim().length === 0) {
      throw new Error("Search query cannot be empty");
    }

    try {
      // Create regex for search
      const searchRegex = new RegExp(`^${query}`, "i");

      // Search artists by name and slug
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
      throw new Error(`Artist search failed: ${error.message}`);
    }
  }

  /**
   * Get popular artists
   * @param {Object} options - Query options
   * @returns {Promise<Object>} Popular artists
   */
  async getPopularArtists({ limit = 15 }) {
    try {
      const artists = await Artist.find({})
        .select("name slug avatar isVerified followerCount genres")
        .sort({
          followerCount: -1, // First by followers
          isVerified: -1, // Then by verification status
          createdAt: -1, // And by creation date
        })
        .limit(limit);

      const artistsWithSignedUrls = await this.addSignedUrlsToArtists(artists);
      return {
        artists: artistsWithSignedUrls,
        count: artists.length,
      };
    } catch (error) {
      throw new Error(
        `Failed to retrieve popular artists: ${error.message}`
      );
    }
  }

  /**
   * Add signed URLs to artists
   * @param {Object|Array} artists - Artist(s) to process
   * @returns {Promise<Object|Array>} Artists with signed URLs
   */
  async addSignedUrlsToArtists(artists) {
    try {
      // Check if array or single object
      const isArray = Array.isArray(artists);
      const artistsArray = isArray ? artists : [artists];

      const artistsWithSignedUrls = await Promise.all(
        artistsArray.map(async (artist) => {
          const artistObj = artist.toObject ? artist.toObject() : artist;

          if (artistObj.avatar) {
            const fileName = extractFileName(artistObj.avatar);
            if (fileName) {
              const signedUrl = await generateSignedUrl(fileName, 7200); // 2 hours
              if (signedUrl) {
                artistObj.avatar = signedUrl;
              }
            }
          }

          return artistObj;
        })
      );

      // Return in same format as received
      return isArray ? artistsWithSignedUrls : artistsWithSignedUrls[0];
    } catch (error) {
      console.error("Error creating signed URLs:", error);

      // Error handling with input type consideration
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

  /**
   * Create artist profile for user
   * @param {string} userId - User ID
   * @param {Object} artistData - Artist data
   * @param {Object} avatarFile - Avatar file
   * @returns {Promise<Object>} Created artist with signed URLs
   */
  async createArtistForUser(userId, artistData, avatarFile) {
    const { name, bio, genres, socialLinks } = artistData;

    if (!userId) {
      throw new Error("User ID is required");
    }

    if (!name) {
      throw new Error("Artist name is required");
    }

    try {
      // Check that user exists and doesn't have an artist
      const user = await User.findById(userId);
      if (!user) {
        throw new Error("User not found");
      }

      if (user.artistProfile) {
        throw new Error("User already has an artist profile");
      }

      // Check for unique artist name
      const existingArtist = await Artist.findOne({
        name: new RegExp(`^${name}$`, "i"),
      });

      if (existingArtist) {
        throw new Error("Artist with this name already exists");
      }

      // Upload avatar if provided
      let avatarUrl = null;
      let avatarFileId = null;
      if (avatarFile) {
        const uploadResult = await uploadToB2(avatarFile, "artistAvatars");
        if (typeof uploadResult === "string") {
          avatarUrl = uploadResult; // Old format
        } else {
          avatarUrl = uploadResult.url; // New format
          avatarFileId = uploadResult.fileId;
        }
      }

      // Parse data if needed
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

      // Create artist with owner
      const newArtist = new Artist({
        name: name.trim(),
        owner: userId,
        bio: bio?.trim(),
        avatar: avatarUrl,
        avatarFileId: avatarFileId,
        genres: parsedGenres || [],
        socialLinks: parsedSocialLinks,
      });

      await newArtist.save();

      await User.findByIdAndUpdate(userId, {
        artistProfile: newArtist._id,
      });

      return await this.addSignedUrlsToArtists(newArtist);
    } catch (error) {
      throw new Error(`Artist profile creation failed: ${error.message}`);
    }
  }
}

export default new ArtistService();