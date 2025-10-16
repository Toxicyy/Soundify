import React, { useRef, useCallback } from "react";
import { Input, Select, DatePicker } from "antd";
import { UploadOutlined, DeleteOutlined } from "@ant-design/icons";
import styled from "styled-components";
import dayjs, { Dayjs } from "dayjs";

const { TextArea } = Input;

interface AlbumData {
  name: string;
  description: string;
  releaseDate: Date | null;
  type: "album" | "ep" | "single";
  coverFile: File | null;
  coverPreview: string | null;
}

interface AlbumHeaderFormProps {
  albumData: AlbumData;
  onChange: (updates: Partial<AlbumData>) => void;
  suggestedGenre: string;
  tracksCount: number;
}

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

const StyledTextArea = styled(TextArea)`
  background-color: rgba(255, 255, 255, 0.1) !important;
  color: white !important;
  border: 1px solid rgba(255, 255, 255, 0.2) !important;
  border-radius: 8px;
  font-size: 14px;

  @media (min-width: 1024px) {
    font-size: 16px;
  }

  textarea::placeholder {
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

const StyledDatePicker = styled(DatePicker)`
  &.ant-picker {
    background-color: rgba(255, 255, 255, 0.1) !important;
    color: white !important;
    border: 1px solid rgba(255, 255, 255, 0.2) !important;
    border-radius: 8px;
    width: 100%;
    font-size: 14px;

    @media (min-width: 1024px) {
      font-size: 16px;
    }

    .ant-picker-input > input {
      color: white !important;
      background: transparent !important;
    }

    .ant-picker-input > input::placeholder {
      color: rgba(255, 255, 255, 0.6) !important;
    }

    &:hover {
      border-color: rgba(255, 255, 255, 0.3) !important;
      background-color: rgba(255, 255, 255, 0.12) !important;
    }

    &.ant-picker-focused {
      border-color: #1db954 !important;
      box-shadow: 0 0 0 2px rgba(29, 185, 84, 0.2) !important;
      background-color: rgba(255, 255, 255, 0.15) !important;
    }
  }
`;

/**
 * Album metadata form component
 * Features: cover upload, name, description, type, release date
 */
const AlbumHeaderForm: React.FC<AlbumHeaderFormProps> = ({
  albumData,
  onChange,
  suggestedGenre,
  tracksCount,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleCoverChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;

      if (!file.type.startsWith("image/")) {
        alert("Please select a valid image file");
        return;
      }

      if (file.size > 5 * 1024 * 1024) {
        alert("Image file size must be less than 5MB");
        return;
      }

      if (albumData.coverPreview) {
        URL.revokeObjectURL(albumData.coverPreview);
      }

      const preview = URL.createObjectURL(file);
      onChange({ coverFile: file, coverPreview: preview });
    },
    [albumData.coverPreview, onChange]
  );

  const handleRemoveCover = useCallback(() => {
    if (albumData.coverPreview) {
      URL.revokeObjectURL(albumData.coverPreview);
    }
    onChange({ coverFile: null, coverPreview: null });
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  }, [albumData.coverPreview, onChange]);

  const getTypeColor = (type: string) => {
    switch (type) {
      case "single":
        return "text-blue-400";
      case "ep":
        return "text-purple-400";
      case "album":
        return "text-pink-400";
      default:
        return "text-white";
    }
  };

  const getTypeDescription = (type: string) => {
    switch (type) {
      case "single":
        return "1 track";
      case "ep":
        return "2-6 tracks";
      case "album":
        return "7+ tracks";
      default:
        return "";
    }
  };

  return (
    <div className="bg-white/5 backdrop-blur-md rounded-lg lg:rounded-2xl p-4 lg:p-6 border border-white/10">
      <h2 className="text-lg lg:text-xl font-semibold text-white mb-4 lg:mb-6">
        Album Information
      </h2>

      <div className="space-y-4 lg:space-y-6">
        <div>
          <label className="block text-white/80 text-sm font-medium mb-2 lg:mb-3">
            Album Cover *
          </label>
          <div className="flex items-center gap-3 lg:gap-4">
            <div className="relative flex-shrink-0">
              {albumData.coverPreview ? (
                <div className="relative">
                  <img
                    src={albumData.coverPreview}
                    alt="Album cover preview"
                    className="w-20 h-20 lg:w-24 lg:h-24 rounded-lg object-cover border border-white/20"
                  />
                  <button
                    onClick={handleRemoveCover}
                    className="absolute -top-1 -right-1 lg:-top-2 lg:-right-2 bg-red-500 text-white rounded-full w-5 h-5 lg:w-6 lg:h-6 flex items-center justify-center text-xs hover:bg-red-600 transition-colors"
                  >
                    <DeleteOutlined />
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="w-20 h-20 lg:w-24 lg:h-24 rounded-lg bg-white/10 border-2 border-dashed border-white/30 flex flex-col items-center justify-center hover:bg-white/15 transition-colors"
                >
                  <UploadOutlined className="text-white/60 text-lg lg:text-xl mb-1" />
                  <span className="text-white/60 text-xs">Upload</span>
                </button>
              )}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleCoverChange}
                className="hidden"
              />
            </div>
            <div className="flex-1 min-w-0">
              <button
                onClick={() => fileInputRef.current?.click()}
                className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white/80 text-sm hover:bg-white/20 transition-colors text-left truncate"
              >
                {albumData.coverFile
                  ? albumData.coverFile.name
                  : "Select cover image"}
              </button>
              <p className="text-white/40 text-xs mt-1">
                Recommended: 1000x1000px, JPG or PNG, max 5MB
              </p>
            </div>
          </div>
        </div>

        <div>
          <label className="block text-white/80 text-sm font-medium mb-2">
            Album Name *
          </label>
          <StyledInput
            placeholder="Enter album name"
            value={albumData.name}
            onChange={(e) => onChange({ name: e.target.value })}
            maxLength={100}
          />
        </div>

        <div>
          <label className="block text-white/80 text-sm font-medium mb-2">
            Description
          </label>
          <StyledTextArea
            placeholder="Tell your fans about this album..."
            value={albumData.description}
            onChange={(e) => onChange({ description: e.target.value })}
            rows={3}
            maxLength={500}
            showCount
          />
        </div>

        <div>
          <label className="block text-white/80 text-sm font-medium mb-2">
            Album Type
          </label>
          <StyledSelect
            value={albumData.type}
            onChange={(value) =>
              onChange({ type: value as "album" | "ep" | "single" })
            }
            className="w-full"
            disabled
          >
            <Select.Option value="single">Single</Select.Option>
            <Select.Option value="ep">EP</Select.Option>
            <Select.Option value="album">Album</Select.Option>
          </StyledSelect>
          <div className="flex items-center justify-between mt-2">
            <span
              className={`text-sm font-medium ${getTypeColor(albumData.type)}`}
            >
              {albumData.type.toUpperCase()}
            </span>
            <span className="text-white/40 text-xs">
              Auto-determined ({getTypeDescription(albumData.type)})
            </span>
          </div>
        </div>

        <div>
          <label className="block text-white/80 text-sm font-medium mb-2">
            Release Date (coming soon)
          </label>
          <StyledDatePicker
            placeholder="Select release date"
            value={albumData.releaseDate ? dayjs(albumData.releaseDate) : null}
            onChange={(date: unknown) => {
              const dayjsDate = date as Dayjs | null;
              onChange({ releaseDate: dayjsDate ? dayjsDate.toDate() : null });
            }}
            format="YYYY-MM-DD"
            disabled
          />
          <p className="text-white/40 text-xs mt-1">
            Optional - Leave empty for immediate release
          </p>
        </div>

        <div className="bg-white/5 rounded-lg p-3 lg:p-4 border border-white/10">
          <h4 className="text-white font-medium mb-3 text-sm lg:text-base">
            Album Summary
          </h4>
          <div className="grid grid-cols-2 gap-2 text-sm">
            <div className="flex justify-between">
              <span className="text-white/60">Tracks:</span>
              <span className="text-white font-medium">{tracksCount}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-white/60">Type:</span>
              <span className={`font-medium ${getTypeColor(albumData.type)}`}>
                {albumData.type.toUpperCase()}
              </span>
            </div>
            {suggestedGenre && (
              <div className="flex justify-between col-span-2">
                <span className="text-white/60">Suggested Genre:</span>
                <span className="text-white font-medium">{suggestedGenre}</span>
              </div>
            )}
            <div className="flex justify-between col-span-2">
              <span className="text-white/60">Status:</span>
              <span className="text-white font-medium">
                {albumData.name && albumData.coverFile && tracksCount >= 2
                  ? "Ready to create"
                  : "Needs more info"}
              </span>
            </div>
          </div>
        </div>

        <div className="bg-blue-500/10 rounded-lg p-3 lg:p-4 border border-blue-500/20">
          <h4 className="text-blue-400 font-medium mb-2 flex items-center gap-2 text-sm lg:text-base">
            <span>ℹ</span>
            Requirements
          </h4>
          <ul className="text-white/80 text-sm space-y-1">
            <li className="flex items-center gap-2">
              <span>{albumData.name ? "✅" : "❌"}</span>
              Album name
            </li>
            <li className="flex items-center gap-2">
              <span>{albumData.coverFile ? "✅" : "❌"}</span>
              Album cover image
            </li>
            <li className="flex items-center gap-2">
              <span>{tracksCount >= 2 ? "✅" : "❌"}</span>
              At least 2 tracks
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default AlbumHeaderForm;
