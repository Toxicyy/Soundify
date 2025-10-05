import mongoose from "mongoose";

/**
 * User Model
 * Manages user accounts with authentication, profile data, and music preferences
 * Supports user, premium, and admin status levels
 * Tracks liked content and artist profiles
 */
const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Name is required"],
      trim: true,
      maxlength: [50, "Name cannot be longer than 50 characters"],
    },
    username: {
      type: String,
      required: [true, "Username is required"],
      unique: true,
      trim: true,
      lowercase: true,
      maxlength: [30, "Username cannot be longer than 30 characters"],
    },
    email: {
      type: String,
      required: [true, "Email is required"],
      unique: true,
      lowercase: true,
      match: [
        /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/,
        "Please enter a valid email",
      ],
    },
    password: {
      type: String,
      required: [true, "Password is required"],
      minlength: [6, "Password must be at least 6 characters"],
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
    // Artist profile reference
    artistProfile: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Artist",
      default: null,
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