import { type FC, memo, useState, useRef } from "react";
import { BaseHeader, HeaderContent } from "../../shared/BaseHeader";
import type { Playlist, PlaylistUpdate } from "../../types/Playlist";
import PlayListDefaultImage from "../../images/Playlist/playlistDef.png";
import { Input, Modal } from "antd";
import TextArea from "antd/es/input/TextArea";
import styled from "styled-components";
import { CloseOutlined } from "@ant-design/icons";
import CustomSwitch from "./components/CustomSwitch";
import { usePlaylistSave } from "../../hooks/usePlaylistSave";

interface PlaylistHeaderProps {
  playlist: Playlist | null;
  isLoading: boolean;
  updateLocal: (updates: Partial<Playlist>) => void;
  fetchPlaylist: (id: string) => Promise<void>;
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

const PlaylistHeader: FC<PlaylistHeaderProps> = ({
  playlist,
  isLoading,
  updateLocal,
  fetchPlaylist,
}) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [localChanges, setLocalChanges] = useState<PlaylistUpdate>({});
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { saveChanges, saving } = usePlaylistSave(playlist?._id || "");

  const subtitle =
    !isLoading && playlist?.owner ? (
      <div className="flex flex-col gap-2">
        {playlist.description && (
          <span
            className="text-white/60 text-base sm:text-lg cursor-pointer"
            onClick={() => setIsModalOpen(true)}
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
        </div>
      </div>
    ) : null;

  const handleImageClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !file.type.startsWith("image/") || file.size > 5 * 1024 * 1024)
      return;

    setSelectedFile(file);
    const reader = new FileReader();
    reader.onload = (e) => setSelectedImage(e.target?.result as string);
    reader.readAsDataURL(file);
  };

  const handleInputChange = (field: keyof PlaylistUpdate, value: string) => {
    setLocalChanges((prev) => ({ ...prev, [field]: value }));
  };

  const handleSwitchChange = (isPublic: boolean) => {
    const privacy = isPublic ? "public" : "private";
    setLocalChanges((prev) => ({ ...prev, privacy }));
  };

  const handleOk = async () => {
    try {
      const changes = selectedFile
        ? { ...localChanges, cover: selectedFile }
        : localChanges;

      console.log("Saving changes:", changes);

      await saveChanges(changes);
      if (selectedFile) {
        await fetchPlaylist(playlist?._id || "");
      }
      updateLocal(changes);
      setIsModalOpen(false);
      resetModal();
    } catch (error) {
      console.error("Save failed:", error);
      alert("Failed to save changes");
    }
  };

  const handleCancel = () => {
    setIsModalOpen(false);
    resetModal();
  };

  const resetModal = () => {
    setLocalChanges({});
    setSelectedImage(null);
    setSelectedFile(null);
  };

  const displayImage =
    selectedImage || playlist?.coverUrl || PlayListDefaultImage;

  // Определяем текущее состояние privacy
  const currentPrivacy = localChanges.privacy || playlist?.privacy || "public";
  const isPublic = currentPrivacy === "public";

  return (
    <div>
      <BaseHeader isLoading={isLoading}>
        <HeaderContent
          image={{
            src: playlist?.coverUrl || PlayListDefaultImage,
            alt: playlist?.name || "Playlist cover",
            className:
              "w-[120px] h-[120px] sm:w-[8vw] sm:h-[8vw] lg:w-[10vw] lg:h-[10vw] rounded-2xl mx-auto sm:mx-0 cursor-pointer",
            callback: () => setIsModalOpen(true),
          }}
          title={{
            text: playlist?.name || "Unknown playlist",
            callback: () => setIsModalOpen(true),
          }}
          subtitle={subtitle}
          isLoading={isLoading}
        />
      </BaseHeader>

      <Modal
        open={isModalOpen}
        onOk={handleOk}
        onCancel={handleCancel}
        closable={false}
        styles={{
          content: { backgroundColor: "#282828" },
          header: { visibility: "hidden" },
        }}
        footer={
          <button
            className="px-10 py-2 rounded-full text-xl bg-white text-black hover:scale-105 transition-all duration-200"
            onClick={handleOk}
            disabled={saving}
          >
            {saving ? "Saving..." : "Save"}
          </button>
        }
      >
        <div className="flex justify-between items-center mb-5">
          <div className="text-white text-2xl font-semibold tracking-wider">
            Playlist changes
          </div>
          <CloseOutlined
            className="text-2xl cursor-pointer"
            style={{ color: "white" }}
            onClick={handleCancel}
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
              onChange={(e) => handleInputChange("description", e.target.value)}
            />
          </div>
        </div>

        {/* Кастомный Switch для приватности */}
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
    </div>
  );
};

export default memo(PlaylistHeader);
