import React, { useState, useCallback, useEffect } from "react";
import { Modal, Input, Select } from "antd";
import { CloseOutlined, EditOutlined } from "@ant-design/icons";
import styled from "styled-components";
import { useNotification } from "../../hooks/useNotification";

interface LocalTrack {
  tempId: string;
  file: File;
  metadata: {
    name: string;
    genre: string;
    tags: string[];
  };
  coverFile: File;
  audioUrl: string;
  duration?: number;
}

interface EditTrackModalProps {
  isOpen: boolean;
  onClose: () => void;
  track: LocalTrack;
  onSave: (updates: Partial<LocalTrack["metadata"]>) => void;
  trackNumber: number;
  totalTracks: number;
}

/**
 * Styled components with responsive design
 * Maintained original styling but added responsive breakpoints
 */
const StyledInput = styled(Input)`
  &.ant-input {
    background-color: rgba(255, 255, 255, 0.1) !important;
    color: white !important;
    border: 1px solid rgba(255, 255, 255, 0.2) !important;
    border-radius: 8px;
    font-size: 14px;

    @media (min-width: 1024px) {
      font-size: 16px;
    }

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
    font-size: 14px;

    @media (min-width: 1024px) {
      font-size: 16px;
    }
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
    font-size: 14px;

    @media (min-width: 1024px) {
      font-size: 16px;
    }
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

/**
 * Edit Track Modal Component
 * Enhanced with responsive design while maintaining original functionality
 */
const EditTrackModal: React.FC<EditTrackModalProps> = ({
  isOpen,
  onClose,
  track,
  onSave,
  trackNumber,
  totalTracks,
}) => {
  const { showSuccess } = useNotification();

  const [editedData, setEditedData] = useState({
    name: "",
    genre: "",
    tags: [] as string[],
  });

  // Initialize form data when modal opens
  useEffect(() => {
    if (isOpen && track) {
      setEditedData({
        name: track.metadata.name,
        genre: track.metadata.genre,
        tags: [...track.metadata.tags],
      });
    }
  }, [isOpen, track]);

  // Handle save
  const handleSave = useCallback(() => {
    if (!editedData.name.trim()) {
      return;
    }

    const updates: Partial<LocalTrack["metadata"]> = {};

    if (editedData.name !== track.metadata.name) {
      updates.name = editedData.name.trim();
    }

    if (editedData.genre !== track.metadata.genre) {
      updates.genre = editedData.genre;
    }

    if (
      JSON.stringify(editedData.tags) !== JSON.stringify(track.metadata.tags)
    ) {
      updates.tags = editedData.tags;
    }

    onSave(updates);
    showSuccess(`Track "${editedData.name}" updated successfully`);
    onClose();
  }, [editedData, track.metadata, onSave, showSuccess, onClose]);

  // Handle cancel
  const handleCancel = useCallback(() => {
    setEditedData({
      name: track.metadata.name,
      genre: track.metadata.genre,
      tags: [...track.metadata.tags],
    });
    onClose();
  }, [track.metadata, onClose]);

  // Check if form has changes
  const hasChanges =
    editedData.name !== track.metadata.name ||
    editedData.genre !== track.metadata.genre ||
    JSON.stringify(editedData.tags) !== JSON.stringify(track.metadata.tags);

  const isFormValid = editedData.name.trim() && editedData.genre;

  return (
    <Modal
      open={isOpen}
      onCancel={handleCancel}
      closable={false}
      width="min(90vw, 550px)"
      styles={{
        content: {
          backgroundColor: "rgba(40, 40, 40, 0.95)",
          backdropFilter: "blur(15px)",
          border: "1px solid rgba(255, 255, 255, 0.1)",
          borderRadius: "16px",
          maxHeight: "90vh",
          overflow: "hidden",
        },
        header: { display: "none" },
        body: {
          padding: "16px",
          maxHeight: "calc(90vh - 32px)",
          overflow: "auto",
        },
      }}
      footer={null}
      maskClosable={false}
    >
      <div className="space-y-4 lg:space-y-6">
        {/* Header - Responsive layout */}
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-2 lg:gap-3">
            <EditOutlined className="text-white text-lg lg:text-xl" />
            <div>
              <div className="text-white text-lg lg:text-xl font-semibold tracking-wider">
                Edit Track
              </div>
              <div className="text-white/60 text-sm">
                Track {trackNumber} of {totalTracks}
              </div>
            </div>
          </div>
          <CloseOutlined
            className="text-xl lg:text-2xl cursor-pointer hover:text-white/70 transition-colors"
            style={{ color: "white" }}
            onClick={handleCancel}
          />
        </div>

        {/* Track Preview - Responsive layout */}
        <div className="bg-white/5 rounded-lg p-3 lg:p-4 border border-white/10">
          <div className="flex items-center gap-2 lg:gap-3">
            <img
              src={URL.createObjectURL(track.coverFile)}
              alt="Track cover"
              className="w-10 h-10 lg:w-12 lg:h-12 rounded-lg object-cover"
            />
            <div className="flex-1 min-w-0">
              <h4 className="text-white font-medium text-sm lg:text-base truncate">
                {track.metadata.name}
              </h4>
              <div className="text-white/60 text-xs lg:text-sm flex items-center gap-2">
                <span className="truncate">{track.file.name}</span>
                {track.duration && (
                  <>
                    <span>•</span>
                    <span>
                      {Math.floor(track.duration / 60)}:
                      {(track.duration % 60).toString().padStart(2, "0")}
                    </span>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-3 lg:space-y-4">
          {/* Track Name */}
          <div>
            <label className="block text-white/80 text-sm font-medium mb-2">
              Track Name *
            </label>
            <StyledInput
              placeholder="Enter track name"
              value={editedData.name}
              onChange={(e) =>
                setEditedData((prev) => ({ ...prev, name: e.target.value }))
              }
              maxLength={100}
            />
          </div>

          {/* Genre */}
          <div>
            <label className="block text-white/80 text-sm font-medium mb-2">
              Genre *
            </label>
            <StyledSelect
              placeholder="Select genre"
              value={editedData.genre || undefined}
              onChange={(value) =>
                setEditedData((prev) => ({ ...prev, genre: value }))
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
              value={editedData.tags}
              onChange={(values) => {
                if (values.length <= 5) {
                  setEditedData((prev) => ({ ...prev, tags: values }));
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
              Selected: {editedData.tags.length}/5
            </span>
          </div>

          {/* Changes Summary */}
          {hasChanges && (
            <div className="bg-yellow-500/10 rounded-lg p-3 border border-yellow-500/20">
              <h4 className="text-yellow-400 font-medium mb-2 flex items-center gap-2 text-sm lg:text-base">
                <span>⚠️</span>
                Pending Changes
              </h4>
              <div className="space-y-1 text-sm">
                {editedData.name !== track.metadata.name && (
                  <div className="flex justify-between">
                    <span className="text-white/60">Name:</span>
                    <span className="text-white truncate ml-2">
                      {editedData.name}
                    </span>
                  </div>
                )}
                {editedData.genre !== track.metadata.genre && (
                  <div className="flex justify-between">
                    <span className="text-white/60">Genre:</span>
                    <span className="text-white">{editedData.genre}</span>
                  </div>
                )}
                {JSON.stringify(editedData.tags) !==
                  JSON.stringify(track.metadata.tags) && (
                  <div className="flex justify-between">
                    <span className="text-white/60">Tags:</span>
                    <span className="text-white truncate ml-2">
                      {editedData.tags.length > 0
                        ? editedData.tags.join(", ")
                        : "None"}
                    </span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Current vs New Comparison - Responsive grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 lg:gap-4">
            <div className="bg-white/5 rounded-lg p-3 border border-white/10">
              <h4 className="text-white/80 font-medium mb-2 text-sm">
                Current
              </h4>
              <div className="space-y-1 text-xs">
                <div className="flex justify-between">
                  <span className="text-white/60">Name:</span>
                  <span
                    className="text-white/80 truncate max-w-[120px]"
                    title={track.metadata.name}
                  >
                    {track.metadata.name}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-white/60">Genre:</span>
                  <span className="text-white/80">{track.metadata.genre}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-white/60">Tags:</span>
                  <span className="text-white/80">
                    {track.metadata.tags.length > 0
                      ? track.metadata.tags.length
                      : "None"}
                  </span>
                </div>
              </div>
            </div>

            <div className="bg-white/5 rounded-lg p-3 border border-white/10">
              <h4 className="text-white/80 font-medium mb-2 text-sm">
                Preview
              </h4>
              <div className="space-y-1 text-xs">
                <div className="flex justify-between">
                  <span className="text-white/60">Name:</span>
                  <span
                    className={`truncate max-w-[120px] ${
                      editedData.name !== track.metadata.name
                        ? "text-green-400"
                        : "text-white/80"
                    }`}
                    title={editedData.name}
                  >
                    {editedData.name || "Untitled"}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-white/60">Genre:</span>
                  <span
                    className={`${
                      editedData.genre !== track.metadata.genre
                        ? "text-green-400"
                        : "text-white/80"
                    }`}
                  >
                    {editedData.genre || "None"}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-white/60">Tags:</span>
                  <span
                    className={`${
                      JSON.stringify(editedData.tags) !==
                      JSON.stringify(track.metadata.tags)
                        ? "text-green-400"
                        : "text-white/80"
                    }`}
                  >
                    {editedData.tags.length > 0
                      ? editedData.tags.length
                      : "None"}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer - Responsive button layout */}
        <div className="flex flex-col sm:flex-row justify-end gap-3 pt-4">
          <button
            onClick={handleCancel}
            className="px-4 lg:px-6 py-2 rounded-lg bg-white/10 text-white border border-white/20 hover:bg-white/20 transition-colors text-sm lg:text-base"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={!isFormValid || !hasChanges}
            className="px-6 lg:px-8 py-2 rounded-lg bg-gradient-to-r from-green-500 to-emerald-500 text-white font-semibold hover:from-green-600 hover:to-emerald-600 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:from-green-500 disabled:hover:to-emerald-500 text-sm lg:text-base"
          >
            Save Changes
          </button>
        </div>
      </div>
    </Modal>
  );
};

export default EditTrackModal;
