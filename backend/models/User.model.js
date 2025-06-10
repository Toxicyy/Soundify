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
      enum: ["USER", "ARTIST", "ADMIN"],
      default: "USER",
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
  },
  {
    timestamps: true,
  }
);

export default mongoose.model("User", userSchema);
