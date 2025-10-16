import { useEffect, useState } from "react";
import { useFormatTime } from "./useFormatTime";

/**
 * Hook for getting audio duration from URL
 * Creates temporary Audio element to load metadata
 */
export const useAudioDuration = (audioUrl: string) => {
  const [duration, setDuration] = useState("");

  useEffect(() => {
    const audio = new Audio(audioUrl);
    const handleLoadedMetadata = () => {
      const time = useFormatTime(audio.duration);
      setDuration(time);
    };

    audio.addEventListener("loadedmetadata", handleLoadedMetadata);
    return () =>
      audio.removeEventListener("loadedmetadata", handleLoadedMetadata);
  }, [audioUrl]);

  return duration;
};

/**
 * Gets audio duration from File object
 * Returns promise with duration in seconds
 */
export const useAudioDurationFromFile = (file: File): Promise<number> => {
  return new Promise((resolve, reject) => {
    const audio = new Audio();

    audio.addEventListener("loadedmetadata", () => {
      resolve(audio.duration);
    });

    audio.addEventListener("error", () => {
      reject(new Error("Error loading audio file"));
    });

    audio.src = URL.createObjectURL(file);
  });
};
