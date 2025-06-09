import mongoose from "mongoose";

const trackSchema = new mongoose.Schema({
  name: { type: String, required: true },
  artist: { type: String, required: true },
  audioUrl: { type: String, required: true },
  coverUrl: { type: String, required: true },
  listenCount: { type: Number, default: 0 },
  createdAt: { type: Date, default: Date.now },
});

export default mongoose.model("Track", trackSchema);
