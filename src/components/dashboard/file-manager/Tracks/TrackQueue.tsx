import { useEffect, useState } from "react";
import { type AppDispatch, type AppState } from "../../../../store";
import { useDispatch, useSelector } from "react-redux";
import { motion } from "framer-motion";
import TrackLayout from "./TrackLayout";
import { clearQueue } from "../../../../state/AudioQueue.slice";

export default function TrackQueue() {
  const isMenuOpen = useSelector(
    (state: AppState) => state.dashboardMenu.isOpen
  );
  const trackQueue = useSelector((state: AppState) => state.audioQueue.queue);
  const [width, setWidth] = useState(0);
  const queueLength = trackQueue.length;
  const dispatch = useDispatch<AppDispatch>();
  const [fetching, setFetching] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [currentUpload, setCurrentUpload] = useState<string>("");
  const [currentTrackProgress, setCurrentTrackProgress] = useState(0);

  useEffect(() => {
    const updateWidth = () => setWidth(pageWidth());
    updateWidth();
    window.addEventListener("resize", updateWidth);
    return () => window.removeEventListener("resize", updateWidth);
  }, [isMenuOpen]);

  useEffect(() => {
    console.log(trackQueue)
  }, [trackQueue]);

  function pageWidth() {
    return (
      (document.documentElement.clientWidth - (isMenuOpen ? 230 : 70)) * 0.47
    );
  }

  const uploadSingleTrack = async (track: any, index: number): Promise<any> => {
    return new Promise((resolve, reject) => {
      const formData = new FormData();

      // Основные поля
      formData.append("name", track.name);
      formData.append("artist", track.artist._id);
      formData.append("album", track.album?._id || "single"); // Привязка к альбому
      formData.append("audio", track.audio);
      formData.append("cover", track.cover);
      formData.append("duration", track.duration.toString());
      formData.append("genre", track.genre || "");
      formData.append("tags", track.tags ? track.tags.join(",") : "");

      setCurrentUpload(`${track.name} (${index + 1}/${trackQueue.length})`);
      setCurrentTrackProgress(0);

      // Вычисляем размеры файлов для правильного расчета прогресса
      const audioSize = track.audio?.size || 0;
      const coverSize = track.cover?.size || 0;
      const totalSize = audioSize + coverSize;

      const xhr = new XMLHttpRequest();
      let uploadPhase = "uploading"; // 'uploading' -> 'processing'

      // Отслеживание прогресса загрузки
      xhr.upload.addEventListener("progress", (event) => {
        if (event.lengthComputable) {
          const uploadPercentComplete = (event.loaded / event.total) * 100;

          // Искусственное замедление для демонстрации прогресса
          const simulatedProgress = Math.min(uploadPercentComplete, 90); // Не больше 90% до завершения

          // Учитываем, что после загрузки еще идет HLS конвертация
          // Загрузка = 70% от общего прогресса, конвертация = 30%
          const adjustedProgress = simulatedProgress * 0.7;

          console.log(`📈 [DEBUG] Progress update:`, {
            realUploadPercent: uploadPercentComplete.toFixed(2),
            simulatedProgress: simulatedProgress.toFixed(2),
            adjustedProgress: adjustedProgress.toFixed(2),
            trackIndex: index,
            totalTracks: trackQueue.length,
          });

          setCurrentTrackProgress(adjustedProgress);

          // Обновляем общий прогресс с учетом текущего трека
          const baseProgress = (index / trackQueue.length) * 100;
          const currentTrackWeight = (1 / trackQueue.length) * 100;
          const totalProgress =
            baseProgress + (adjustedProgress / 100) * currentTrackWeight;

          console.log(`📊 [DEBUG] Total progress calculation:`, {
            baseProgress: baseProgress.toFixed(2),
            currentTrackWeight: currentTrackWeight.toFixed(2),
            totalProgress: totalProgress.toFixed(2),
          });

          setUploadProgress(totalProgress);

          // Обновляем фазу только при реальном завершении загрузки
          if (uploadPercentComplete >= 100 && uploadPhase === "uploading") {
            uploadPhase = "processing";
            setCurrentUpload(
              `Converting ${track.name} to HLS... (${index + 1}/${
                trackQueue.length
              })`
            );
            console.log(
              `🎬 [DEBUG] Switching to processing phase for ${track.name}`
            );

            // Плавно доводим до 70% (конец фазы загрузки)
            let currentProgress = adjustedProgress;
            const targetProgress = 70;
            const progressInterval = setInterval(() => {
              currentProgress = Math.min(currentProgress + 2, targetProgress);
              setCurrentTrackProgress(currentProgress);

              if (currentProgress >= targetProgress) {
                clearInterval(progressInterval);
              }
            }, 100);
          }
        } else {
          console.warn(`⚠️ [DEBUG] Progress event not computable`);
        }
      });

      xhr.onloadstart = () => {
        console.log(`🚀 [DEBUG] Upload started for ${track.name}`);
      };

      xhr.onload = function () {
        console.log(
          `✅ [DEBUG] Upload completed for ${track.name}, status: ${xhr.status}`
        );

        if (xhr.status >= 200 && xhr.status < 300) {
          try {
            const response = JSON.parse(xhr.responseText);

            // Показываем завершение конвертации
            setCurrentTrackProgress(100);
            setCurrentUpload(
              `✅ Completed ${track.name} (${index + 1}/${trackQueue.length})`
            );

            console.log(`🎉 [DEBUG] Track ${track.name} fully completed`);

            // Небольшая задержка для визуального эффекта
            setTimeout(() => {
              // Возвращаем response с trackId и информацией об альбоме
              resolve({
                ...response,
                trackId: response.data._id, // ID созданного трека
                albumId: track.album?._id, // ID альбома для добавления
              });
            }, 500);
          } catch (error) {
            console.error(
              `❌ [DEBUG] JSON parse error for ${track.name}:`,
              error
            );
            reject(new Error("Invalid JSON response"));
          }
        } else {
          try {
            const errorData = JSON.parse(xhr.responseText);
            console.error(
              `❌ [DEBUG] Server error for ${track.name}:`,
              errorData
            );
            reject(new Error(errorData.message || "Upload failed"));
          } catch {
            console.error(
              `❌ [DEBUG] HTTP error for ${track.name}: ${xhr.status}`
            );
            reject(new Error(`HTTP Error: ${xhr.status}`));
          }
        }
      };

      xhr.onerror = function () {
        console.error(`❌ [DEBUG] Network error for ${track.name}`);
        reject(new Error("Network error occurred"));
      };

      xhr.ontimeout = function () {
        console.error(`❌ [DEBUG] Timeout for ${track.name}`);
        reject(
          new Error(
            "Upload timeout - file might be too large or conversion is taking too long"
          )
        );
      };

      // Симуляция прогресса конвертации после загрузки
      xhr.addEventListener("loadend", () => {
        console.log(`🏁 [DEBUG] Load end event for ${track.name}`);
        if (xhr.status >= 200 && xhr.status < 300) {
          // Плавная анимация прогресса конвертации от 70% до 95%
          let conversionProgress = 70;
          const conversionInterval = setInterval(() => {
            // Более медленное и плавное увеличение
            conversionProgress += Math.random() * 1.5 + 0.5; // От 0.5% до 2% за раз
            if (conversionProgress >= 95) {
              conversionProgress = 95; // останавливаемся на 95%, ждем реального завершения
              clearInterval(conversionInterval);
            }
            console.log(
              `🎬 [DEBUG] Simulated conversion progress: ${conversionProgress.toFixed(
                2
              )}%`
            );
            setCurrentTrackProgress(conversionProgress);

            // Обновляем общий прогресс тоже
            const baseProgress = (index / trackQueue.length) * 100;
            const currentTrackWeight = (1 / trackQueue.length) * 100;
            const totalProgress =
              baseProgress + (conversionProgress / 100) * currentTrackWeight;
            setUploadProgress(totalProgress);
          }, 500); // Обновляем каждые 500ms для более плавной анимации
        }
      });

      // Настройка запроса
      xhr.open("POST", "http://localhost:5000/api/tracks");
      xhr.setRequestHeader(
        "Authorization",
        `Bearer ${localStorage.getItem("token")}`
      );

      // Увеличиваем таймаут для больших файлов и HLS конвертации
      xhr.timeout = 15 * 60 * 1000; // 15 минут

      console.log(
        `📤 [DEBUG] Starting upload for ${track.name}, formData size: ${totalSize} bytes`
      );
      xhr.send(formData);
    });
  };

  // Функция для добавления треков в альбомы (обновление массива tracks в альбоме)
  const addTracksToAlbums = async (trackResults: any[]) => {
    // Группируем треки по альбомам
    const albumGroups = trackResults.reduce((groups, result) => {
      if (result.albumId && result.trackId) {
        if (!groups[result.albumId]) {
          groups[result.albumId] = [];
        }
        groups[result.albumId].push(result.trackId);
      }
      return groups;
    }, {} as Record<string, string[]>);

    // Добавляем треки в каждый альбом через $push операцию
    const albumPromises = Object.entries(albumGroups).map(
      async ([albumId, trackIds]) => {
        try {
          // Сначала получаем текущие треки альбома
          const albumResponse = await fetch(
            `http://localhost:5000/api/albums/${albumId}`,
            {
              headers: {
                Authorization: `Bearer ${localStorage.getItem("token")}`,
              },
            }
          );

          if (!albumResponse.ok) {
            throw new Error(
              `Failed to fetch album ${albumId}: ${albumResponse.status}`
            );
          }

          const albumData = await albumResponse.json();
          const currentTracks = Array.isArray(albumData.data?.tracks)
            ? albumData.data.tracks
            : [];

          // Проверяем, что trackIds - это массив
          const safeTrackIds = Array.isArray(trackIds) ? trackIds : [];

          // Объединяем существующие треки с новыми (только уникальные ID)
          const existingTrackIds = currentTracks.map((track: any) =>
            typeof track === "string" ? track : track._id || track.id
          );
          const newTrackIds = safeTrackIds.filter(
            (id: string) => !existingTrackIds.includes(id)
          );
          const updatedTracks = [...existingTrackIds, ...newTrackIds];

          const response = await fetch(
            `http://localhost:5000/api/albums/${albumId}`,
            {
              method: "PUT",
              headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${localStorage.getItem("token")}`,
              },
              body: JSON.stringify({
                tracks: updatedTracks, // Отправляем полный обновленный массив
              }),
            }
          );

          if (!response.ok) {
            throw new Error(
              `Failed to update album ${albumId}: ${response.status}`
            );
          }

          const data = await response.json();
          console.log(
            `✅ [DEBUG] Successfully added tracks to album ${albumId}`,
            data
          );
          return { albumId, success: true, trackIds };
        } catch (error) {
          console.error(
            `❌ [DEBUG] Failed to add tracks to album ${albumId}:`,
            error
          );
          return { albumId, success: false, error: error, trackIds };
        }
      }
    );

    return Promise.all(albumPromises);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    let successCount = 0;
    let errorCount = 0;
    const errors: string[] = [];
    const trackResults: any[] = []; // Для хранения результатов загрузки

    setFetching(true);
    setUploadProgress(0);
    setCurrentTrackProgress(0);

    // Фаза 1: Загрузка треков
    for (let i = 0; i < trackQueue.length; i++) {
      const track = trackQueue[i];

      // Валидация данных
      if (!track.audio || !track.cover) {
        console.error("Missing audio or cover file for track:", track.name);
        errorCount++;
        errors.push(`${track.name}: Missing audio or cover file`);
        continue;
      }

      if (!track.artist?._id) {
        console.error("Missing artist for track:", track.name);
        errorCount++;
        errors.push(`${track.name}: Missing artist`);
        continue;
      }

      try {
        console.log(
          `Uploading track ${i + 1}/${trackQueue.length}:`,
          track.name
        );

        const result = await uploadSingleTrack(track, i);
        trackResults.push(result);

        console.log("Track uploaded successfully:", result);
        successCount++;

        // Устанавливаем прогресс для завершенного трека
        setUploadProgress(((i + 1) / trackQueue.length) * 90); // 90% для загрузки треков
        setCurrentTrackProgress(0);
      } catch (err: any) {
        console.error("Upload error:", err);
        errorCount++;
        errors.push(`${track.name}: ${err.message}`);

        // Даже при ошибке обновляем прогресс
        setUploadProgress(((i + 1) / trackQueue.length) * 90);
        setCurrentTrackProgress(0);
      }

      // Небольшая пауза между загрузками
      if (i < trackQueue.length - 1) {
        await new Promise((resolve) => setTimeout(resolve, 500));
      }
    }

    // Фаза 2: Добавление треков в альбомы (обновление массива tracks)
    if (trackResults.length > 0) {
      setCurrentUpload("Updating album track lists...");
      setCurrentTrackProgress(0);

      try {
        const albumResults = await addTracksToAlbums(trackResults);

        // Подсчет успешных и неуспешных операций с альбомами
        const successfulAlbums = albumResults.filter((r) => r.success).length;
        const failedAlbums = albumResults.filter((r) => !r.success).length;

        console.log(
          `📀 [DEBUG] Album track list updates completed: ${successfulAlbums} successful, ${failedAlbums} failed`
        );

        if (failedAlbums > 0) {
          const albumErrors = albumResults
            .filter((r) => !r.success)
            .map((r) => `Album ${r.albumId}: ${r.error}`)
            .join(", ");
          errors.push(`Album track list update errors: ${albumErrors}`);
        }

        setUploadProgress(100);
        setCurrentTrackProgress(100);
      } catch (error) {
        console.error("❌ [DEBUG] Error updating album track lists:", error);
        errors.push(`Album track list update failed: ${error}`);
      }
    }

    setFetching(false);
    setCurrentUpload("");
    setUploadProgress(0);
    setCurrentTrackProgress(0);

    // Показать результат загрузки
    if (successCount > 0) {
      console.log(`✅ Successfully uploaded ${successCount} tracks`);
      dispatch(clearQueue());
    }

    if (errorCount > 0) {
      console.error(`❌ Failed to upload ${errorCount} tracks:`, errors);
    }

    // Итоговое уведомление
    if (successCount > 0 && errorCount === 0) {
      alert(
        `🎉 All ${successCount} tracks uploaded successfully and linked to albums!`
      );
    } else if (successCount > 0 && errorCount > 0) {
      alert(
        `⚠️ Uploaded ${successCount} tracks, but encountered ${errorCount} errors. Check console for details.`
      );
    } else {
      alert(`❌ All uploads failed. Check console for details.`);
    }
  };

  return (
    <motion.div
      className="drop-shadow-2xl h-full bg-white rounded-3xl min-w-[460px]"
      style={{ width: `${width}px` }}
      initial={{ opacity: 0, y: 300, width: 0 }}
      animate={{
        opacity: 1,
        y: 0,
        width: width,
      }}
      transition={{
        duration: 0.5,
        ease: "easeOut",
        width: { duration: 0.3 },
        opacity: { delay: 0.2 },
      }}
    >
      <div className="py-5 px-5 flex flex-col gap-5 w-full">
        <div className="flex justify-between items-center">
          <h1>Your Queue ({queueLength})</h1>
          {queueLength > 0 && (
            <span className="text-sm text-gray-500">
              Will be converted to HLS streaming format
            </span>
          )}
        </div>

        {/* Прогресс загрузки */}
        {fetching && (
          <div className="bg-gray-100 rounded-lg p-4 space-y-3">
            {/* Общий прогресс */}
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium">Overall Progress</span>
              <span className="text-sm text-gray-600">
                {Math.round(uploadProgress)}%
              </span>
            </div>

            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                style={{ width: `${uploadProgress}%` }}
              ></div>
            </div>

            {/* Прогресс текущего трека */}
            {currentUpload && (
              <>
                <div className="flex justify-between items-center">
                  <span className="text-xs font-medium text-gray-700">
                    Current Track
                  </span>
                  <span className="text-xs text-gray-600">
                    {Math.round(currentTrackProgress)}%
                  </span>
                </div>

                <div className="w-full bg-gray-200 rounded-full h-1.5">
                  <div
                    className="bg-green-500 h-1.5 rounded-full transition-all duration-300"
                    style={{ width: `${currentTrackProgress}%` }}
                  ></div>
                </div>

                <p className="text-xs text-gray-600">
                  {currentTrackProgress < 70
                    ? "📤 Uploading"
                    : currentTrackProgress < 100
                    ? "🎬 Converting to HLS"
                    : "✅ Completed"}
                  : {currentUpload.replace(/^(✅ |🎬 |📤 )/, "")}
                </p>
              </>
            )}

            <div className="flex items-center gap-2 text-xs text-orange-600">
              <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-orange-600"></div>
              <span>
                {currentTrackProgress < 70
                  ? "Uploading files to server..."
                  : "Converting to HLS format (this may take a few minutes)..."}
              </span>
            </div>
          </div>
        )}

        {/* Список треков */}
        <div className="space-y-3 max-h-96 overflow-y-auto">
          {trackQueue.map((track) => (
            <TrackLayout
              key={track.id}
              trackInfo={track}
              audio={URL.createObjectURL(
                track.audio ? track.audio : new Blob()
              )}
              cover={track.preview}
            />
          ))}
        </div>
      </div>

      {/* Кнопка загрузки */}
      <div className="px-5 pb-4">
        <button
          disabled={queueLength === 0 || fetching}
          className={`w-full px-4 py-3 text-white rounded-md transition-all duration-200 font-medium ${
            queueLength === 0 || fetching
              ? "bg-gray-400 cursor-not-allowed"
              : "bg-green-500 hover:bg-green-600 hover:shadow-lg"
          }`}
          onClick={handleSubmit}
        >
          {fetching ? (
            <div className="flex items-center justify-center gap-2">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
              Processing HLS Conversion...
            </div>
          ) : (
            `Upload All as HLS (${queueLength})`
          )}
        </button>

        {queueLength > 0 && !fetching && (
          <p className="text-xs text-gray-500 mt-2 text-center">
            Tracks will be automatically converted to streaming format for
            better performance
          </p>
        )}

        {fetching && (
          <div className="mt-2 text-center">
            <p className="text-xs text-gray-600">
              ⚠️ Please don't close this page during upload
            </p>
            <p className="text-xs text-gray-500">
              Large files may take several minutes to process
            </p>
          </div>
        )}
      </div>
    </motion.div>
  );
}
