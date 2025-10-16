import { type FC, memo, useState, useRef, useCallback, useMemo } from "react";
import { BaseHeader, HeaderContent } from "../../shared/BaseHeader";
import type { Playlist, PlaylistUpdate } from "../../types/Playlist";
import PlayListDefaultImage from "../../images/Playlist/playlistDef.png";
import { Input, Modal } from "antd";
import TextArea from "antd/es/input/TextArea";
import styled from "styled-components";
import { CloseOutlined, HeartFilled, HeartOutlined } from "@ant-design/icons";
import CustomSwitch from "./components/CustomSwitch";
import { useLikePlaylist } from "../../hooks/useLikePlaylist";
import { useNotification } from "../../hooks/useNotification";

interface PlaylistHeaderProps {
  playlist: Playlist | null;
  isLoading: boolean;
  updateLocal: (updates: Partial<Playlist>) => void;
  canEdit: boolean;
  fetchPlaylist: (id: string) => Promise<void>;
  onCoverFileSelect?: (file: File | null) => void;
}

const StyledInput = styled(Input)`
  &.ant-input {
    background-color: #3e3e3e !important;
    color: white !important;
    border: none !important;
    margin-bottom: 10px;
    height: 20%;

    &::placeholder {
      color: #b3b3b3 !important;
      opacity: 1 !important;
    }

    &:focus {
      border-color: #1db954 !important;
      box-shadow: 0 0 0 2px rgba(29, 185, 84, 0.2) !important;
    }
  }
`;

const StyledTextArea = styled(TextArea)`
  &.ant-input {
    background-color: #3e3e3e !important;
    color: white !important;
    border: none !important;
    height: 75%;

    &::placeholder {
      color: #b3b3b3 !important;
      opacity: 1 !important;
    }

    &:focus {
      border-color: #1db954 !important;
      box-shadow: 0 0 0 2px rgba(29, 185, 84, 0.2) !important;
    }
  }
`;

/**
 * Playlist header component
 * Features batch editing modal and like functionality
 */
const PlaylistHeader: FC<PlaylistHeaderProps> = ({
  playlist,
  isLoading,
  updateLocal,
  canEdit,
  onCoverFileSelect,
}) => {
  const notification = useNotification();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [localChanges, setLocalChanges] = useState<PlaylistUpdate>({});
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const {
    isLiked,
    isLoading: likeLoading,
    toggleLike,
    likeCount,
  } = useLikePlaylist(playlist?._id || "", playlist?.likeCount || 0);

  const handleLikeClick = useCallback(async () => {
    if (!playlist) return;

    try {
      await toggleLike();
      const action = isLiked ? "unliked" : "liked";
      notification.showSuccess(`Playlist ${action}!`);
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Failed to update like status";
      notification.showError(errorMessage);
    }
  }, [playlist, toggleLike, isLiked, notification]);

  const subtitle = useMemo(() => {
    if (isLoading || !playlist?.owner) return null;

    return (
      <div className="flex flex-col gap-2">
        {playlist.description && (
          <span
            className={`text-white/60 text-base sm:text-lg ${
              canEdit ? "cursor-pointer hover:text-white/80" : ""
            }`}
            onClick={canEdit ? () => setIsModalOpen(true) : undefined}
            role={canEdit ? "button" : undefined}
            tabIndex={canEdit ? 0 : undefined}
            onKeyDown={
              canEdit
                ? (e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      setIsModalOpen(true);
                    }
                  }
                : undefined
            }
            aria-label={canEdit ? "Click to edit description" : undefined}
          >
            {playlist.description}
          </span>
        )}

        <div className="flex items-center gap-2 flex-wrap justify-center sm:justify-start">
          <span className="text-white text-base sm:text-lg">
            {typeof playlist.owner === "string"
              ? playlist.owner
              : playlist.owner.username}
          </span>
          <div className="w-[5px] h-[5px] rounded-full bg-white/60" />
          <span className="text-white/60 text-base sm:text-lg">
            {playlist.trackCount}{" "}
            {playlist.trackCount === 1 ? "track" : "tracks"}
          </span>

          <div className="w-[5px] h-[5px] rounded-full bg-white/60" />
          <button
            onClick={handleLikeClick}
            disabled={likeLoading}
            className="flex items-center gap-1 px-2 py-1 rounded-full bg-white/10 hover:bg-white/20 transition-all duration-200 text-sm disabled:opacity-50 disabled:cursor-not-allowed group"
            aria-label={isLiked ? "Unlike playlist" : "Like playlist"}
          >
            {likeLoading ? (
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white/60" />
            ) : isLiked ? (
              <HeartFilled className="text-red-500 group-hover:scale-110 transition-transform" />
            ) : (
              <HeartOutlined className="text-white/60 group-hover:text-red-400 group-hover:scale-110 transition-all" />
            )}
            <span className="text-white/60 group-hover:text-white transition-colors">
              {likeCount}
            </span>
          </button>
        </div>
      </div>
    );
  }, [
    isLoading,
    playlist,
    canEdit,
    likeLoading,
    isLiked,
    likeCount,
    handleLikeClick,
  ]);

  const handleImageClick = useCallback(() => {
    if (!canEdit) return;
    fileInputRef.current?.click();
  }, [canEdit]);

  const handleFileSelect = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0];
      if (!file) return;

      if (!file.type.startsWith("image/")) {
        notification.showError("Please select a valid image file");
        return;
      }

      if (file.size > 5 * 1024 * 1024) {
        notification.showError("Image size must be less than 5MB");
        return;
      }

      setSelectedFile(file);
      const reader = new FileReader();
      reader.onload = (e) => setSelectedImage(e.target?.result as string);
      reader.readAsDataURL(file);
    },
    [notification]
  );

  const handleInputChange = useCallback(
    (field: keyof PlaylistUpdate, value: string) => {
      setLocalChanges((prev) => ({ ...prev, [field]: value }));
    },
    []
  );

  const handleSwitchChange = useCallback((isPublic: boolean) => {
    const privacy = isPublic ? "public" : "private";
    setLocalChanges((prev) => ({ ...prev, privacy }));
  }, []);

  const handleApplyChanges = useCallback(() => {
    if (!playlist) return;

    try {
      const changes: Partial<Playlist> = { ...localChanges };

      if (selectedImage) {
        changes.coverUrl = selectedImage;
      }

      updateLocal(changes);

      if (onCoverFileSelect && selectedFile) {
        onCoverFileSelect(selectedFile);
      }

      setIsModalOpen(false);
      resetModal();

      const hasFileChange = selectedFile ? " (including cover image)" : "";
      notification.showInfo(
        `Changes applied locally${hasFileChange}. Click 'Save Changes' to persist.`
      );
    } catch (error) {
      notification.showError("Failed to apply changes");
    }
  }, [
    playlist,
    localChanges,
    selectedImage,
    selectedFile,
    updateLocal,
    onCoverFileSelect,
    notification,
  ]);

  const handleCancel = useCallback(() => {
    setIsModalOpen(false);
    resetModal();
  }, []);

  const resetModal = useCallback(() => {
    setLocalChanges({});
    setSelectedImage(null);
    setSelectedFile(null);
  }, []);

  const getDisplayImage = useCallback(() => {
    if (selectedImage) return selectedImage;
    if (playlist?.coverUrl) return playlist.coverUrl;
    return PlayListDefaultImage;
  }, [selectedImage, playlist?.coverUrl]);

  const displayImage = getDisplayImage();

  const currentPrivacy = localChanges.privacy || playlist?.privacy || "public";
  const isPublic = currentPrivacy === "public";

  return (
    <div>
      <BaseHeader isLoading={isLoading}>
        <HeaderContent
          image={{
            src: displayImage,
            alt: playlist?.name || "Playlist cover",
            className: `w-[120px] h-[120px] sm:w-[8vw] sm:h-[8vw] lg:w-[10vw] lg:h-[10vw] rounded-2xl mx-auto sm:mx-0 ${
              canEdit
                ? "cursor-pointer hover:opacity-80 transition-opacity"
                : ""
            }`,
            callback: canEdit ? () => setIsModalOpen(true) : undefined,
          }}
          title={{
            text: playlist?.name || "Unknown playlist",
            callback: canEdit ? () => setIsModalOpen(true) : undefined,
            className: canEdit
              ? "cursor-pointer hover:text-white/90 transition-colors"
              : "",
          }}
          subtitle={subtitle}
          isLoading={isLoading}
        />
      </BaseHeader>

      {canEdit && (
        <Modal
          open={isModalOpen}
          onOk={handleApplyChanges}
          onCancel={handleCancel}
          closable={false}
          styles={{
            content: { backgroundColor: "#282828" },
            header: { visibility: "hidden" },
          }}
          footer={
            <div className="flex items-center justify-between">
              <div className="text-white/60 text-sm">
                Changes will be applied locally until you save
              </div>
              <button
                className="px-5 py-2 rounded-full text-xl bg-white text-black hover:scale-105 transition-all duration-200 disabled:opacity-50"
                onClick={handleApplyChanges}
                aria-label="Apply changes locally"
              >
                Apply
              </button>
            </div>
          }
        >
          <div className="flex justify-between items-center mb-5">
            <div className="text-white text-2xl font-semibold tracking-wider">
              Edit Playlist
            </div>
            <CloseOutlined
              className="text-2xl cursor-pointer hover:text-white/80 transition-colors"
              style={{ color: "white" }}
              onClick={handleCancel}
              aria-label="Close modal"
            />
          </div>

          <div className="flex gap-5">
            <div className="relative w-full max-w-[180px] h-[180px] hover:scale-105 transition-all duration-200 cursor-pointer">
              <img
                src={displayImage}
                alt={playlist?.name || "Playlist cover"}
                className="w-full h-full rounded-2xl drop-shadow-[0_0_4px_rgba(255,255,255,0.3)] object-cover"
                onClick={handleImageClick}
              />
              <div
                className="absolute inset-0 bg-black/50 rounded-2xl opacity-0 hover:opacity-100 transition-opacity duration-200 flex items-center justify-center"
                onClick={handleImageClick}
              >
                <span className="text-white text-sm font-medium">
                  Choose photo
                </span>
              </div>
            </div>

            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleFileSelect}
              className="hidden"
            />

            <div className="w-full">
              <StyledInput
                defaultValue={playlist?.name}
                placeholder="Playlist name"
                onChange={(e) => handleInputChange("name", e.target.value)}
              />
              <StyledTextArea
                rows={4}
                defaultValue={playlist?.description}
                placeholder="Add description (optional)"
                onChange={(e) =>
                  handleInputChange("description", e.target.value)
                }
              />
            </div>
          </div>

          <div className="mt-5 flex items-center justify-between">
            <div className="text-white text-base font-medium">
              Playlist privacy
            </div>
            <div className="pr-4">
              <CustomSwitch
                checked={isPublic}
                onChange={handleSwitchChange}
                checkedLabel="Public"
                uncheckedLabel="Private"
                className="ml-4"
              />
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};

export default memo(PlaylistHeader);
