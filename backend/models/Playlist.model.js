import mongoose from "mongoose";

const playlistSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Название плейлиста обязательно"],
      trim: true,
      maxlength: [100, "Название не может быть длиннее 100 символов"],
    },
    description: {
      type: String,
      trim: true,
      maxlength: [500, "Описание не может быть длиннее 500 символов"],
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
    isPublic: {
      type: Boolean,
      default: true,
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
  },
  {
    timestamps: true,
  }
);

// Индексы для быстрого поиска
playlistSchema.index({ name: "text", description: "text" });
playlistSchema.index({ owner: 1 });
playlistSchema.index({ createdAt: -1 });

export const Playlist = mongoose.model("Playlist", playlistSchema);
export default Playlist;
