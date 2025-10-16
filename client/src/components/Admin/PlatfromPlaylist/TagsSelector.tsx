import React, { useState, useCallback, useMemo, memo } from "react";
import { CloseOutlined, PlusOutlined } from "@ant-design/icons";

interface TagsSelectorProps {
  selectedTags: string[];
  onTagsChange: (tags: string[]) => void;
  isEditing: boolean;
}

const AVAILABLE_TAGS = [
  "pop",
  "rock",
  "hip-hop",
  "electronic",
  "jazz",
  "classical",
  "indie",
  "alternative",
  "r&b",
  "country",
  "folk",
  "reggae",
  "trending",
  "hits",
  "new releases",
  "chill",
  "workout",
  "party",
  "love songs",
  "sad",
  "happy",
  "energetic",
  "relaxing",
  "focus",
  "sleep",
  "driving",
];

/**
 * Tags selector with dropdown for adding tags
 * Displays selected tags and allows adding/removing
 */
const TagsSelector: React.FC<TagsSelectorProps> = ({
  selectedTags,
  onTagsChange,
  isEditing,
}) => {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  const handleTagAdd = useCallback(
    (tag: string) => {
      if (!selectedTags.includes(tag)) {
        onTagsChange([...selectedTags, tag]);
      }
      setIsDropdownOpen(false);
    },
    [selectedTags, onTagsChange]
  );

  const handleTagRemove = useCallback(
    (tagToRemove: string) => {
      onTagsChange(selectedTags.filter((tag) => tag !== tagToRemove));
    },
    [selectedTags, onTagsChange]
  );

  const availableTagsToAdd = useMemo(
    () => AVAILABLE_TAGS.filter((tag) => !selectedTags.includes(tag)),
    [selectedTags]
  );

  if (!isEditing) {
    return (
      <div className="flex flex-wrap gap-2">
        {selectedTags.length > 0 ? (
          selectedTags.map((tag, index) => (
            <span
              key={index}
              className="px-3 py-1 bg-white/10 text-white/80 text-sm rounded-full"
            >
              {tag}
            </span>
          ))
        ) : (
          <span className="text-white/60 text-sm">No tags</span>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {/* Selected Tags */}
      <div className="flex flex-wrap gap-2 min-h-[40px] p-3 bg-white/5 border border-white/20 rounded-xl">
        {selectedTags.length > 0 ? (
          selectedTags.map((tag, index) => (
            <span
              key={index}
              className="flex items-center gap-2 px-3 py-1 bg-purple-500/20 text-purple-300 text-sm rounded-full"
            >
              {tag}
              <button
                onClick={() => handleTagRemove(tag)}
                className="hover:text-red-400 transition-colors"
              >
                <CloseOutlined className="text-xs" />
              </button>
            </span>
          ))
        ) : (
          <span className="text-white/60 text-sm py-1">
            Click to add tags...
          </span>
        )}
      </div>

      {/* Add Tags Dropdown */}
      <div className="relative">
        <button
          type="button"
          onClick={() => setIsDropdownOpen(!isDropdownOpen)}
          disabled={availableTagsToAdd.length === 0}
          className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
            availableTagsToAdd.length > 0
              ? "bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30"
              : "bg-white/10 text-white/50 cursor-not-allowed"
          }`}
        >
          <PlusOutlined />
          Add Tags ({availableTagsToAdd.length} available)
        </button>

        {/* Dropdown */}
        {isDropdownOpen && availableTagsToAdd.length > 0 && (
          <>
            {/* Backdrop */}
            <div
              className="fixed inset-0 z-10"
              onClick={() => setIsDropdownOpen(false)}
            />

            {/* Dropdown Content */}
            <div className="absolute top-full left-0 mt-2 w-80 max-h-60 overflow-y-auto bg-slate-800/95 backdrop-blur-md border border-white/20 rounded-xl shadow-xl z-20 queue-scroll">
              <div className="p-2">
                <div className="grid grid-cols-2 gap-1">
                  {availableTagsToAdd.map((tag) => (
                    <button
                      key={tag}
                      onClick={() => handleTagAdd(tag)}
                      className="text-left px-3 py-2 text-white/80 hover:bg-white/10 rounded-lg text-sm transition-colors"
                    >
                      {tag}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Limit Warning */}
      {selectedTags.length >= 10 && (
        <div className="text-yellow-400 text-xs">
          Maximum 10 tags recommended for better discoverability
        </div>
      )}
    </div>
  );
};

export default memo(TagsSelector);
