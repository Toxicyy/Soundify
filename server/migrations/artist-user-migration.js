import mongoose from "mongoose";
import User from "../models/User.model.js";
import Artist from "../models/Artist.model.js";
import { fileURLToPath } from "url";
import { dirname } from "path";
import { config } from "../config/config.js";

/**
 * Migration script to add artist profile functionality
 * Adds artistProfile field to User model and owner field to Artist model
 */

// Get MongoDB URI from config or fallback
const MONGODB_URI =
  config.mongoUri ||
  process.env.MONGO_URI

async function runMigration() {
  try {
    console.log("Connecting to MongoDB...");
    await mongoose.connect(MONGODB_URI);
    console.log("Connected to MongoDB for migration");

    console.log("Starting migration: Add Artist Profile Fields");

    // Step 1: Update User schema to add artistProfile field
    console.log("Step 1: Adding artistProfile field to User documents...");

    const userUpdateResult = await mongoose.connection.db
      .collection("users")
      .updateMany(
        { artistProfile: { $exists: false } }, // Only update documents without this field
        { $set: { artistProfile: null } }
      );

    console.log(
      `Updated ${userUpdateResult.modifiedCount} user documents with artistProfile field`
    );

    // Step 2: Update Artist schema to add owner field with random user IDs
    console.log("Step 2: Adding owner field to Artist documents...");

    // Get all existing artists without owner
    const artistsWithoutOwner = await mongoose.connection.db
      .collection("artists")
      .find({ owner: { $exists: false } })
      .toArray();

    // Get all existing users to assign as temporary owners
    const allUsers = await mongoose.connection.db
      .collection("users")
      .find({})
      .toArray();

    if (artistsWithoutOwner.length > 0 && allUsers.length === 0) {
      throw new Error(
        "No users found to assign as temporary owners for existing artists"
      );
    }

    console.log(`Found ${artistsWithoutOwner.length} artists without owner`);
    console.log(`Found ${allUsers.length} users available for assignment`);

    // Assign random users to existing artists
    let assignmentResults = 0;
    const usedUserIds = new Set();

    for (const artist of artistsWithoutOwner) {
      // Find an unused user (each user can own only one artist)
      const availableUsers = allUsers.filter(
        (user) => !usedUserIds.has(user._id.toString())
      );

      if (availableUsers.length === 0) {
        console.warn(
          `No more available users to assign. Remaining artists: ${
            artistsWithoutOwner.length - assignmentResults
          }`
        );
        break;
      }

      // Pick random available user
      const randomUser =
        availableUsers[Math.floor(Math.random() * availableUsers.length)];
      usedUserIds.add(randomUser._id.toString());

      // Update artist with owner
      await mongoose.connection.db
        .collection("artists")
        .updateOne({ _id: artist._id }, { $set: { owner: randomUser._id } });

      // Update user with artistProfile
      await mongoose.connection.db
        .collection("users")
        .updateOne(
          { _id: randomUser._id },
          { $set: { artistProfile: artist._id } }
        );

      assignmentResults++;
      console.log(
        `Assigned artist "${artist.name}" to user "${randomUser.username}"`
      );
    }

    console.log(`Successfully assigned ${assignmentResults} artists to users`);

    if (artistsWithoutOwner.length > assignmentResults) {
      console.warn(
        `Warning: ${
          artistsWithoutOwner.length - assignmentResults
        } artists remain without owners due to insufficient users`
      );
    }

    // Step 3: Create indexes for new fields
    console.log("Step 3: Creating indexes for new fields...");

    try {
      // Create unique index on Artist.owner field (required and unique)
      await mongoose.connection.db.collection("artists").createIndex(
        { owner: 1 },
        {
          unique: true,
          name: "owner_unique",
        }
      );
      console.log("Created unique index on Artist.owner");
    } catch (indexError) {
      console.log("Artist owner index creation:", indexError.message);
    }

    try {
      // Create index on User.artistProfile for faster lookups (unique)
      await mongoose.connection.db.collection("users").createIndex(
        { artistProfile: 1 },
        {
          unique: true,
          sparse: true, // Allows null values but enforces uniqueness for non-null
          name: "artist_profile_unique",
        }
      );
      console.log("Created unique index on User.artistProfile");
    } catch (indexError) {
      console.log("User artistProfile index creation:", indexError.message);
    }

    console.log("Indexes created successfully");

    // Step 4: Validation - show current state
    console.log("Step 4: Migration validation...");

    const totalUsers = await User.countDocuments();
    const usersWithArtistProfile = await User.countDocuments({
      artistProfile: { $ne: null },
    });
    const totalArtists = await Artist.countDocuments();
    const artistsWithOwner = await Artist.countDocuments({
      owner: { $ne: null },
    });

    console.log("Migration Summary:");
    console.log(`- Total users: ${totalUsers}`);
    console.log(`- Users with artist profile: ${usersWithArtistProfile}`);
    console.log(`- Total artists: ${totalArtists}`);
    console.log(`- Artists with owner: ${artistsWithOwner}`);
    console.log(
      `- Orphaned artists (without owner): ${totalArtists - artistsWithOwner}`
    );

    console.log("Migration completed successfully!");
  } catch (error) {
    console.error("Migration failed:", error);
    throw error;
  } finally {
    await mongoose.disconnect();
    console.log("Disconnected from MongoDB");
  }
}

/**
 * Rollback migration - removes the added fields
 * Use with caution in production!
 */
async function rollbackMigration() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log("Connected to MongoDB for rollback");

    console.log("Starting rollback: Remove Artist Profile Fields");

    // Remove artistProfile field from users
    const userRollback = await mongoose.connection.db
      .collection("users")
      .updateMany({}, { $unset: { artistProfile: "" } });

    console.log(
      `Removed artistProfile field from ${userRollback.modifiedCount} user documents`
    );

    // Remove owner field from artists
    const artistRollback = await mongoose.connection.db
      .collection("artists")
      .updateMany({}, { $unset: { owner: "" } });

    console.log(
      `Removed owner field from ${artistRollback.modifiedCount} artist documents`
    );

    // Drop indexes
    try {
      await mongoose.connection.db
        .collection("artists")
        .dropIndex("owner_unique");
      await mongoose.connection.db
        .collection("users")
        .dropIndex("artist_profile_unique");
      console.log("Dropped migration indexes");
    } catch (indexError) {
      console.warn("Some indexes might not exist:", indexError.message);
    }

    console.log("Rollback completed successfully!");
  } catch (error) {
    console.error("Rollback failed:", error);
    throw error;
  } finally {
    await mongoose.disconnect();
  }
}

// Helper function to manually link existing artist to user
async function linkArtistToUser(artistId, userId) {
  try {
    await mongoose.connect(MONGODB_URI);

    const artist = await Artist.findById(artistId);
    const user = await User.findById(userId);

    if (!artist) {
      throw new Error(`Artist with ID ${artistId} not found`);
    }

    if (!user) {
      throw new Error(`User with ID ${userId} not found`);
    }

    if (artist.owner) {
      throw new Error(`Artist ${artist.name} already has an owner`);
    }

    if (user.artistProfile) {
      throw new Error(`User ${user.username} already has an artist profile`);
    }

    // Update both documents
    await Promise.all([
      Artist.findByIdAndUpdate(artistId, { owner: userId }),
      User.findByIdAndUpdate(userId, {
        artistProfile: artistId,
        // Note: status remains unchanged (USER/PREMIUM/ADMIN)
      }),
    ]);

    console.log(
      `Successfully linked artist "${artist.name}" to user "${user.username}"`
    );
  } catch (error) {
    console.error("Linking failed:", error);
    throw error;
  } finally {
    await mongoose.disconnect();
  }
}

// Export functions for use
export { runMigration, rollbackMigration, linkArtistToUser };

// Get current file path
const __filename = fileURLToPath(import.meta.url);

// Run migration if this file is executed directly
if (process.argv[1] === __filename) {
  const command = process.argv[2];

  switch (command) {
    case "migrate":
      runMigration().catch(console.error);
      break;
    case "rollback":
      rollbackMigration().catch(console.error);
      break;
    case "link":
      const artistId = process.argv[3];
      const userId = process.argv[4];
      if (!artistId || !userId) {
        console.error("Usage: node migration.js link <artistId> <userId>");
        process.exit(1);
      }
      linkArtistToUser(artistId, userId).catch(console.error);
      break;
    default:
      console.log("Usage:");
      console.log("  node migration.js migrate   - Run migration");
      console.log("  node migration.js rollback  - Rollback migration");
      console.log(
        "  node migration.js link <artistId> <userId> - Link existing artist to user"
      );
      break;
  }
}
