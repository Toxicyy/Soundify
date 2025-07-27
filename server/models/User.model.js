import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Имя обязательно"],
      trim: true,
      maxlength: [50, "Имя не может быть длиннее 50 символов"],
    },
    username: {
      type: String,
      required: [true, "Username обязателен"],
      unique: true,
      trim: true,
      lowercase: true,
      maxlength: [30, "Username не может быть длиннее 30 символов"],
    },
    email: {
      type: String,
      required: [true, "Email обязателен"],
      unique: true,
      lowercase: true,
      match: [
        /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/,
        "Введите корректный email",
      ],
    },
    password: {
      type: String,
      required: [true, "Пароль обязателен"],
      minlength: [6, "Пароль должен быть минимум 6 символов"],
    },
    avatar: {
      type: String,
      default: null,
    },
    status: {
      type: String,
      enum: ["USER", "PREMIUM", "ADMIN"],
      default: "USER",
    },
    // NEW: Artist profile reference
    artistProfile: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Artist",
      default: null,
      unique: true, // One user can have only one artist profile
      sparse: true, // Allows multiple null values
    },
    playlists: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Playlist",
      },
    ],
    likedSongs: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Track",
      },
    ],
    likedPlaylists: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Playlist",
      },
    ],
    likedArtists: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Artist",
      },
    ],
    isVerified: {
      type: Boolean,
      default: false,
    },
    // Premium features tracking
    skipTracking: {
      count: {
        type: Number,
        default: 0,
      },
      hourTimestamp: {
        type: Number,
        default: null,
      },
      blockedUntil: {
        type: Date,
        default: null,
      },
    },
  },
  {
    timestamps: true,
  }
);

// Virtual for checking if user is an artist
userSchema.virtual("isArtist").get(function () {
  return this.artistProfile !== null;
});

// Ensure virtuals are included when converting to JSON
userSchema.set("toJSON", { virtuals: true });
userSchema.set("toObject", { virtuals: true });

export default mongoose.model("User", userSchema);
