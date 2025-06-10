import mongoose from "mongoose";

const artistSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    index: true, // Индекс для быстрого поиска
  },
  slug: {
    type: String,
    unique: true,
    index: true, // URL-friendly версия имени
  },
  bio: String,
  avatar: String,
  genres: [String],
  socialLinks: {
    spotify: String,
    instagram: String,
    twitter: String,
  },
  isVerified: { type: Boolean, default: false },
  followerCount: { type: Number, default: 0 },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

// Middleware для создания slug
artistSchema.pre("save", function (next) {
  if (this.isModified("name")) {
    this.slug = this.name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "");
  }
  this.updatedAt = new Date();
  next();
});

export default mongoose.model("Artist", artistSchema);
