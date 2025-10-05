import mongoose from "mongoose";

/**
 * Playlist Model
 * Manages user-created and platform playlists with tracks, metadata, and privacy settings
 * Supports draft functionality and automatic statistics calculation
 */
const playlistSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Playlist name is required"],
      trim: true,
      maxlength: [100, "Name cannot be longer than 100 characters"],
    },
    description: {
      type: String,
      trim: true,
      maxlength: [500, "Description cannot be longer than 500 characters"],
    },
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    tracks: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Track",
      },
    ],
    coverUrl: {
      type: String,
      default: null,
    },
    // Field for storing cover file ID
    coverFileId: {
      type: String,
      default: null,
    },
    tags: [
      {
        type: String,
        trim: true,
      },
    ],
    likeCount: {
      type: Number,
      default: 0,
    },
    followCount: {
      type: Number,
      default: 0,
    },
    // Field for total duration
    totalDuration: {
      type: Number,
      default: 0,
    },
    // Field for track count (for quick access)
    trackCount: {
      type: Number,
      default: 0,
    },
    // Field for playlist category
    category: {
      type: String,
      enum: ["user", "featured", "genre", "mood", "activity"],
      default: "user",
    },
    // Privacy settings field (replaces isPublic)
    privacy: {
      type: String,
      enum: ["public", "private", "unlisted"],
      default: "public",
    },
    isDraft: {
      type: Boolean,
      default: false,
      index: true, // For fast queries
    },

    lastModified: {
      type: Date,
      default: Date.now,
    },

    // For tracking inactive drafts
    lastActivity: {
      type: Date,
      default: Date.now,
    },

    // Versioning for optimistic updates
    version: {
      type: Number,
      default: 1,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes for fast search
playlistSchema.index({ name: "text", description: "text" });
playlistSchema.index({ owner: 1 });
playlistSchema.index({ createdAt: -1 });
playlistSchema.index({ privacy: 1 });
playlistSchema.index({ category: 1 });

// Virtual field for counting tracks
playlistSchema.virtual("tracksCount").get(function () {
  return this.tracks.length;
});

playlistSchema.pre("save", function (next) {
  if (this.isModified() && !this.isModified("lastActivity")) {
    this.lastActivity = new Date();
  }
  next();
});

// Middleware for updating counters on change
playlistSchema.pre("save", async function (next) {
  if (this.isModified("tracks")) {
    this.trackCount = this.tracks.length;

    // Recalculate total duration
    if (this.tracks.length > 0) {
      const Track = mongoose.model("Track");
      const tracks = await Track.find({ _id: { $in: this.tracks } }).select(
        "duration"
      );
      this.totalDuration = tracks.reduce(
        (sum, track) => sum + (track.duration || 0),
        0
      );
    } else {
      this.totalDuration = 0;
    }
  }
  next();
});

/**
 * Static method to cleanup old drafts
 * @param {number} daysOld - Age threshold in days
 * @returns {Promise} Deletion result
 */
playlistSchema.statics.cleanupOldDrafts = async function (daysOld = 7) {
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - daysOld);

  return await this.deleteMany({
    isDraft: true,
    lastActivity: { $lt: cutoffDate },
    tracks: { $size: 0 }, // Only empty playlists
  });
};

export default mongoose.model("Playlist", playlistSchema);