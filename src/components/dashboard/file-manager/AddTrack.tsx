import { useSelector } from "react-redux";
import type { AppState } from "../../../store";
import { useEffect, useState } from "react";
import { Input, message } from "antd";
import { CoverInput } from "./CoverInput";
import { AudioUpload } from "./AudioUpload";
import TrackLayout from "./TrackLayout";
import { delay, motion } from "framer-motion";

export default function AddTrack() {
  const isMenuOpen = useSelector(
    (state: AppState) => state.dashboardMenu.isOpen
  );
  const [width, setWidth] = useState(0);
  const [coverImage, setCoverImage] = useState<{
    preview: string;
    file: File | null;
  } | null>(null);
  const [audioData, setAudioData] = useState<{
    file: File | null;
    chunks: Blob[];
  }>({ file: null, chunks: [] });
  const [trackData, setTrackData] = useState({
    name: "",
    artist: "",
    cover: null as File | null,
    audio: null as File | null,
  });

  useEffect(() => {
    const updateWidth = () => setWidth(pageWidth());
    updateWidth();
    window.addEventListener("resize", updateWidth);
    return () => window.removeEventListener("resize", updateWidth);
  }, [isMenuOpen]);

  function pageWidth() {
    return (
      (document.documentElement.clientWidth - (isMenuOpen ? 230 : 70)) * 0.4
    );
  }

  const handleFileChange = (file: File | null) => {
    if (!file) {
      setCoverImage(null);
      setTrackData((prev) => ({ ...prev, cover: null }));
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      setCoverImage({
        preview: event.target?.result as string,
        file: file,
      });
      setTrackData((prev) => ({ ...prev, cover: file }));
    };
    reader.readAsDataURL(file);
  };

  const handleAudioChange = (file: File | null, chunks: Blob[]) => {
    setAudioData({ file, chunks });
    setTrackData((prev) => ({ ...prev, audio: file }));
  };

  const removeCover = () => {
    setCoverImage(null);
    setTrackData((prev) => ({ ...prev, cover: null }));
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setTrackData((prev) => ({ ...prev, [name]: value }));
  };

  const uploadChunk = async (
    chunk: Blob,
    chunkNumber: number,
    trackId: string
  ) => {
    const formData = new FormData();
    formData.append("chunk", chunk);
    formData.append("chunkNumber", chunkNumber.toString());
    formData.append("trackId", trackId);
    formData.append("totalChunks", audioData.chunks.length.toString());

    const response = await fetch("/api/upload-chunk", {
      method: "POST",
      body: formData,
    });

    if (!response.ok) throw new Error("Ошибка загрузки чанка");
  };

  const handleSubmit = async () => {
    if (!trackData.name || !trackData.artist) {
      message.error("Заполните название трека и исполнителя");
      return;
    }

    if (!trackData.audio) {
      message.error("Добавьте аудиофайл");
      return;
    }

    try {
      // 1. Создаем запись трека в БД
      const createResponse = await fetch("/api/tracks", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: trackData.name,
          artist: trackData.artist,
          cover: trackData.cover?.name,
        }),
      });

      if (!createResponse.ok) throw new Error("Ошибка создания трека");
      const { trackId } = await createResponse.json();

      // 2. Загружаем обложку
      if (trackData.cover) {
        const coverFormData = new FormData();
        coverFormData.append("cover", trackData.cover);
        coverFormData.append("trackId", trackId);

        await fetch("/api/upload-cover", {
          method: "POST",
          body: coverFormData,
        });
      }

      // 3. Загружаем аудио чанками
      for (let i = 0; i < audioData.chunks.length; i++) {
        await uploadChunk(audioData.chunks[i], i, trackId);
        const progress = Math.round(((i + 1) / audioData.chunks.length) * 100);
        message.info(`Загрузка: ${progress}%`);
      }

      message.success("Трек успешно сохранен");
      setTrackData({
        name: "",
        artist: "",
        cover: null,
        audio: null,
      });
      setCoverImage(null);
      setAudioData({ file: null, chunks: [] });
    } catch (error) {
      message.error("Ошибка при сохранении трека");
      console.error(error);
    }
  };

  return (
    <motion.div
      className="drop-shadow-2xl h-full bg-white rounded-3xl flex"
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
        width: { duration: 0.2 },
        opacity: {delay: 0.2},
      }}
    >
      <div className="py-5 px-5 flex flex-col gap-5 w-full">
        <Input
          placeholder="Track name"
          name="name"
          value={trackData.name}
          onChange={handleInputChange}
        />
        <Input
          placeholder="Artist"
          name="artist"
          value={trackData.artist}
          onChange={handleInputChange}
        />

        <div className="flex justify-between">
          <div className="flex flex-col gap-2">
            <span className="text-sm text-gray-500">Cover</span>
            <CoverInput
              preview={coverImage?.preview || null}
              onFileChange={handleFileChange}
              onRemove={removeCover}
            />
          </div>

          <div className="flex flex-col gap-2">
            <span className="text-sm text-gray-500">Audio</span>
            <AudioUpload onAudioChange={handleAudioChange} />
          </div>
        </div>

        <div className="px-5 py-5 bg-[#F4F4F4] rounded-3xl">
          <TrackLayout
            trackInfo={trackData}
            cover={coverImage?.preview}
            audio={audioData.file ? URL.createObjectURL(audioData.file) : null}
          />
        </div>

        <button
          onClick={handleSubmit}
          className="px-4 py-2 bg-green-500 text-white rounded-md hover:bg-green-600 transition-colors"
        >
          Save Track
        </button>
      </div>
    </motion.div>
  );
}
