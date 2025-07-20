import mongoose from "mongoose";

const trackSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Название трека обязательно"],
      trim: true,
      maxlength: [100, "Название не может быть длиннее 100 символов"],
    },
    artist: {
      type: mongoose.Schema.Types.ObjectId,
      required: [true, "Артист обязателен"],
      ref: "Artist",
      trim: true,
    },
    album: {
      type: mongoose.Schema.Types.Mixed,
      ref: "Album",
      default: null,
    },
    audioUrl: {
      type: String,
      required: [true, "URL аудио файла обязателен"],
    },
    audioFileId: {
      type: String,
      // Not required for backward compatibility
      // Will be populated by migration script
    },
    coverUrl: {
      type: String,
      required: [true, "URL обложки обязателен"],
    },
    coverFileId: {
      type: String,
      // Not required for backward compatibility
      // Will be populated by migration script
    },
    duration: {
      type: Number,
      default: 0,
    },
    genre: {
      type: String,
      trim: true,
    },
    tags: [
      {
        type: String,
        trim: true,
      },
    ],
    listenCount: {
      type: Number,
      default: 0,
    },
    // NEW: Valid listen count for charts (listens >= 30 seconds or 25% of track)
    validListenCount: {
      type: Number,
      default: 0,
    },
    likeCount: {
      type: Number,
      default: 0,
    },
    isPublic: {
      type: Boolean,
      default: true,
    },
    uploadedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    isHLS: {
      type: Boolean,
      default: false,
    },
    hlsSegments: [
      {
        type: String, // URLs сегментов
      },
    ],
    hlsSegmentFileIds: [
      {
        type: String, // BackBlaze B2 file IDs for HLS segments
      },
    ],
    audioQuality: {
      type: String,
      enum: ["128k", "320k"],
      default: "128k",
    },
    // NEW: Chart-related fields
    chartEligible: {
      type: Boolean,
      default: function () {
        return this.isPublic && this.duration > 30;
      },
    },
    lastChartUpdate: {
      type: Date,
      default: Date.now,
    },
    currentChartPosition: {
      global: { type: Number, default: null },
      // Country positions will be stored in ChartCache collection
    },
    peakChartPosition: {
      global: { type: Number, default: null },
      date: { type: Date, default: null },
    },
  },
  {
    timestamps: true,
  }
);

// Existing indexes
trackSchema.index({ name: "text", genre: "text" });
trackSchema.index({ artist: 1 });
trackSchema.index({ album: 1 });
trackSchema.index({ createdAt: -1 });
trackSchema.index({ listenCount: -1 });

// NEW: Chart performance indexes
trackSchema.index({ validListenCount: -1, chartEligible: 1 });
trackSchema.index({ genre: 1, validListenCount: -1 });
trackSchema.index({ lastChartUpdate: 1 });
trackSchema.index({ "currentChartPosition.global": 1 });

// Virtual for chart eligibility check
trackSchema.virtual("isChartEligible").get(function () {
  return this.chartEligible && this.isPublic && this.duration > 30;
});

// Method to calculate minimum listen time for validity
trackSchema.methods.getMinListenTime = function () {
  return Math.max(30, this.duration * 0.25);
};

// Method to check if a listen duration is valid
trackSchema.methods.isValidListen = function (listenDuration) {
  return listenDuration >= this.getMinListenTime();
};

// Pre-save hook to update chartEligible
trackSchema.pre("save", function (next) {
  if (this.isModified("isPublic") || this.isModified("duration")) {
    this.chartEligible = this.isPublic && this.duration > 30;
  }
  next();
});

export default mongoose.model("Track", trackSchema);
