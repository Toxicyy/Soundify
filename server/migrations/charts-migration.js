import { config } from "../config/config.js";
import mongoose from "mongoose";

/**
 * Migration script to add chart-related fields to existing tracks
 * Uses project config for database connection
 */

// Define Track schema inline to avoid import issues
const trackSchema = new mongoose.Schema(
  {
    name: String,
    artist: { type: mongoose.Schema.Types.ObjectId, ref: "Artist" },
    album: { type: mongoose.Schema.Types.Mixed, ref: "Album" },
    audioUrl: String,
    audioFileId: String,
    coverUrl: String,
    coverFileId: String,
    duration: { type: Number, default: 0 },
    genre: String,
    tags: [String],
    listenCount: { type: Number, default: 0 },
    validListenCount: { type: Number, default: 0 },
    likeCount: { type: Number, default: 0 },
    isPublic: { type: Boolean, default: true },
    uploadedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    isHLS: { type: Boolean, default: false },
    hlsSegments: [String],
    hlsSegmentFileIds: [String],
    audioQuality: { type: String, enum: ["128k", "320k"], default: "128k" },
    chartEligible: { type: Boolean, default: true },
    lastChartUpdate: { type: Date, default: Date.now },
    currentChartPosition: {
      global: { type: Number, default: null },
    },
    peakChartPosition: {
      global: { type: Number, default: null },
      date: { type: Date, default: null },
    },
  },
  { timestamps: true }
);

const Track = mongoose.model("Track", trackSchema);

const migrateTracksForCharts = async () => {
  try {
    console.log("🚀 Starting charts migration...");
    console.log("📍 MongoDB URI:", config.mongoUri ? "Found" : "Missing");

    // Connect to MongoDB using project config
    if (!config.mongoUri) {
      throw new Error("MONGO_URI environment variable is required");
    }

    await mongoose.connect(config.mongoUri);
    console.log("✅ Connected to MongoDB");

    // Check if tracks collection exists
    const collections = await mongoose.connection.db
      .listCollections()
      .toArray();
    const tracksCollection = collections.find((col) => col.name === "tracks");

    if (!tracksCollection) {
      console.log(
        "⚠️  No tracks collection found. Creating empty collection..."
      );
      await mongoose.connection.db.createCollection("tracks");
    }

    // Get all tracks
    const tracks = await Track.find({});
    console.log(`📊 Found ${tracks.length} tracks to migrate`);

    if (tracks.length === 0) {
      console.log("✅ No tracks to migrate. Migration completed.");
      return;
    }

    let updated = 0;
    let errors = 0;

    // Process tracks in batches to avoid memory issues
    const batchSize = 100;

    for (let i = 0; i < tracks.length; i += batchSize) {
      const batch = tracks.slice(i, i + batchSize);

      console.log(
        `Processing batch ${Math.floor(i / batchSize) + 1}/${Math.ceil(
          tracks.length / batchSize
        )}`
      );

      const bulkOps = batch.map((track) => {
        // Estimate validListenCount as 85% of total listenCount
        // This is a reasonable assumption that most listens were valid
        const estimatedValidListens = Math.floor(
          (track.listenCount || 0) * 0.85
        );

        return {
          updateOne: {
            filter: { _id: track._id },
            update: {
              $set: {
                validListenCount: estimatedValidListens,
                lastChartUpdate: new Date(),
                chartEligible:
                  track.isPublic !== false && (track.duration || 0) > 30,
                "currentChartPosition.global": null,
                "peakChartPosition.global": null,
                "peakChartPosition.date": null,
              },
            },
            upsert: false,
          },
        };
      });

      try {
        const result = await Track.bulkWrite(bulkOps, { ordered: false });
        updated += result.modifiedCount || 0;
        console.log(
          `✅ Updated ${result.modifiedCount || 0} tracks in this batch`
        );
      } catch (error) {
        console.error(`❌ Error updating batch:`, error.message);
        errors += batch.length;
      }
    }

    // Create indexes for chart performance
    console.log("📝 Creating indexes for chart performance...");

    try {
      await Track.collection.createIndex(
        { validListenCount: -1, chartEligible: 1 },
        { name: "charts_performance_index", background: true }
      );
      console.log("✅ Created charts_performance_index");

      await Track.collection.createIndex(
        { genre: 1, validListenCount: -1 },
        { name: "genre_charts_index", background: true }
      );
      console.log("✅ Created genre_charts_index");

      await Track.collection.createIndex(
        { lastChartUpdate: 1 },
        { name: "chart_update_index", background: true }
      );
      console.log("✅ Created chart_update_index");
    } catch (indexError) {
      console.warn("⚠️  Index creation warning:", indexError.message);
    }

    // Summary
    console.log("\n📊 Migration Summary:");
    console.log(`✅ Successfully updated: ${updated} tracks`);
    console.log(`❌ Errors: ${errors} tracks`);

    const chartEligibleCount = await Track.countDocuments({
      chartEligible: true,
    });
    console.log(`📈 Chart-eligible tracks: ${chartEligibleCount}`);

    if (errors === 0) {
      console.log("🎉 Migration completed successfully!");
    } else {
      console.log("⚠️  Migration completed with some errors");
    }
  } catch (error) {
    console.error("💥 Migration failed:", error);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
    console.log("🔌 Disconnected from MongoDB");
    process.exit(0);
  }
};

// Run migration
migrateTracksForCharts();
