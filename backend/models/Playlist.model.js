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
    isDraft: {
      type: Boolean,
      default: false,
      index: true, // Для быстрых запросов
    },

    lastModified: {
      type: Date,
      default: Date.now,
    },

    // Для отслеживания неактивных черновиков
    lastActivity: {
      type: Date,
      default: Date.now,
    },

    // Версионирование для optimistic updates
    version: {
      type: Number,
      default: 1,
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

playlistSchema.pre("save", function (next) {
  if (this.isModified() && !this.isModified("lastActivity")) {
    this.lastActivity = new Date();
  }
  next();
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

playlistSchema.statics.cleanupOldDrafts = async function (daysOld = 7) {
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - daysOld);

  return await this.deleteMany({
    isDraft: true,
    lastActivity: { $lt: cutoffDate },
    tracks: { $size: 0 }, // Только пустые плейлисты
  });
};

export default mongoose.model("Playlist", playlistSchema);
