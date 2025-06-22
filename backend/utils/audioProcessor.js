import ffmpeg from "fluent-ffmpeg";
import ffmpegPath from "@ffmpeg-installer/ffmpeg";
import path from "path";
import fs from "fs/promises";
import { v4 as uuidv4 } from "uuid";

// Setup FFmpeg path from installed library
const setupFFmpeg = () => {
  try {
    ffmpeg.setFfmpegPath(ffmpegPath.path);
    return true;
  } catch (error) {
    console.error("FFmpeg setup error:", error.message);
    return false;
  }
};

// Initialize ffmpeg on module load
const ffmpegSetupSuccess = setupFFmpeg();

export const processAudioToHLS = async (audioBuffer, originalName) => {
  const tempDir = path.join(process.cwd(), "temp", uuidv4());
  const inputPath = path.join(tempDir, "input.mp3");
  const outputDir = path.join(tempDir, "output");

  try {
    // Check FFmpeg setup before processing
    if (!ffmpegSetupSuccess) {
      throw new Error(
        "FFmpeg was not properly configured during module initialization"
      );
    }

    // Create temporary directories
    await fs.mkdir(tempDir, { recursive: true });
    await fs.mkdir(outputDir, { recursive: true });

    // Save input file
    await fs.writeFile(inputPath, audioBuffer);

    // Analyze input file through ffprobe
    try {
      await new Promise((resolve, reject) => {
        ffmpeg.ffprobe(inputPath, (err, metadata) => {
          if (err) {
            reject(err);
          } else {
            // Calculate expected segments for validation
            const expectedSegments = Math.ceil(metadata.format.duration / 2);
            resolve(metadata);
          }
        });
      });
    } catch (probeError) {
      console.warn("FFprobe unavailable, continuing without analysis");
    }

    // Convert to HLS
    return new Promise((resolve, reject) => {
      const command = ffmpeg(inputPath);

      // Set timeout for operation (5 minutes)
      const timeout = setTimeout(() => {
        command.kill("SIGKILL");
        reject(new Error("Audio processing timeout (5 minutes)"));
      }, 5 * 60 * 1000);

      command
        .audioCodec("aac")
        .audioBitrate("128k")
        .audioChannels(2)
        .audioFrequency(44100)
        .format("hls")
        .outputOptions([
          "-hls_time 2", // 2-second segments
          "-hls_playlist_type vod", // Video On Demand
          "-hls_segment_filename",
          path.join(outputDir, "segment_%03d.ts"),
          "-hls_list_size 0", // Include all segments in playlist
          "-map 0:a", // Explicitly specify audio stream
          "-c:a aac", // Explicitly specify audio codec
          "-b:a 128k", // Explicitly specify bitrate
          "-ar 44100", // Explicitly specify sample rate
          "-ac 2", // Explicitly specify number of channels
          "-movflags +faststart", // Optimize for streaming playback
          "-f hls", // Explicitly specify format
        ])
        .output(path.join(outputDir, "playlist.m3u8"))
        .on("end", async () => {
          clearTimeout(timeout);
          try {
            const files = await fs.readdir(outputDir);
            const segments = files.filter((f) => f.endsWith(".ts"));

            if (segments.length === 0) {
              throw new Error("No .ts segments were created!");
            }

            // Read playlist
            const playlistPath = path.join(outputDir, "playlist.m3u8");
            const playlist = await fs.readFile(playlistPath, "utf8");

            resolve({
              playlist,
              segments: await Promise.all(
                segments.map(async (segment) => ({
                  name: segment,
                  buffer: await fs.readFile(path.join(outputDir, segment)),
                }))
              ),
              tempDir,
            });
          } catch (error) {
            console.error("Error reading HLS results:", error);
            reject(new Error(`Error reading HLS results: ${error.message}`));
          }
        })
        .on("error", (err) => {
          clearTimeout(timeout);
          console.error("FFmpeg error:", err);
          reject(new Error(`FFmpeg error: ${err.message}`));
        })
        .run();
    });
  } catch (error) {
    console.error("General audio processing error:", error);
    // Cleanup on error
    try {
      await fs.rm(tempDir, { recursive: true, force: true });
    } catch (cleanupError) {
      console.error("Error cleaning up temporary files:", cleanupError);
    }
    throw error;
  }
};

// Function to check FFmpeg availability
export const checkFFmpegAvailability = () => {
  return new Promise((resolve, reject) => {
    // First check if path setup was successful
    if (!ffmpegSetupSuccess) {
      reject(new Error("Failed to setup FFmpeg path"));
      return;
    }

    ffmpeg.getAvailableFormats((err, formats) => {
      if (err) {
        console.error("FFmpeg unavailable:", err.message);
        reject(new Error(`FFmpeg unavailable: ${err.message}`));
      } else {
        resolve(true);
      }
    });
  });
};

// Function to get audio file information
export const getAudioInfo = async (audioBuffer) => {
  const tempDir = path.join(process.cwd(), "temp", uuidv4());
  const inputPath = path.join(tempDir, "input_info.mp3");

  try {
    await fs.mkdir(tempDir, { recursive: true });
    await fs.writeFile(inputPath, audioBuffer);

    return new Promise((resolve, reject) => {
      ffmpeg.ffprobe(inputPath, (err, metadata) => {
        if (err) {
          reject(err);
        } else {
          resolve({
            duration: metadata.format.duration,
            bitRate: metadata.format.bit_rate,
            format: metadata.format.format_name,
            streams: metadata.streams,
          });
        }
      });
    });
  } catch (error) {
    throw error;
  } finally {
    // Cleanup temporary files
    try {
      await fs.rm(tempDir, { recursive: true, force: true });
    } catch (cleanupError) {
      console.error("Error cleaning up temporary files:", cleanupError);
    }
  }
};
