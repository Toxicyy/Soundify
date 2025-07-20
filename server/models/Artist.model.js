import mongoose from "mongoose";

const artistSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    index: true,
  },
  slug: {
    type: String,
    unique: true,
    index: true,
  },
  // NEW: Owner reference (user who owns this artist profile)
  owner: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: [true, "Artist must have an owner"],
    unique: true, // One artist profile per user
    index: true,
  },
  bio: String,
  avatar: String,
  albums: [{ type: mongoose.Schema.Types.ObjectId, ref: "Album" }],
  avatarFileId: { type: String },
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

// Virtual for checking if artist has an owner
artistSchema.virtual("hasOwner").get(function () {
  return this.owner !== null;
});

// Virtual for checking if current user owns this artist (needs to be populated)
artistSchema.virtual("isOwnedBy").get(function () {
  return function (userId) {
    return this.owner && this.owner.toString() === userId.toString();
  };
});

// Method to check ownership
artistSchema.methods.isOwnedByUser = function (userId) {
  return this.owner && this.owner.toString() === userId.toString();
};

// Ensure virtuals are included when converting to JSON
artistSchema.set("toJSON", { virtuals: true });
artistSchema.set("toObject", { virtuals: true });

export default mongoose.model("Artist", artistSchema);
