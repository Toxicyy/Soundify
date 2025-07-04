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
    // Добавляем поле для хранения fileId обложки
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
    // Добавляем поле для общей продолжительности
    totalDuration: {
      type: Number,
      default: 0,
    },
    // Добавляем поле для количества треков (для быстрого доступа)
    trackCount: {
      type: Number,
      default: 0,
    },
    // Добавляем поле для категории плейлиста
    category: {
      type: String,
      enum: ["user", "featured", "genre", "mood", "activity"],
      default: "user",
    },
    // Поле для настроек конфиденциальности (заменяет isPublic)
    privacy: {
      type: String,
      enum: ["public", "private", "unlisted"],
      default: "public",
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
playlistSchema.index({ privacy: 1 });
playlistSchema.index({ category: 1 });

// Виртуальное поле для подсчета треков
playlistSchema.virtual("tracksCount").get(function () {
  return this.tracks.length;
});

// Middleware для обновления счетчиков при изменении
playlistSchema.pre("save", async function (next) {
  if (this.isModified("tracks")) {
    this.trackCount = this.tracks.length;

    // Пересчитываем общую продолжительность
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

export default mongoose.model("Playlist", playlistSchema);
