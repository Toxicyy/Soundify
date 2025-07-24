// Simple album migration script
// Save as simpleMigration.js in your project root

import mongoose from "mongoose";
import { config } from "../config/config.js";

// Hardcode your MongoDB URI here temporarily for testing
const MONGODB_URI = config.mongoUri || process.env.MONGO_URI;

async function migrate() {
  console.log("🚀 Starting migration...");

  try {
    // Connect
    console.log("📦 Connecting to MongoDB...");
    await mongoose.connect(MONGODB_URI);
    console.log("✅ Connected successfully");

    // Get collection directly
    const albumsCollection = mongoose.connection.db.collection("albums");

    // Check total albums
    const totalCount = await albumsCollection.countDocuments();
    console.log(`📊 Total albums in database: ${totalCount}`);

    // Find albums without status
    const needMigration = await albumsCollection.countDocuments({
      $or: [{ status: { $exists: false } }, { status: null }],
    });
    console.log(`🔄 Albums needing migration: ${needMigration}`);

    if (needMigration === 0) {
      console.log("✅ All albums already have status field");
      return;
    }

    // Update albums without status
    const result = await albumsCollection.updateMany(
      {
        $or: [{ status: { $exists: false } }, { status: null }],
      },
      {
        $set: {
          status: "published", // Set all existing albums as published
          updatedAt: new Date(),
        },
      }
    );

    console.log(`✅ Migration completed!`);
    console.log(`📝 Updated ${result.modifiedCount} albums`);

    // Verify
    const remaining = await albumsCollection.countDocuments({
      $or: [{ status: { $exists: false } }, { status: null }],
    });
    console.log(`🔍 Albums still without status: ${remaining}`);
  } catch (error) {
    console.error("❌ Migration failed:", error.message);
  } finally {
    await mongoose.connection.close();
    console.log("📦 Connection closed");
    process.exit(0);
  }
}

// Run migration
migrate();
