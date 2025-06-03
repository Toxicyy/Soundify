import { useDispatch, useSelector } from "react-redux";
import { type AppDispatch, type AppState } from "../../../store";
import { useEffect, useState } from "react";
import { Input, message } from "antd";
import { CoverInput } from "./CoverInput";
import { AudioUpload } from "./AudioUpload";
import TrackLayout from "./TrackLayout";
import { motion } from "framer-motion";
import { addToQueueState } from "../../../state/AudioQueue.slice";

interface TrackData {
  id: number;
  name: string;
  artist: string;
  cover: File | null;
  audio: File | null;
  preview: string | null;
}

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
  const [currentTrack, setCurrentTrack] = useState<TrackData>({
    id: 0,
    name: "",
    artist: "",
    cover: null,
    audio: null,
    preview: null,
  });
  const [audioUploadKey, setAudioUploadKey] = useState(0);
  const [queue, setQueue] = useState<TrackData[]>([]);
  const dispatch = useDispatch<AppDispatch>();

  useEffect(() => {
    const updateWidth = () => setWidth(pageWidth());
    updateWidth();
    window.addEventListener("resize", updateWidth);
    return () => window.removeEventListener("resize", updateWidth);
  }, [isMenuOpen]);

  function pageWidth() {
    return (
      (document.documentElement.clientWidth - (isMenuOpen ? 230 : 70)) * 0.47
    );
  }

  const handleFileChange = (file: File | null) => {
    if (!file) {
      setCoverImage(null);
      setCurrentTrack((prev) => ({ ...prev, cover: null }));
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      setCoverImage({
        preview: event.target?.result as string,
        file: file,
      });
      setCurrentTrack((prev) => ({ ...prev, cover: file }));
    };
    reader.readAsDataURL(file);
  };

  const handleAudioChange = (file: File | null, chunks: Blob[]) => {
    setAudioData({ file, chunks });
    setCurrentTrack((prev) => ({ ...prev, audio: file }));
  };

  const removeCover = () => {
    setCoverImage(null);
    setCurrentTrack((prev) => ({ ...prev, cover: null }));
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setCurrentTrack((prev) => ({ ...prev, [name]: value }));
  };

  const addToQueue = () => {
    if (!currentTrack.name || !currentTrack.artist) {
      message.error("Заполните название трека и исполнителя");
      return;
    }

    if (!currentTrack.audio) {
      message.error("Добавьте аудиофайл");
      return;
    }

    setQueue((prev) => [...prev, currentTrack]);
    currentTrack.id = 0;
    if (coverImage) {
      currentTrack.preview = coverImage.preview;
    } else {
      currentTrack.preview = null;
    }
    dispatch(addToQueueState(currentTrack));
    console.log(currentTrack);

    // Reset form
    setCurrentTrack({
      id: 0,
      name: "",
      artist: "",
      cover: null,
      audio: null,
      preview: null,
    });
    setAudioUploadKey(prev => prev + 1)
    setCoverImage(null);
    setAudioData({ file: null, chunks: [] });

    message.success("Трек добавлен в очередь");
  };

  const removeFromQueue = (index: number) => {
    setQueue((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmitQueue = async () => {
    if (queue.length === 0) {
      message.error("Очередь треков пуста");
      return;
    }

    try {
      const formData = new FormData();

      queue.forEach((track, index) => {
        formData.append(`tracks[${index}][name]`, track.name);
        formData.append(`tracks[${index}][artist]`, track.artist);
        if (track.cover)
          formData.append(`tracks[${index}][cover]`, track.cover);
        if (track.audio)
          formData.append(`tracks[${index}][audio]`, track.audio);
        console.log(formData);
      });

      const response = await fetch("/api/tracks/bulk", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) throw new Error("Ошибка загрузки треков");

      setQueue([]);
      message.success(`Успешно загружено ${queue.length} треков`);
    } catch (error) {
      message.error("Ошибка при загрузке очереди треков");
      console.error(error);
    }
  };

  return (
    <motion.div
      className="drop-shadow-2xl h-full bg-white rounded-3xl flex min-w-[460px]"
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
        <Input
          placeholder="Track name"
          name="name"
          value={currentTrack.name}
          onChange={handleInputChange}
        />
        <Input
          placeholder="Artist"
          name="artist"
          value={currentTrack.artist}
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
            <AudioUpload
              key={audioUploadKey}
              onAudioChange={handleAudioChange}
            />
          </div>
        </div>

        <div className="px-5 py-5 bg-[#F4F4F4] rounded-3xl">
          <TrackLayout
            trackInfo={currentTrack}
            cover={coverImage ? coverImage?.preview : null}
            audio={audioData.file ? URL.createObjectURL(audioData.file) : null}
          />
        </div>

        <div className="flex gap-2">
          <button
            onClick={addToQueue}
            className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors"
          >
            Add to Queue
          </button>

          <button
            onClick={handleSubmitQueue}
            disabled={queue.length === 0}
            className={`px-4 py-2 text-white rounded-md transition-colors ${
              queue.length === 0
                ? "bg-gray-400"
                : "bg-green-500 hover:bg-green-600"
            }`}
          >
            Upload All ({queue.length})
          </button>
        </div>

        {queue.length > 0 && (
          <div className="mt-4">
            <h3 className="font-medium">Queue ({queue.length})</h3>
            <ul className="mt-2 space-y-1 max-h-40 overflow-y-auto">
              {queue.map((track, index) => (
                <li
                  key={index}
                  className="flex justify-between items-center text-sm text-gray-600"
                >
                  <span>
                    {track.name} - {track.artist}
                  </span>
                  <button
                    onClick={() => removeFromQueue(index)}
                    className="text-red-500 hover:text-red-700"
                  >
                    ×
                  </button>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </motion.div>
  );
}
