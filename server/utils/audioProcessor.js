import ffmpeg from "fluent-ffmpeg";
import ffmpegPath from "@ffmpeg-installer/ffmpeg";
import ffprobePath from "@ffprobe-installer/ffprobe";
import path from "path";
import fs from "fs/promises";
import { v4 as uuidv4 } from "uuid";

// FFmpeg configuration
let ffmpegConfigured = false;

const initializeFFmpeg = () => {
  try {
    ffmpeg.setFfmpegPath(ffmpegPath.path);
    ffmpeg.setFfprobePath(ffprobePath.path);
    ffmpegConfigured = true;
    console.log("FFmpeg configured successfully:");
    console.log("FFmpeg path:", ffmpegPath.path);
    console.log("FFprobe path:", ffprobePath.path);
    return true;
  } catch (error) {
    console.error("FFmpeg configuration failed:", error);
    ffmpegConfigured = false;
    return false;
  }
};

initializeFFmpeg();

// Convert audio file to HLS streaming format with 2-second segments
export const processAudioToHLS = async (audioBuffer) => {
  if (!ffmpegConfigured) {
    throw new Error("FFmpeg is not properly configured");
  }

  const workingDir = path.join(process.cwd(), "temp", uuidv4());
  const inputFile = path.join(workingDir, "input.mp3");
  const outputDir = path.join(workingDir, "output");

  try {
    await fs.mkdir(workingDir, { recursive: true });
    await fs.mkdir(outputDir, { recursive: true });
    await fs.writeFile(inputFile, audioBuffer);

    // Validate input before processing
    await validateAudioFile(inputFile);

    const result = await convertToHLS(inputFile, outputDir);

    return {
      ...result,
      tempDir: workingDir,
    };
  } catch (error) {
    await cleanupDirectory(workingDir);
    throw new Error(`Audio processing failed: ${error.message}`);
  }
};

const validateAudioFile = (filePath) => {
  return new Promise((resolve, reject) => {
    ffmpeg.ffprobe(filePath, (err, metadata) => {
      if (err) {
        console.error("FFprobe error:", err);
        reject(new Error(`Invalid audio file: ${err.message}`));
      } else {
        resolve(metadata);
      }
    });
  });
};

// Core HLS conversion with optimized settings for web streaming
const convertToHLS = (inputPath, outputDir) => {
  return new Promise((resolve, reject) => {
    const segmentPattern = path.join(outputDir, "segment_%03d.ts");
    const playlistPath = path.join(outputDir, "playlist.m3u8");

    // 5-minute timeout for large files
    const timeoutId = setTimeout(() => {
      reject(new Error("Processing timeout exceeded"));
    }, 5 * 60 * 1000);

    const command = ffmpeg(inputPath)
      .audioCodec("aac")
      .audioBitrate("128k")
      .audioChannels(2)
      .audioFrequency(44100)
      .format("hls")
      .outputOptions([
        "-hls_time 2", // 2-second segments for optimal streaming
        "-hls_playlist_type vod", // Video On Demand playlist
        "-hls_segment_filename",
        segmentPattern,
        "-hls_list_size 0", // Include all segments
        "-map 0:a", // Map audio stream
        "-movflags +faststart", // Optimize for streaming
        "-f hls",
      ])
      .output(playlistPath)
      .on("start", (commandLine) => {
        console.log("FFmpeg command:", commandLine);
      })
      .on("progress", (progress) => {
        console.log("Processing: " + progress.percent + "% done");
      })
      .on("end", async () => {
        console.log("FFmpeg processing completed");
        clearTimeout(timeoutId);
        try {
          const result = await collectHLSFiles(outputDir);
          resolve(result);
        } catch (error) {
          reject(error);
        }
      })
      .on("error", (err) => {
        console.error("FFmpeg error:", err);
        clearTimeout(timeoutId);
        reject(new Error(`FFmpeg conversion failed: ${err.message}`));
      });

    command.run();
  });
};

const collectHLSFiles = async (outputDir) => {
  const files = await fs.readdir(outputDir);
  const segments = files.filter((file) => file.endsWith(".ts"));

  if (segments.length === 0) {
    throw new Error("No HLS segments were generated");
  }

  const playlistPath = path.join(outputDir, "playlist.m3u8");
  const playlist = await fs.readFile(playlistPath, "utf8");

  const segmentData = await Promise.all(
    segments.map(async (filename) => ({
      name: filename,
      buffer: await fs.readFile(path.join(outputDir, filename)),
    }))
  );

  return {
    playlist,
    segments: segmentData,
  };
};

const cleanupDirectory = async (dirPath) => {
  try {
    await fs.rm(dirPath, { recursive: true, force: true });
  } catch (error) {
    console.error("Cleanup error:", error);
    // Silent cleanup failure
  }
};

export const checkFFmpegAvailability = () => {
  return new Promise((resolve, reject) => {
    if (!ffmpegConfigured) {
      reject(new Error("FFmpeg path not configured"));
      return;
    }

    ffmpeg.getAvailableFormats((err) => {
      if (err) {
        console.error("FFmpeg formats check failed:", err);
        reject(new Error(`FFmpeg unavailable: ${err.message}`));
      } else {
        resolve(true);
      }
    });
  });
};

export const getAudioInfo = async (audioBuffer) => {
  const tempDir = path.join(process.cwd(), "temp", uuidv4());
  const tempFile = path.join(tempDir, "temp_audio.mp3");

  try {
    await fs.mkdir(tempDir, { recursive: true });
    await fs.writeFile(tempFile, audioBuffer);

    const metadata = await validateAudioFile(tempFile);

    return {
      duration: metadata.format.duration,
      bitRate: metadata.format.bit_rate,
      format: metadata.format.format_name,
      streams: metadata.streams,
    };
  } finally {
    await cleanupDirectory(tempDir);
  }
};
