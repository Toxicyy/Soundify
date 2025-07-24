import React, { useState, useRef, useCallback } from "react";
import { Modal, Input, Select } from "antd";
import {
  CloseOutlined,
  UploadOutlined,
  DeleteOutlined,
  PlayCircleOutlined,
  LoadingOutlined,
} from "@ant-design/icons";
import styled from "styled-components";
import { useNotification } from "../../hooks/useNotification";
import type { LocalTrack } from "../../types/LocalTrack";

interface UploadTrackToAlbumModalProps {
  isOpen: boolean;
  onClose: () => void;
  onTrackUpload: (track: LocalTrack) => void;
  existingTracks: LocalTrack[];
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

  .ant-select-selection-item {
    color: white !important;
  }

  .ant-select-selection-placeholder {
    color: rgba(255, 255, 255, 0.6) !important;
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

  .ant-select-selection-placeholder {
    color: rgba(255, 255, 255, 0.6) !important;
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

// Genre and tags data
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
  "Energetic",
  "Chill",
  "Sad",
  "Happy",
  "Aggressive",
  "Romantic",
  "Melancholic",
  "Uplifting",
  "Workout",
  "Study",
  "Party",
  "Sleep",
  "Drive",
  "Focus",
  "Dance",
  "Relax",
  "Morning",
  "Night",
  "Summer",
  "Winter",
  "Weekend",
  "Holiday",
  "Acoustic",
  "Electric",
  "Instrumental",
  "Vocal",
  "Live",
  "Studio",
  "Remix",
  "Cover",
  "Fast",
  "Medium",
  "Slow",
  "Upbeat",
  "Downtempo",
];

const UploadTrackToAlbumModal: React.FC<UploadTrackToAlbumModalProps> = ({
  isOpen,
  onClose,
  onTrackUpload,
  existingTracks,
}) => {
  const { showSuccess, showError } = useNotification();

  const [trackData, setTrackData] = useState({
    name: "",
    genre: "",
    tags: [] as string[],
  });

  const [audioFile, setAudioFile] = useState<File | null>(null);
  const [coverFile, setCoverFile] = useState<File | null>(null);
  const [audioPreview, setAudioPreview] = useState<string | null>(null);
  const [coverPreview, setCoverPreview] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [duration, setDuration] = useState<number | null>(null);

  const audioInputRef = useRef<HTMLInputElement>(null);
  const coverInputRef = useRef<HTMLInputElement>(null);

  // Reset form
  const resetForm = useCallback(() => {
    setTrackData({ name: "", genre: "", tags: [] });
    setAudioFile(null);
    setCoverFile(null);

    if (audioPreview) URL.revokeObjectURL(audioPreview);
    if (coverPreview) URL.revokeObjectURL(coverPreview);

    setAudioPreview(null);
    setCoverPreview(null);
    setIsAnalyzing(false);
    setDuration(null);

    if (audioInputRef.current) audioInputRef.current.value = "";
    if (coverInputRef.current) coverInputRef.current.value = "";
  }, [audioPreview, coverPreview]);

  // Handle audio file selection
  const handleAudioChange = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;

      if (!file.type.startsWith("audio/")) {
        showError("Please select a valid audio file");
        return;
      }

      if (file.size > 100 * 1024 * 1024) {
        // 100MB limit
        showError("Audio file size must be less than 100MB");
        return;
      }

      // Check for duplicates
      const isDuplicate = existingTracks.some(
        (track) =>
          track.file.name === file.name && track.file.size === file.size
      );

      if (isDuplicate) {
        showError(`Track "${file.name}" is already in the album`);
        return;
      }

      setIsAnalyzing(true);
      setAudioFile(file);

      // Create preview URL
      const preview = URL.createObjectURL(file);
      setAudioPreview(preview);

      // Extract track name from filename
      const nameFromFile = file.name
        .replace(/\.[^/.]+$/, "")
        .replace(/[-_]/g, " ");
      setTrackData((prev) => ({
        ...prev,
        name: prev.name || nameFromFile,
      }));

      // Get audio duration
      try {
        const audio = new Audio(preview);
        audio.addEventListener("loadedmetadata", () => {
          setDuration(Math.round(audio.duration));
          setIsAnalyzing(false);
        });
        audio.addEventListener("error", () => {
          setIsAnalyzing(false);
          showError("Could not analyze audio file");
        });
      } catch (error) {
        setIsAnalyzing(false);
        console.error("Error analyzing audio:", error);
      }
    },
    [existingTracks, showError]
  );

  // Handle cover file selection
  const handleCoverChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;

      if (!file.type.startsWith("image/")) {
        showError("Please select a valid image file");
        return;
      }

      if (file.size > 5 * 1024 * 1024) {
        // 5MB limit
        showError("Image file size must be less than 5MB");
        return;
      }

      setCoverFile(file);

      if (coverPreview) URL.revokeObjectURL(coverPreview);
      const preview = URL.createObjectURL(file);
      setCoverPreview(preview);
    },
    [coverPreview, showError]
  );

  // Remove files
  const removeAudio = useCallback(() => {
    if (audioPreview) URL.revokeObjectURL(audioPreview);
    setAudioFile(null);
    setAudioPreview(null);
    setDuration(null);
    if (audioInputRef.current) audioInputRef.current.value = "";
  }, [audioPreview]);

  const removeCover = useCallback(() => {
    if (coverPreview) URL.revokeObjectURL(coverPreview);
    setCoverFile(null);
    setCoverPreview(null);
    if (coverInputRef.current) coverInputRef.current.value = "";
  }, [coverPreview]);

  // Handle form submission
  const handleUpload = useCallback(() => {
    // Validation
    if (!trackData.name.trim()) {
      showError("Track name is required");
      return;
    }
    if (!audioFile) {
      showError("Audio file is required");
      return;
    }
    if (!coverFile) {
      showError("Cover image is required");
      return;
    }
    if (!trackData.genre) {
      showError("Genre is required");
      return;
    }

    // Create LocalTrack object
    const newTrack: LocalTrack = {
      index: existingTracks.length,
      tempId: crypto.randomUUID(),
      file: audioFile,
      metadata: {
        name: trackData.name.trim(),
        genre: trackData.genre,
        tags: trackData.tags,
      },
      coverFile: coverFile,
      audioUrl: audioPreview!,
      duration: duration || undefined,
    };

    onTrackUpload(newTrack);
    showSuccess("Track uploaded successfully");
    resetForm();
    onClose();
  }, [
    trackData,
    audioFile,
    coverFile,
    audioPreview,
    duration,
    onTrackUpload,
    resetForm,
    onClose,
    showError,
  ]);

  // Handle close
  const handleClose = useCallback(() => {
    resetForm();
    onClose();
  }, [resetForm, onClose]);

  const isFormValid =
    trackData.name.trim() && audioFile && coverFile && trackData.genre;

  return (
    <Modal
      open={isOpen}
      onCancel={handleClose}
      closable={false}
      width={650}
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
      maskClosable={!isAnalyzing}
    >
      <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div className="text-white text-2xl font-semibold tracking-wider">
            Add Track to Album
          </div>
          <CloseOutlined
            className="text-2xl cursor-pointer hover:text-white/70 transition-colors"
            style={{ color: "white" }}
            onClick={handleClose}
          />
        </div>

        {/* Progress indicator */}
        {isAnalyzing && (
          <div className="bg-blue-500/10 rounded-lg p-4 border border-blue-500/20">
            <div className="flex items-center gap-3">
              <LoadingOutlined className="text-blue-400 animate-spin" />
              <span className="text-blue-400 font-medium">
                Analyzing audio file...
              </span>
            </div>
          </div>
        )}

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
              maxLength={100}
            />
          </div>

          {/* File Uploads */}
          <div className="grid grid-cols-2 gap-4">
            {/* Audio Upload */}
            <div>
              <label className="block text-white/80 text-sm font-medium mb-2">
                Audio File * (MP3, WAV)
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
                        disabled={isAnalyzing}
                        title="Preview audio"
                      >
                        <PlayCircleOutlined className="text-green-400 text-xl" />
                      </button>
                      <button
                        onClick={removeAudio}
                        className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs hover:bg-red-600 transition-colors"
                        disabled={isAnalyzing}
                      >
                        <DeleteOutlined />
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => audioInputRef.current?.click()}
                      className="w-12 h-12 rounded-lg bg-white/10 border border-white/20 flex items-center justify-center hover:bg-white/20 transition-colors"
                    >
                      <UploadOutlined className="text-white/60" />
                    </button>
                  )}
                  <input
                    ref={audioInputRef}
                    type="file"
                    accept="audio/*"
                    onChange={handleAudioChange}
                    className="hidden"
                  />
                </div>
                <div className="flex-1">
                  <button
                    onClick={() => audioInputRef.current?.click()}
                    className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white/80 text-sm hover:bg-white/20 transition-colors text-left "
                  >
                    {audioFile
                      ? audioFile.name.length > 30
                        ? `${audioFile.name.substring(0, 30)}...`
                        : audioFile.name
                      : "Select audio file"}
                  </button>
                  {audioFile && (
                    <div className="text-xs text-white/50 mt-1 flex justify-between">
                      <span>
                        {(audioFile.size / (1024 * 1024)).toFixed(2)} MB
                      </span>
                      {duration && (
                        <span>
                          {Math.floor(duration / 60)}:
                          {(duration % 60).toString().padStart(2, "0")}
                        </span>
                      )}
                    </div>
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
                      >
                        <DeleteOutlined />
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => coverInputRef.current?.click()}
                      className="w-12 h-12 rounded-lg bg-white/10 border border-white/20 flex items-center justify-center hover:bg-white/20 transition-colors"
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
                  />
                </div>
                <div className="flex-1">
                  <button
                    onClick={() => coverInputRef.current?.click()}
                    className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white/80 text-sm hover:bg-white/20 transition-colors text-left"
                  >
                    {coverFile ? coverFile.name : "Select cover image"}
                  </button>
                  {coverFile && (
                    <span className="text-xs text-white/50 mt-1 block">
                      {(coverFile.size / (1024 * 1024)).toFixed(2)} MB
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

          {/* Track Preview */}
          {audioPreview && coverPreview && trackData.name && (
            <div className="bg-white/5 rounded-lg p-4 border border-white/10">
              <h4 className="text-white font-medium mb-3">Track Preview</h4>
              <div className="flex items-center gap-3">
                <img
                  src={coverPreview}
                  alt="Track cover"
                  className="w-12 h-12 rounded-lg object-cover"
                />
                <div className="flex-1">
                  <h5 className="text-white font-medium">{trackData.name}</h5>
                  <div className="text-white/60 text-sm flex items-center gap-2">
                    <span>{trackData.genre}</span>
                    {duration && (
                      <>
                        <span>•</span>
                        <span>
                          {Math.floor(duration / 60)}:
                          {(duration % 60).toString().padStart(2, "0")}
                        </span>
                      </>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-3 pt-4">
          <button
            onClick={handleClose}
            disabled={isAnalyzing}
            className="px-6 py-2 rounded-lg bg-white/10 text-white border border-white/20 hover:bg-white/20 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Cancel
          </button>
          <button
            onClick={handleUpload}
            disabled={!isFormValid || isAnalyzing}
            className="px-8 py-2 rounded-lg bg-gradient-to-r from-green-500 to-emerald-500 text-white font-semibold hover:from-green-600 hover:to-emerald-600 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:from-green-500 disabled:hover:to-emerald-500"
          >
            {isAnalyzing ? "Analyzing..." : "Add to Album"}
          </button>
        </div>
      </div>
    </Modal>
  );
};

export default UploadTrackToAlbumModal;
