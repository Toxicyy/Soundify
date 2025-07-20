import { useState, useEffect } from "react";

// Хук для предзагрузки изображений
export const useImagePreloader = (imageSrcs: string[]) => {
  const [loadedImages, setLoadedImages] = useState<Set<string>>(new Set());
  const [allImagesLoaded, setAllImagesLoaded] = useState(false);

  useEffect(() => {
    if (imageSrcs.length === 0) {
      setAllImagesLoaded(true);
      return;
    }

    // Сброс состояния при изменении списка изображений
    setLoadedImages(new Set());
    setAllImagesLoaded(false);

    // Создаем промисы для загрузки каждого изображения
    const imagePromises = imageSrcs.map((src) => {
      return new Promise<string>((resolve, _) => {
        const img = new Image();

        img.onload = () => {
          setLoadedImages((prev) => new Set([...prev, src]));
          resolve(src);
        };

        img.onerror = () => {
          console.warn(`Ошибка загрузки изображения: ${src}`);
          // Считаем ошибочные изображения загруженными
          setLoadedImages((prev) => new Set([...prev, src]));
          resolve(src);
        };

        img.src = src;
      });
    });

    // Ждем загрузки всех изображений
    Promise.all(imagePromises).then(() => {
      setAllImagesLoaded(true);
    });
  }, [JSON.stringify(imageSrcs)]);

  return {
    loadedImages,
    allImagesLoaded,
    loadingProgress:
      imageSrcs.length > 0 ? (loadedImages.size / imageSrcs.length) * 100 : 100,
  };
};
