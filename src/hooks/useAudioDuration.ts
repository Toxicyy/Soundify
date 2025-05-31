import { useEffect, useRef, useState } from "react";

export const useAudioDuration = (audioUrl: string) => {
  const [duration, setDuration] = useState("");

  function formatTime(seconds: number) {
    const m = Math.floor(seconds / 60);
    const s = Math.floor(seconds % 60);
    return `${m}:${s.toString().padStart(2, "0")}`;
  }

  useEffect(() => {
    const audio = new Audio(audioUrl); // Создаем новый Audio (не привязываем к DOM)
    const handleLoadedMetadata = () => {
      const time = formatTime(audio.duration);
      setDuration(time);
    };

    audio.addEventListener("loadedmetadata", handleLoadedMetadata);
    return () =>
      audio.removeEventListener("loadedmetadata", handleLoadedMetadata);
  }, [audioUrl]);

  return duration;
};
