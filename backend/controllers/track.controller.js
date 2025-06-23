import TrackService from "../services/TrackService.js";
import { ApiResponse } from "../utils/responses.js";
import { catchAsync } from "../utils/helpers.js";
import { generateSignedUrl, extractFileName } from "../utils/b2SignedUrl.js";
import Track from "../models/Track.model.js";

/**
 * Track controller handling HTTP requests for track operations
 * Manages track creation, streaming, search, and metadata operations
 */

/**
 * Create new track with HLS processing
 * All tracks are created with HLS streaming support
 */
export const createTrack = catchAsync(async (req, res) => {
  const track = await TrackService.createTrackWithHLS(
    req.body,
    req.files,
    req.user?.id
  );

  res
    .status(201)
    .json(ApiResponse.success("Track created successfully", track));
});

/**
 * Get paginated list of public tracks
 */
export const getAllTracks = catchAsync(async (req, res) => {
  const { page, limit, sortBy, sortOrder } = req.query;

  const result = await TrackService.getAllTracks({
    page: parseInt(page) || 1,
    limit: parseInt(limit) || 20,
    sortBy: sortBy || "createdAt",
    sortOrder: parseInt(sortOrder) || -1,
  });

  res.json(ApiResponse.success("Tracks retrieved successfully", result));
});

/**
 * Get track metadata by ID
 */
export const getTrackById = catchAsync(async (req, res) => {
  const { id } = req.params;
  const track = await TrackService.getTrackById(id);

  if (!track) {
    return res.status(404).json(ApiResponse.error("Track not found"));
  }

  res.json(ApiResponse.success("Track retrieved successfully", track));
});

/**
 * Universal streaming endpoint for HLS content
 * Handles playlist requests and segment streaming with proper proxying
 */
export const streamTrack = catchAsync(async (req, res) => {
  const { id, segmentName } = req.params;

  const track = await Track.findById(id);
  if (!track) {
    return res.status(404).json(ApiResponse.error("Track not found"));
  }

  try {
    if (segmentName) {
      // Handle HLS segment request
      await handleSegmentRequest(req, res, track, segmentName);
    } else {
      // Handle playlist request
      await handlePlaylistRequest(req, res, track, id);
    }
  } catch (error) {
    res
      .status(500)
      .json(ApiResponse.error(`Streaming error: ${error.message}`));
  }
});

/**
 * Handle HLS segment streaming
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Object} track - Track document
 * @param {string} segmentName - Requested segment filename
 */
const handleSegmentRequest = async (req, res, track, segmentName) => {
  // Find matching segment URL
  const segmentUrl = track.hlsSegments?.find((url) =>
    extractFileName(url).includes(segmentName)
  );

  if (!segmentUrl) {
    return res.status(404).json(ApiResponse.error("Segment not found"));
  }

  // Generate signed URL and proxy the content
  const signedUrl = await generateSignedUrl(extractFileName(segmentUrl), 7200);
  const response = await fetch(signedUrl);

  if (!response.ok) {
    throw new Error(`Failed to fetch segment: ${response.status}`);
  }

  // Set appropriate headers for MPEG-TS segments
  res.set({
    "Content-Type": "video/mp2t",
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "Range",
    "Cache-Control": "public, max-age=31536000", // 1 year cache for segments
  });

  // Stream the segment content
  const buffer = await response.arrayBuffer();
  res.send(Buffer.from(buffer));
};

/**
 * Handle HLS playlist streaming
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Object} track - Track document
 * @param {string} trackId - Track ID
 */
const handlePlaylistRequest = async (req, res, track, trackId) => {
  // Increment listen count for playlist requests
  await Track.findByIdAndUpdate(trackId, { $inc: { listenCount: 1 } });

  // Generate signed URL for playlist
  const playlistUrl = await generateSignedUrl(
    extractFileName(track.audioUrl),
    7200
  );

  const response = await fetch(playlistUrl);
  if (!response.ok) {
    throw new Error(`Failed to fetch playlist: ${response.status}`);
  }

  // Modify playlist to use our server endpoints
  const playlist = await response.text();
  const modifiedPlaylist = updatePlaylistUrls(playlist, req, trackId);

  // Set appropriate headers for M3U8 playlists
  res.set({
    "Content-Type": "application/vnd.apple.mpegurl",
    "Cache-Control": "no-cache, no-store, must-revalidate",
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "Range",
  });

  res.send(modifiedPlaylist);
};

/**
 * Update playlist URLs to point to our streaming endpoints
 * @param {string} playlist - Original M3U8 content
 * @param {Object} req - Express request object
 * @param {string} trackId - Track ID
 * @returns {string} Modified playlist content
 */
const updatePlaylistUrls = (playlist, req, trackId) => {
  const lines = playlist.split("\n");
  const baseUrl = `${req.protocol}://${req.get("host")}/api/tracks/${trackId}`;

  return lines
    .map((line) => {
      if (line.endsWith(".ts")) {
        const segmentName = line.trim();
        return `${baseUrl}/segment/${segmentName}`;
      }
      return line;
    })
    .join("\n");
};

/**
 * Search tracks by query string
 */
export const searchTracks = catchAsync(async (req, res) => {
  const { q, page, limit } = req.query;

  if (!q) {
    return res.status(400).json(ApiResponse.error("Search query is required"));
  }

  const result = await TrackService.searchTracks(q, {
    page: parseInt(page) || 1,
    limit: parseInt(limit) || 20,
  });

  res.json(ApiResponse.success("Search completed successfully", result));
});

/**
 * Increment track listen count
 * Note: This is also handled automatically in playlist requests
 */
export const incrementListenCount = catchAsync(async (req, res) => {
  const { id } = req.params;
  const track = await TrackService.incrementListenCount(id);

  if (!track) {
    return res.status(404).json(ApiResponse.error("Track not found"));
  }

  res.json(ApiResponse.success("Listen count updated", track));
});

/**
 * Delete track (requires ownership)
 */
export const deleteTrack = catchAsync(async (req, res) => {
  const { id } = req.params;
  const result = await TrackService.deleteTrack(id, req.user?.id);

  if (!result) {
    return res
      .status(404)
      .json(ApiResponse.error("Track not found or insufficient permissions"));
  }

  res.json(ApiResponse.success("Track deleted successfully"));
});

/**
 * Update track metadata (requires ownership)
 */
export const updateTrack = catchAsync(async (req, res) => {
  const { id } = req.params;
  const track = await TrackService.updateTrack(id, req.body, req.user?.id);

  if (!track) {
    return res
      .status(404)
      .json(ApiResponse.error("Track not found or insufficient permissions"));
  }

  res.json(ApiResponse.success("Track updated successfully", track));
});
