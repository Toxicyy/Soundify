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
      type: String, // Пока строка, можно будет изменить на ObjectId
      required: [true, "Артист обязателен"],
      trim: true,
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
  },
  {
    timestamps: true,
  }
);

trackSchema.index({ name: "text", artist: "text", genre: "text" });
trackSchema.index({ createdAt: -1 });
trackSchema.index({ listenCount: -1 });

export default mongoose.model("Track", trackSchema);
