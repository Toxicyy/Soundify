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
  updatedAt: { type: Date, default: Date.now },
  createdAt: { type: Date, default: Date.now },
});

export default mongoose.model("Album", albumSchema);
