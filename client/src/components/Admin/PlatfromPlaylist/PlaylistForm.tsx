import React, { useState, useCallback, useEffect } from "react";
import { UploadOutlined, ExclamationCircleOutlined } from "@ant-design/icons";
import type { Track } from "../../../types/TrackData";
import { useNotification } from "../../../hooks/useNotification";
import TagsSelector from "./TagsSelector";

interface PlaylistFormProps {
  formData: {
    name: string;
    description: string;
    tags: string[];
  };
  tracks: Track[];
  coverFile: File | null;
  setCoverFile: (file: File | null) => void;
  onFormChange: (
    updates: Partial<{
      name: string;
      description: string;
      tags: string[];
    }>
  ) => void;
  isEditing: boolean;
  canPublish: boolean;
  initialCoverUrl?: string;
}

const PlaylistForm: React.FC<PlaylistFormProps> = ({
  formData,
  tracks,
  setCoverFile,
  onFormChange,
  isEditing,
  coverFile,
  initialCoverUrl,
}) => {
  const [coverPreview, setCoverPreview] = useState<string | null>(null);
  const { showError } = useNotification();

  useEffect(() => {

    if (initialCoverUrl && !coverFile) {
      setCoverPreview(initialCoverUrl);
    }
  }, [initialCoverUrl, coverFile]);

  // Handle cover file change
  const handleCoverChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;

      if (!file.type.startsWith("image/")) {
        showError("Please select a valid image file");
        return;
      }

      if (file.size > 5 * 1024 * 1024) {
        showError("Image file size must be less than 5MB");
        return;
      }

      setCoverFile(file);

      // Clean up previous preview
      if (coverPreview) {
        URL.revokeObjectURL(coverPreview);
      }

      const preview = URL.createObjectURL(file);
      setCoverPreview(preview);
    },
    [setCoverFile, coverPreview, showError]
  );

  const handleInputChange = useCallback(
    (field: string, value: string) => {
      onFormChange({ [field]: value });
    },
    [onFormChange]
  );

  const handleTagsChange = useCallback(
    (tags: string[]) => {
      onFormChange({ tags });
    },
    [onFormChange]
  );

  return (
    <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl p-6">
      <h2 className="text-xl font-semibold text-white mb-6">
        Playlist Details
      </h2>

      {/* Cover Upload */}
      <div className="mb-6">
        <label className="block text-white/80 text-sm font-medium mb-3">
          Cover Image
        </label>
        <div className="relative">
          <div className="aspect-square bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl overflow-hidden">
            {coverPreview ? (
              <img
                src={coverPreview}
                alt="Playlist cover"
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <div className="text-center">
                  <UploadOutlined className="text-4xl text-white/60 mb-2" />
                  <p className="text-white/60 text-sm">Upload Cover</p>
                </div>
              </div>
            )}
          </div>
          {isEditing && (
            <>
              <input
                type="file"
                accept="image/*"
                onChange={handleCoverChange}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                id="cover-upload"
              />
              <label
                htmlFor="cover-upload"
                className="absolute inset-0 bg-black/50 opacity-0 hover:opacity-100 flex items-center justify-center transition-opacity duration-200 rounded-xl cursor-pointer z-20"
              >
                <span className="text-white font-medium">
                  {coverPreview ? "Change Cover" : "Upload Cover"}
                </span>
              </label>
            </>
          )}
        </div>
      </div>

      {/* Form Fields */}
      <div className="space-y-4">
        <div>
          <label className="block text-white/80 text-sm font-medium mb-2">
            Playlist Name *
          </label>
          {isEditing ? (
            <input
              type="text"
              value={formData.name}
              onChange={(e) => handleInputChange("name", e.target.value)}
              placeholder="Enter playlist name"
              className="w-full px-3 xs:px-4 py-2.5 xs:py-3 bg-white/1 1 md:backdrop-blur-md border border-white/20 rounded-lg xs:rounded-xl text-white placeholder-white/60 focus:outline-none focus:border-white/40 focus:bg-white/5 transition-all duration-200 text-sm xs:text-base"
            />
          ) : (
            <div className="text-white text-lg font-medium">
              {formData.name || "Untitled Playlist"}
            </div>
          )}
        </div>

        <div>
          <label className="block text-white/80 text-sm font-medium mb-2">
            Description
          </label>
          {isEditing ? (
            <textarea
              value={formData.description}
              onChange={(e) => handleInputChange("description", e.target.value)}
              placeholder="Describe your playlist..."
              rows={3}
              className="w-full px-3 xs:px-4 py-2.5 xs:py-3 bg-white/1  md:backdrop-blur-md border border-white/20 rounded-lg xs:rounded-xl text-white placeholder-white/60 focus:outline-none focus:border-white/40 focus:bg-white/5  transition-all duration-200 resize-none text-sm xs:text-base"
            />
          ) : (
            <div className="text-white/80">
              {formData.description || "No description"}
            </div>
          )}
        </div>

        <div>
          <label className="block text-white/80 text-sm font-medium mb-2">
            Tags
          </label>
          <TagsSelector
            selectedTags={formData.tags}
            onTagsChange={handleTagsChange}
            isEditing={isEditing}
          />
        </div>
      </div>

      {/* Validation hints */}
      {isEditing && (
        <div className="mt-6 p-4 bg-white/5 rounded-xl">
          <h4 className="text-white font-medium mb-2 flex items-center gap-2">
            <ExclamationCircleOutlined className="text-yellow-400" />
            Publishing Requirements
          </h4>
          <ul className="text-sm space-y-1">
            <li
              className={`flex items-center gap-2 ${
                formData.name.trim() ? "text-green-400" : "text-white/60"
              }`}
            >
              <span className="w-1 h-1 rounded-full bg-current"></span>
              Playlist name required
            </li>
            <li
              className={`flex items-center gap-2 ${
                tracks.length > 0 ? "text-green-400" : "text-white/60"
              }`}
            >
              <span className="w-1 h-1 rounded-full bg-current"></span>
              At least one track required
            </li>
          </ul>
        </div>
      )}

      {/* Stats */}
      <div className="mt-6 bg-white/5 rounded-xl p-4">
        <div className="grid grid-cols-2 gap-4 text-center">
          <div>
            <div className="text-2xl font-bold text-white">{tracks.length}</div>
            <div className="text-white/60 text-sm">Tracks</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-white">
              {Math.round(
                tracks.reduce((sum, track) => sum + (track.duration || 0), 0) /
                  60
              )}
              m
            </div>
            <div className="text-white/60 text-sm">Duration</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PlaylistForm;
