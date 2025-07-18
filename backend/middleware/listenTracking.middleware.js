import geoip from "geoip-lite";
import { v4 as uuidv4 } from "uuid";
import { ListenEvent } from "../models/ChartModels.js";
import Track from "../models/Track.model.js";
import { ApiResponse } from "../utils/responses.js";
import { catchAsync } from "../utils/helpers.js";

/**
 * Middleware for tracking listen events with IP geolocation
 * Records listen data for chart calculations and analytics
 */

/**
 * Extract client IP address from request
 * Handles various proxy configurations
 */
const getClientIP = (req) => {
  return (
    req.headers["cf-connecting-ip"] || // Cloudflare
    req.headers["x-real-ip"] || // Nginx proxy
    req.headers["x-forwarded-for"]?.split(",")[0] || // Load balancer
    req.connection?.remoteAddress || // Direct connection
    req.socket?.remoteAddress || // Socket connection
    req.ip || // Express default
    "127.0.0.1" // Fallback
  );
};

/**
 * Get country code from IP address
 * Returns 'GLOBAL' if location cannot be determined
 */
const getCountryFromIP = (ip) => {
  try {
    // Skip geolocation for local IPs
    if (
      ip === "127.0.0.1" ||
      ip === "::1" ||
      ip.startsWith("192.168.") ||
      ip.startsWith("10.")
    ) {
      return "GLOBAL";
    }

    const geo = geoip.lookup(ip);
    return geo?.country || "GLOBAL";
  } catch (error) {
    console.warn("Geolocation lookup failed:", error.message);
    return "GLOBAL";
  }
};

/**
 * Generate or extract session ID for anonymous user tracking
 * Uses existing session ID from headers or creates new one
 */
const getSessionId = (req) => {
  // Try to get session ID from various sources
  return (
    req.headers["x-session-id"] || // Custom header
    req.headers["x-request-id"] || // Request tracking
    req.sessionID || // Express session
    `anon_${uuidv4()}` // Generate new
  );
};

/**
 * Middleware to track listen start event
 * Records when user begins playing a track
 */
export const trackListenStart = catchAsync(async (req, res, next) => {
  const { id: trackId } = req.params;

  if (!trackId) {
    return res.status(400).json(ApiResponse.error("Track ID is required"));
  }

  try {
    // Get client information
    const clientIP = getClientIP(req);
    const country = getCountryFromIP(clientIP);
    const sessionId = getSessionId(req);
    const userAgent = req.headers["user-agent"] || "";

    // Store listen start data in request for later use
    req.listenData = {
      trackId,
      userId: req.user?.id || null,
      sessionId,
      country,
      clientIP,
      userAgent,
      startTime: Date.now(),
    };

    // Add listen start time to response headers for client tracking
    res.set("X-Listen-Start", req.listenData.startTime.toString());

    next();
  } catch (error) {
    // Don't fail the request if tracking fails
    console.error("Listen start tracking error:", error);
    next();
  }
});

/**
 * Middleware to record listen completion event
 * Called when user finishes listening or stops track
 */
export const recordListenEvent = catchAsync(async (req, res, next) => {
  const { duration } = req.body; // Listen duration in seconds from client
  const listenData = req.listenData;

  if (!listenData || !duration) {
    return next(); // Skip if no listen data or duration
  }

  try {
    // Get track information for validation
    const track = await Track.findById(listenData.trackId);
    if (!track || !track.chartEligible) {
      return next(); // Skip if track not found or not chart eligible
    }

    // Calculate if listen is valid (30 seconds or 25% of track duration)
    const minListenTime = Math.max(30, track.duration * 0.25);
    const isValid = duration >= minListenTime;

    // Create listen event record
    const listenEvent = new ListenEvent({
      trackId: listenData.trackId,
      userId: listenData.userId,
      sessionId: listenData.sessionId,
      country: listenData.country,
      listenDuration: Math.floor(duration),
      isValid,
      userAgent: listenData.userAgent,
      ipAddress: listenData.clientIP,
      timestamp: new Date(),
    });

    // Save listen event (fire and forget - don't wait)
    listenEvent.save().catch((error) => {
      console.error("Failed to save listen event:", error);
    });

    // Update track counters immediately for real-time stats
    const updateQuery = { $inc: { listenCount: 1 } };
    if (isValid) {
      updateQuery.$inc.validListenCount = 1;
    }

    Track.findByIdAndUpdate(listenData.trackId, updateQuery, {
      new: false,
    }).catch((error) => {
      console.error("Failed to update track counters:", error);
    });

    // Add listen tracking info to response
    res.set({
      "X-Listen-Recorded": "true",
      "X-Listen-Valid": isValid.toString(),
      "X-Listen-Country": listenData.country,
    });

    next();
  } catch (error) {
    console.error("Listen event recording error:", error);
    next(); // Don't fail the request
  }
});

/**
 * Express route handler for dedicated listen tracking endpoint
 * POST /api/tracks/:id/listen
 */
export const handleListenTracking = catchAsync(async (req, res) => {
  const { id: trackId } = req.params;
  const { duration, startTime } = req.body;

  if (!trackId || typeof duration !== "number") {
    return res
      .status(400)
      .json(ApiResponse.error("Track ID and duration are required"));
  }

  if (duration < 0 || duration > 3600) {
    // Max 1 hour listen
    return res.status(400).json(ApiResponse.error("Invalid listen duration"));
  }

  try {
    // Get track information
    const track = await Track.findById(trackId);
    if (!track) {
      return res.status(404).json(ApiResponse.error("Track not found"));
    }

    if (!track.chartEligible) {
      return res.json(
        ApiResponse.success("Listen recorded (not chart eligible)")
      );
    }

    // Get client information
    const clientIP = getClientIP(req);
    const country = getCountryFromIP(clientIP);
    const sessionId = getSessionId(req);
    const userAgent = req.headers["user-agent"] || "";

    // Calculate if listen is valid
    const minListenTime = Math.max(30, track.duration * 0.25);
    const isValid = duration >= minListenTime;

    // Create listen event
    const listenEvent = new ListenEvent({
      trackId,
      userId: req.user?.id || null,
      sessionId,
      country,
      listenDuration: Math.floor(duration),
      isValid,
      userAgent,
      ipAddress: clientIP,
      timestamp: new Date(),
    });

    await listenEvent.save();

    // Update track counters
    const updateQuery = { $inc: { listenCount: 1 } };
    if (isValid) {
      updateQuery.$inc.validListenCount = 1;
    }

    await Track.findByIdAndUpdate(trackId, updateQuery);

    // Return listen tracking result
    res.json(
      ApiResponse.success("Listen recorded successfully", {
        trackId,
        duration: Math.floor(duration),
        isValid,
        country,
        minListenTime,
        chartEligible: track.chartEligible,
      })
    );
  } catch (error) {
    console.error("Listen tracking handler error:", error);
    res.status(500).json(ApiResponse.error("Failed to record listen"));
  }
});

/**
 * Middleware for rate limiting listen events per session
 * Prevents spam/bot attacks on listen counts
 */
const listenRateLimit = new Map();

export const rateLimitListens = (req, res, next) => {
  const sessionId = getSessionId(req);
  const trackId = req.params.id;
  const key = `${sessionId}-${trackId}`;
  const now = Date.now();

  // Clean old entries (older than 1 hour)
  for (const [rateLimitKey, timestamp] of listenRateLimit) {
    if (now - timestamp > 60 * 60 * 1000) {
      listenRateLimit.delete(rateLimitKey);
    }
  }

  // Check if this session already listened to this track recently (within 30 seconds)
  const lastListen = listenRateLimit.get(key);
  if (lastListen && now - lastListen < 30000) {
    return res.status(429).json(ApiResponse.error("Too many listen attempts"));
  }

  // Record this listen attempt
  listenRateLimit.set(key, now);
  next();
};

/**
 * Middleware to extract and validate listen duration from streaming requests
 * Used with HLS streaming endpoints to track actual listen time
 */
export const extractStreamListenTime = (req, res, next) => {
  const originalSend = res.send;
  const startTime = Date.now();

  // Override send to capture when streaming ends
  res.send = function (data) {
    const endTime = Date.now();
    const streamDuration = Math.floor((endTime - startTime) / 1000);

    // Add estimated listen duration to request for potential tracking
    req.estimatedListenDuration = streamDuration;

    // Restore original send function
    res.send = originalSend;
    return originalSend.call(this, data);
  };

  next();
};
