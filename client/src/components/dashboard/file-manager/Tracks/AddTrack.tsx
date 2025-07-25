import { useDispatch, useSelector } from "react-redux";
import { type AppDispatch, type AppState } from "../../../../store";
import { useEffect, useState } from "react";
import { Input, message } from "antd";
import { CoverInput } from "./CoverInput";
import { AudioUpload } from "./AudioUpload";
import TrackLayout from "./TrackLayout";
import { motion } from "framer-motion";
import { addToQueueState } from "../../../../state/AudioQueue.slice";
import GenreSelect from "./GenreSelect";
import type { Artist } from "../../../../types/ArtistData";

import type { TrackData } from "../../../../types/TrackData";
import SelectArtist from "./SelectArtist";
import { useAudioDurationFromFile } from "../../../../hooks/useAudioDuration";
import SelectAlbum from "./SelectAlbum";
import { current } from "@reduxjs/toolkit";

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
    id: "",
    name: "",
    artist: { _id: "", name: "" },
    cover: null,
    audio: null,
    album: "single",
    preview: null,
    duration: 0,
    genre: null,
    tags: null,
  });
  const [audioUploadKey, setAudioUploadKey] = useState(0);
  const [artistResetKey, setArtistResetKey] = useState(0);
  const [inputErrors, setInputErrors] = useState<{
    name: boolean;
    artist: boolean;
    cover: boolean;
    audio: boolean;
  }>({
    name: false,
    artist: false,
    cover: false,
    audio: false,
  });

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
    setInputErrors((prev) => ({ ...prev, cover: false }));
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
    setInputErrors((prev) => ({ ...prev, audio: false }));
    setAudioData({ file, chunks });
    setCurrentTrack((prev) => ({ ...prev, audio: file }));
  };

  const handleAlbumSelect = (album: { _id: string; name: string }) => {
    setCurrentTrack((prev) => ({ ...prev, album: album }));
  };
  const removeCover = () => {
    setCoverImage(null);
    setCurrentTrack((prev) => ({ ...prev, cover: null }));
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setInputErrors((prev) => ({ ...prev, [name]: false }));
    setCurrentTrack((prev) => ({ ...prev, [name]: value }));
  };

  const handleGenreSelect = (genre: string) => {
    setCurrentTrack((prev) => ({ ...prev, genre: genre }));
  };

  const addToQueue = async () => {
    if (
      !currentTrack.name ||
      !currentTrack.artist._id ||
      !currentTrack.audio ||
      !currentTrack.cover
    ) {
      setInputErrors((prev) => ({
        ...prev,
        name: !currentTrack.name,
        artist: !currentTrack.artist._id,
        audio: !currentTrack.audio,
        cover: !currentTrack.cover,
      }));
      return;
    }

    currentTrack.id = "";
    try {
      currentTrack.duration = Math.floor(
        await useAudioDurationFromFile(currentTrack.audio!)
      );
    } catch (error) {
      console.error("Ошибка получения длительности аудио:", error);
    }
    if (coverImage) {
      currentTrack.preview = coverImage.preview;
    } else {
      currentTrack.preview = null;
    }
    dispatch(addToQueueState(currentTrack));

    // Reset form
    setCurrentTrack({
      id: "",
      name: "",
      artist: { _id: "", name: "" },
      cover: null,
      audio: null,
      album: "single",
      preview: null,
      duration: 0,
      genre: null,
      tags: null,
    });
    setAudioUploadKey((prev) => prev + 1);
    setArtistResetKey((prev) => prev + 1);
    setCoverImage(null);
    setAudioData({ file: null, chunks: [] });

    message.success("Трек добавлен в очередь");
  };

  const handleArtistSelect = (artist: Artist) => {
    setCurrentTrack((prev) => ({ ...prev, artist: artist }));
    setInputErrors((prev) => ({ ...prev, artist: false }));
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
          status={!inputErrors.name ? "" : "error"}
        />
        <SelectArtist
          onSelect={handleArtistSelect}
          placeholder="Find and choose artist..."
          status={!inputErrors.artist ? "" : "error"}
          key={artistResetKey}
        />
        <div className="flex justify-between">
          <div className="flex flex-col gap-2">
            <span className="text-sm text-gray-500">Cover</span>
            <CoverInput
              preview={coverImage?.preview || null}
              onFileChange={handleFileChange}
              onRemove={removeCover}
              isAdded={!inputErrors.cover}
            />
          </div>

          <div className="flex flex-col gap-2">
            <span className="text-sm text-gray-500">Audio</span>
            <AudioUpload
              key={audioUploadKey}
              onAudioChange={handleAudioChange}
              isAdded={!inputErrors.audio}
            />
          </div>
        </div>
        <div>
          <span className="text-sm text-gray-500">Genre</span>
          <GenreSelect
            value={currentTrack.genre}
            onChange={handleGenreSelect}
          />
        </div>
        <div>
          <span className="text-sm text-gray-500">Album</span>
          <SelectAlbum
            onSelect={handleAlbumSelect}
            artist={currentTrack?.artist}
          />
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
        </div>
      </div>
    </motion.div>
  );
}
