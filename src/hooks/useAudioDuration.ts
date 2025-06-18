import { useEffect, useState } from "react";
import { useFormatTime } from "./useFormatTime";

export const useAudioDuration = (audioUrl: string) => {
  const [duration, setDuration] = useState("");

  useEffect(() => {
    const audio = new Audio(audioUrl); // Создаем новый Audio (не привязываем к DOM)
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

export const useAudioDurationFromFile = (file: File): Promise<number> => {
  return new Promise((resolve, reject) => {
    const audio = new Audio();
    
    audio.addEventListener('loadedmetadata', () => {
      resolve(audio.duration);
    });
    
    audio.addEventListener('error', () => {
      reject(new Error('Ошибка загрузки аудио файла'));
    });
    
    audio.src = URL.createObjectURL(file);
  });
};