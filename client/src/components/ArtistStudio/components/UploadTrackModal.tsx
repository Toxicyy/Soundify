import { useState, useRef } from "react";
import { Modal, Input, Select } from "antd";
import {
  CloseOutlined,
  UploadOutlined,
  DeleteOutlined,
  PlayCircleOutlined,
} from "@ant-design/icons";
import styled from "styled-components";
import { motion, AnimatePresence } from "framer-motion";
import { useNotification } from "../../../hooks/useNotification";

interface Artist {
  _id: string;
  name: string;
  avatar?: string;
}

interface UploadTrackModalProps {
  isOpen: boolean;
  onClose: () => void;
  artist: Artist;
}

const StyledInput = styled(Input)`
  &.ant-input {
    background-color: rgba(255, 255, 255, 0.1) !important;
    color: white !important;
    border: 1px solid rgba(255, 255, 255, 0.2) !important;
    border-radius: 8px;

    &::placeholder {
      color: rgba(255, 255, 255, 0.6) !important;
      opacity: 1 !important;
    }

    &:focus {
      border-color: #1db954 !important;
      box-shadow: 0 0 0 2px rgba(29, 185, 84, 0.2) !important;
      background-color: rgba(255, 255, 255, 0.15) !important;
    }

    &:hover {
      background-color: rgba(255, 255, 255, 0.12) !important;
      border-color: rgba(255, 255, 255, 0.3) !important;
    }
  }
`;

const StyledSelect = styled(Select<string>)`
  .ant-select-selector {
    background-color: rgba(255, 255, 255, 0.1) !important;
    color: white !important;
    border: 1px solid rgba(255, 255, 255, 0.2) !important;
    border-radius: 8px !important;
  }

  .ant-select-selection-search-input {
    color: white !important;
  }

  .ant-select-selection-placeholder {
    color: rgba(255, 255, 255, 0.6) !important;
  }

  .ant-select-selection-item {
    color: white !important;
  }

  &.ant-select-focused .ant-select-selector {
    border-color: #1db954 !important;
    box-shadow: 0 0 0 2px rgba(29, 185, 84, 0.2) !important;
    background-color: rgba(255, 255, 255, 0.15) !important;
  }

  &:hover .ant-select-selector {
    background-color: rgba(255, 255, 255, 0.12) !important;
    border-color: rgba(255, 255, 255, 0.3) !important;
  }
`;

const StyledMultiSelect = styled(Select<string[]>)`
  .ant-select-selector {
    background-color: rgba(255, 255, 255, 0.1) !important;
    color: white !important;
    border: 1px solid rgba(255, 255, 255, 0.2) !important;
    border-radius: 8px !important;
  }

  .ant-select-selection-search-input {
    color: white !important;
  }

  .ant-select-selection-placeholder {
    color: rgba(255, 255, 255, 0.6) !important;
  }

  .ant-select-selection-item {
    color: white !important;
    background-color: rgba(29, 185, 84, 0.8) !important;
    border: 1px solid rgba(29, 185, 84, 0.4) !important;
    border-radius: 4px !important;
  }

  .ant-select-selection-item-remove {
    color: rgba(255, 255, 255, 0.8) !important;

    &:hover {
      color: white !important;
    }
  }

  &.ant-select-focused .ant-select-selector {
    border-color: #1db954 !important;
    box-shadow: 0 0 0 2px rgba(29, 185, 84, 0.2) !important;
    background-color: rgba(255, 255, 255, 0.15) !important;
  }

  &:hover .ant-select-selector {
    background-color: rgba(255, 255, 255, 0.12) !important;
    border-color: rgba(255, 255, 255, 0.3) !important;
  }
`;

// Жанры и теги
const genres = [
  "Pop",
  "Rock",
  "Hip Hop",
  "R&B",
  "Jazz",
  "Classical",
  "Electronic",
  "Dance",
  "Country",
  "Alternative",
  "Indie",
  "Metal",
  "Folk",
  "Blues",
  "Reggae",
  "Punk",
  "Soul",
  "Funk",
  "Disco",
  "House",
  "Techno",
  "Dubstep",
  "Trap",
  "Latin",
  "K-Pop",
  "Afrobeat",
  "Gospel",
  "Ambient",
  "Experimental",
  "World",
];

const predefinedTags = [
  // Настроение
  "Energetic",
  "Chill",
  "Sad",
  "Happy",
  "Aggressive",
  "Romantic",
  "Melancholic",
  "Uplifting",
  // Активность
  "Workout",
  "Study",
  "Party",
  "Sleep",
  "Drive",
  "Focus",
  "Dance",
  "Relax",
  // Время
  "Morning",
  "Night",
  "Summer",
  "Winter",
  "Weekend",
  "Holiday",
  // Стиль
  "Acoustic",
  "Electric",
  "Instrumental",
  "Vocal",
  "Live",
  "Studio",
  "Remix",
  "Cover",
  // Темп
  "Fast",
  "Medium",
  "Slow",
  "Upbeat",
  "Downtempo",
];

interface TrackData {
  name: string;
  genre: string;
  tags: string[];
  audioFile: File | null;
  coverFile: File | null;
}

const UploadTrackModal: React.FC<UploadTrackModalProps> = ({
  isOpen,
  onClose,
  artist,
}) => {
  const { showSuccess, showError } = useNotification();

  const [trackData, setTrackData] = useState<TrackData>({
    name: "",
    genre: "",
    tags: [],
    audioFile: null,
    coverFile: null,
  });

  const [audioPreview, setAudioPreview] = useState<string | null>(null);
  const [coverPreview, setCoverPreview] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  const audioInputRef = useRef<HTMLInputElement>(null);
  const coverInputRef = useRef<HTMLInputElement>(null);

  const resetForm = () => {
    setTrackData({
      name: "",
      genre: "",
      tags: [],
      audioFile: null,
      coverFile: null,
    });
    setAudioPreview(null);
    setCoverPreview(null);
    setUploadProgress(0);
  };

  const handleClose = () => {
    if (!isUploading) {
      resetForm();
      onClose();
    }
  };

  const handleAudioChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.match("audio.*")) {
      showError("Please select a valid audio file");
      return;
    }

    if (file.size > 100 * 1024 * 1024) {
      // 100MB limit
      showError("Audio file size must be less than 100MB");
      return;
    }

    setTrackData((prev) => ({ ...prev, audioFile: file }));
    setAudioPreview(URL.createObjectURL(file));
  };

  const handleCoverChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.match("image.*")) {
      showError("Please select a valid image file");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      // 5MB limit
      showError("Image file size must be less than 5MB");
      return;
    }

    setTrackData((prev) => ({ ...prev, coverFile: file }));
    setCoverPreview(URL.createObjectURL(file));
  };

  const removeAudio = () => {
    setTrackData((prev) => ({ ...prev, audioFile: null }));
    setAudioPreview(null);
    if (audioInputRef.current) audioInputRef.current.value = "";
  };

  const removeCover = () => {
    setTrackData((prev) => ({ ...prev, coverFile: null }));
    setCoverPreview(null);
    if (coverInputRef.current) coverInputRef.current.value = "";
  };

  const handleUpload = async () => {
    // Валидация
    if (!trackData.name.trim()) {
      showError("Track name is required");
      return;
    }
    if (!trackData.audioFile) {
      showError("Audio file is required");
      return;
    }
    if (!trackData.coverFile) {
      showError("Cover image is required");
      return;
    }
    if (!trackData.genre) {
      showError("Genre is required");
      return;
    }

    setIsUploading(true);

    const formData = new FormData();
    formData.append("name", trackData.name.trim());
    formData.append("artist", artist._id);
    formData.append("album", "single");
    formData.append("audio", trackData.audioFile);
    formData.append("cover", trackData.coverFile);
    formData.append("genre", trackData.genre);
    formData.append("tags", trackData.tags.join(","));

    try {
      const response = await new Promise<Response>((resolve, reject) => {
        const xhr = new XMLHttpRequest();

        xhr.upload.addEventListener("progress", (event) => {
          if (event.lengthComputable) {
            const progress = (event.loaded / event.total) * 70; // 70% для загрузки
            setUploadProgress(progress);
          }
        });

        xhr.onload = function () {
          if (xhr.status >= 200 && xhr.status < 300) {
            // Симуляция HLS конвертации
            let conversionProgress = 70;
            const conversionInterval = setInterval(() => {
              conversionProgress += Math.random() * 5 + 2;
              if (conversionProgress >= 100) {
                conversionProgress = 100;
                clearInterval(conversionInterval);
                resolve(new Response(xhr.responseText, { status: xhr.status }));
              }
              setUploadProgress(conversionProgress);
            }, 300);
          } else {
            reject(new Error(`Upload failed with status ${xhr.status}`));
          }
        };

        xhr.onerror = () => reject(new Error("Network error"));
        xhr.open("POST", "http://localhost:5000/api/tracks");
        xhr.setRequestHeader(
          "Authorization",
          `Bearer ${localStorage.getItem("token")}`
        );
        xhr.send(formData);
      });

      const data = await response.json();

      if (data.success) {
        showSuccess(
          "🎵 Track uploaded successfully! Converting to HLS format..."
        );
        handleClose();
      } else {
        throw new Error(data.message || "Upload failed");
      }
    } catch (error) {
      console.error("Upload error:", error);
      const errorMessage =
        error instanceof Error ? error.message : "Failed to upload track";
      showError(errorMessage);
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
    }
  };

  const isFormValid =
    trackData.name.trim() &&
    trackData.audioFile &&
    trackData.coverFile &&
    trackData.genre;

  return (
    <Modal
      open={isOpen}
      onCancel={handleClose}
      closable={false}
      width={600}
      styles={{
        content: {
          backgroundColor: "rgba(40, 40, 40, 0.95)",
          backdropFilter: "blur(15px)",
          border: "1px solid rgba(255, 255, 255, 0.1)",
          borderRadius: "16px",
        },
        header: { display: "none" },
      }}
      footer={null}
      maskClosable={!isUploading}
    >
      <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div className="text-white text-2xl font-semibold tracking-wider">
            Upload Track
          </div>
          <CloseOutlined
            className="text-2xl cursor-pointer hover:text-white/70 transition-colors"
            style={{ color: "white" }}
            onClick={handleClose}
          />
        </div>

        {/* Progress Bar */}
        <AnimatePresence>
          {isUploading && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="bg-white/10 rounded-lg p-4 backdrop-blur-sm"
            >
              <div className="flex justify-between items-center mb-2">
                <span className="text-white text-sm font-medium">
                  {uploadProgress < 70
                    ? "Uploading..."
                    : "Converting to HLS..."}
                </span>
                <span className="text-white text-sm">
                  {Math.round(uploadProgress)}%
                </span>
              </div>
              <div className="w-full bg-white/20 rounded-full h-2">
                <motion.div
                  className="bg-gradient-to-r from-green-500 to-emerald-500 h-2 rounded-full"
                  initial={{ width: 0 }}
                  animate={{ width: `${uploadProgress}%` }}
                  transition={{ duration: 0.3 }}
                />
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Form */}
        <div className="space-y-4">
          {/* Track Name */}
          <div>
            <label className="block text-white/80 text-sm font-medium mb-2">
              Track Name *
            </label>
            <StyledInput
              placeholder="Enter track name"
              value={trackData.name}
              onChange={(e) =>
                setTrackData((prev) => ({ ...prev, name: e.target.value }))
              }
              disabled={isUploading}
            />
          </div>

          {/* Audio and Cover Upload */}
          <div className="grid grid-cols-2 gap-4">
            {/* Audio Upload */}
            <div>
              <label className="block text-white/80 text-sm font-medium mb-2">
                Audio File * (MP3)
              </label>
              <div className="flex items-center gap-3">
                <div className="relative">
                  {audioPreview ? (
                    <div className="relative">
                      <button
                        onClick={() => {
                          const audio = new Audio(audioPreview);
                          audio.play();
                        }}
                        className="w-12 h-12 rounded-lg bg-white/10 border border-white/20 flex items-center justify-center hover:bg-white/20 transition-colors"
                        disabled={isUploading}
                      >
                        <PlayCircleOutlined className="text-green-400 text-xl" />
                      </button>
                      <button
                        onClick={removeAudio}
                        className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs hover:bg-red-600 transition-colors"
                        disabled={isUploading}
                      >
                        <DeleteOutlined />
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => audioInputRef.current?.click()}
                      className="w-12 h-12 rounded-lg bg-white/10 border border-white/20 flex items-center justify-center hover:bg-white/20 transition-colors"
                      disabled={isUploading}
                    >
                      <UploadOutlined className="text-white/60" />
                    </button>
                  )}
                  <input
                    ref={audioInputRef}
                    type="file"
                    accept="audio/mp3,audio/mpeg"
                    onChange={handleAudioChange}
                    className="hidden"
                    disabled={isUploading}
                  />
                </div>
                <div className="flex-1">
                  <button
                    onClick={() => audioInputRef.current?.click()}
                    className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white/80 text-sm hover:bg-white/20 transition-colors text-left"
                    disabled={isUploading}
                  >
                    {trackData.audioFile
                      ? trackData.audioFile.name
                      : "Select audio file"}
                  </button>
                  {trackData.audioFile && (
                    <span className="text-xs text-white/50 mt-1 block">
                      {(trackData.audioFile.size / (1024 * 1024)).toFixed(2)} MB
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Cover Upload */}
            <div>
              <label className="block text-white/80 text-sm font-medium mb-2">
                Cover Image *
              </label>
              <div className="flex items-center gap-3">
                <div className="relative">
                  {coverPreview ? (
                    <div className="relative">
                      <img
                        src={coverPreview}
                        alt="Cover preview"
                        className="w-12 h-12 rounded-lg object-cover border border-white/20"
                      />
                      <button
                        onClick={removeCover}
                        className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs hover:bg-red-600 transition-colors"
                        disabled={isUploading}
                      >
                        <DeleteOutlined />
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => coverInputRef.current?.click()}
                      className="w-12 h-12 rounded-lg bg-white/10 border border-white/20 flex items-center justify-center hover:bg-white/20 transition-colors"
                      disabled={isUploading}
                    >
                      <UploadOutlined className="text-white/60" />
                    </button>
                  )}
                  <input
                    ref={coverInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleCoverChange}
                    className="hidden"
                    disabled={isUploading}
                  />
                </div>
                <div className="flex-1">
                  <button
                    onClick={() => coverInputRef.current?.click()}
                    className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white/80 text-sm hover:bg-white/20 transition-colors text-left"
                    disabled={isUploading}
                  >
                    {trackData.coverFile
                      ? trackData.coverFile.name
                      : "Select cover image"}
                  </button>
                  {trackData.coverFile && (
                    <span className="text-xs text-white/50 mt-1 block">
                      {(trackData.coverFile.size / (1024 * 1024)).toFixed(2)} MB
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Genre */}
          <div>
            <label className="block text-white/80 text-sm font-medium mb-2">
              Genre *
            </label>
            <StyledSelect
              placeholder="Select genre"
              value={trackData.genre || undefined}
              onChange={(value) =>
                setTrackData((prev) => ({ ...prev, genre: value }))
              }
              options={genres.map((genre) => ({ label: genre, value: genre }))}
              className="w-full"
              disabled={isUploading}
              showSearch
              filterOption={(input, option) =>
                String(option?.label ?? "")
                  .toLowerCase()
                  .includes(input.toLowerCase())
              }
            />
          </div>

          {/* Tags */}
          <div>
            <label className="block text-white/80 text-sm font-medium mb-2">
              Tags (Optional) - Max 5
            </label>
            <StyledMultiSelect
              mode="multiple"
              placeholder="Select tags that describe your track"
              value={trackData.tags}
              onChange={(values) => {
                if (values.length <= 5) {
                  setTrackData((prev) => ({ ...prev, tags: values }));
                }
              }}
              options={predefinedTags.map((tag) => ({
                label: tag,
                value: tag,
              }))}
              className="w-full"
              disabled={isUploading}
              showSearch
              maxTagCount="responsive"
              filterOption={(input, option) =>
                String(option?.label ?? "")
                  .toLowerCase()
                  .includes(input.toLowerCase())
              }
            />
            <span className="text-xs text-white/50 mt-1 block">
              Selected: {trackData.tags.length}/5
            </span>
          </div>

          {/* Artist Info */}
          <div className="bg-white/5 rounded-lg p-3 border border-white/10">
            <div className="flex items-center gap-3">
              <img
                src={artist.avatar || "/default-artist-avatar.png"}
                alt={artist.name}
                className="w-8 h-8 rounded-full object-cover"
              />
              <div>
                <span className="text-white/60 text-xs">Artist:</span>
                <p className="text-white font-medium">{artist.name}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-3 pt-4">
          <button
            onClick={handleClose}
            disabled={isUploading}
            className="px-6 py-2 rounded-lg bg-white/10 text-white border border-white/20 hover:bg-white/20 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Cancel
          </button>
          <button
            onClick={handleUpload}
            disabled={!isFormValid || isUploading}
            className="px-8 py-2 rounded-lg bg-gradient-to-r from-green-500 to-emerald-500 text-white font-semibold hover:from-green-600 hover:to-emerald-600 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:from-green-500 disabled:hover:to-emerald-500"
          >
            {isUploading ? "Uploading..." : "Upload Track"}
          </button>
        </div>
      </div>
    </Modal>
  );
};

export default UploadTrackModal;
