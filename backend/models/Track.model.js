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
      type: mongoose.Schema.Types.ObjectId,
      ref: "Album",
      default: null,
    },
    audioUrl: {
      type: String,
      required: [true, "URL аудио файла обязателен"],
    },
    coverUrl: {
      type: String,
      required: [true, "URL обложки обязателен"],
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
    audioQuality: {
      type: String,
      enum: ["128k", "320k"],
      default: "128k",
    },
  },
  {
    timestamps: true,
  }
);

trackSchema.index({ name: "text", genre: "text" });
trackSchema.index({ artist: 1 });
trackSchema.index({ album: 1 });
trackSchema.index({ createdAt: -1 });
trackSchema.index({ listenCount: -1 });

export default mongoose.model("Track", trackSchema);
