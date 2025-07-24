import mongoose from "mongoose";

const albumSchema = new mongoose.Schema({
  name: { type: String, required: true, index: true },
  artist: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Artist",
    required: true,
  },
  description: String,
  coverUrl: String,
  coverFileId: String,
  releaseDate: Date,
  tracks: [{ type: mongoose.Schema.Types.ObjectId, ref: "Track" }],
  genre: [String],
  type: { type: String, enum: ["album", "ep", "single"], default: "album" },

  // NEW: Album status for batch processing
  status: {
    type: String,
    enum: ["processing", "published", "failed"],
    default: "processing",
    index: true, // Index for efficient queries
  },

  // NEW: Processing metadata (optional, for debugging)
  processingInfo: {
    sessionId: String, // Batch session ID
    totalTracks: Number, // Expected number of tracks
    processedTracks: Number, // Successfully processed tracks
    failedAt: String, // Step where processing failed (if failed)
    processingStarted: Date,
    processingCompleted: Date,
  },

  updatedAt: { type: Date, default: Date.now },
  createdAt: { type: Date, default: Date.now },
});

// Indexes for efficient querying
albumSchema.index({ artist: 1, status: 1 }); // Artist's albums by status
albumSchema.index({ status: 1, createdAt: -1 }); // Processing queue
albumSchema.index({ "processingInfo.sessionId": 1 }); // Batch session lookup

// Virtual for checking if album is ready for public display
albumSchema.virtual("isPublished").get(function () {
  return this.status === "published" && this.tracks.length > 0;
});

// Pre-save hook to auto-update timestamps
albumSchema.pre("save", function (next) {
  this.updatedAt = new Date();

  // Auto-set processing timestamps
  if (this.isModified("status")) {
    if (
      this.status === "processing" &&
      !this.processingInfo?.processingStarted
    ) {
      if (!this.processingInfo) this.processingInfo = {};
      this.processingInfo.processingStarted = new Date();
    }

    if (
      (this.status === "published" || this.status === "failed") &&
      !this.processingInfo?.processingCompleted
    ) {
      if (!this.processingInfo) this.processingInfo = {};
      this.processingInfo.processingCompleted = new Date();
    }
  }

  next();
});

// Static method to find albums by status
albumSchema.statics.findByStatus = function (status, options = {}) {
  const { limit = 20, page = 1, artistId } = options;
  const skip = (page - 1) * limit;

  const query = { status };
  if (artistId) query.artist = artistId;

  return this.find(query)
    .populate("artist", "name avatar")
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit);
};

// Static method to find stuck processing albums (for cleanup)
albumSchema.statics.findStuckProcessing = function (hoursAgo = 2) {
  const cutoffTime = new Date(Date.now() - hoursAgo * 60 * 60 * 1000);

  return this.find({
    status: "processing",
    createdAt: { $lt: cutoffTime },
  }).populate("artist", "name");
};

// Instance method to mark as failed
albumSchema.methods.markAsFailed = function (reason) {
  this.status = "failed";
  if (!this.processingInfo) this.processingInfo = {};
  this.processingInfo.failedAt = reason;
  this.processingInfo.processingCompleted = new Date();
  return this.save();
};

// Instance method to mark as published
albumSchema.methods.markAsPublished = function () {
  this.status = "published";
  if (!this.processingInfo) this.processingInfo = {};
  this.processingInfo.processingCompleted = new Date();
  return this.save();
};

// Instance method to update processing progress
albumSchema.methods.updateProcessingProgress = function (
  processedTracks,
  sessionId
) {
  if (!this.processingInfo) this.processingInfo = {};
  this.processingInfo.processedTracks = processedTracks;
  if (sessionId) this.processingInfo.sessionId = sessionId;
  return this.save();
};

export default mongoose.model("Album", albumSchema);
