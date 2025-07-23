import { useState, useRef } from "react";
import { Modal, Input } from "antd";
import { CloseOutlined } from "@ant-design/icons";
import styled from "styled-components";
import { useNotification } from "../../../hooks/useNotification";
import TextArea from "antd/es/input/TextArea";

interface Artist {
  _id: string;
  name: string;
  avatar?: string;
  bio?: string;
  followerCount: number;
  isVerified: boolean;
  createdAt: string;
  genres: string[];
  socialLinks: {
    spotify?: string;
    instagram?: string;
    twitter?: string;
  };
}

interface EditProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  artist: Artist;
  onSave?: (updatedArtist: Partial<Artist>) => void;
}

const StyledInput = styled(Input)`
  &.ant-input {
    background-color: rgba(255, 255, 255, 0.1) !important;
    color: white !important;
    border: 1px solid rgba(255, 255, 255, 0.2) !important;
    border-radius: 8px;
    margin-bottom: 10px;
    height: 20%;

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
  height: 75%;

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

const EditProfileModal: React.FC<EditProfileModalProps> = ({
  isOpen,
  onClose,
  artist,
  onSave,
}) => {
  const { showSuccess, showError } = useNotification();

  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [tempChanges, setTempChanges] = useState<Partial<Artist>>({});
  const [isLoading, setIsLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImageClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (
      !file ||
      !file.type.startsWith("image/") ||
      file.size > 5 * 1024 * 1024
    ) {
      if (file && file.size > 5 * 1024 * 1024) {
        showError("Image size must be less than 5MB");
      }
      return;
    }

    setSelectedFile(file);

    const reader = new FileReader();
    reader.onload = (e) => {
      const result = e.target?.result as string;
      setSelectedImage(result);
    };
    reader.readAsDataURL(file);
  };

  const handleInputChange = (field: keyof Artist, value: string) => {
    setTempChanges((prev) => ({ ...prev, [field]: value }));
  };

  const handleSave = async () => {
    try {
      setIsLoading(true);

      const finalChanges: Partial<Artist> = {
        ...tempChanges,
      };

      // Если выбрано новое изображение, добавляем его
      if (selectedImage && selectedFile) {
        // В реальном приложении здесь был бы отдельный API для загрузки изображения
        finalChanges.avatar = selectedImage; // base64 для предварительного просмотра
        // finalChanges.imageFile = selectedFile; // File объект для загрузки на сервер
      }

      // Отправляем запрос на сервер
      const formData = new FormData();

      // Добавляем текстовые поля
      if (finalChanges.name) formData.append("name", finalChanges.name);
      if (finalChanges.bio) formData.append("bio", finalChanges.bio);

      // Добавляем файл изображения, если есть
      if (selectedFile) {
        formData.append("avatar", selectedFile);
      }

      const response = await fetch(
        `http://localhost:5000/api/artists/${artist._id}`,
        {
          method: "PUT",
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
            // НЕ добавляем Content-Type для FormData
          },
          body: formData,
        }
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || "Failed to update profile");
      }

      const data = await response.json();

      if (data.success) {
        showSuccess("Profile updated successfully!");
        onSave?.(finalChanges);
        handleClose();
      } else {
        throw new Error(data.message || "Failed to update profile");
      }
    } catch (error) {
      console.error("Save failed:", error);
      const errorMessage =
        error instanceof Error ? error.message : "Failed to update profile";
      showError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    if (!isLoading) {
      resetModal();
      onClose();
    }
  };

  const resetModal = () => {
    setTempChanges({});
    setSelectedImage(null);
    setSelectedFile(null);
  };

  // Показываем выбранное изображение или текущий аватар художника
  const displayImage =
    selectedImage || artist.avatar || "/default-artist-avatar.png";

  const hasChanges =
    Object.keys(tempChanges).length > 0 || selectedFile !== null;

  return (
    <Modal
      open={isOpen}
      onCancel={handleClose}
      closable={false}
      width={550}
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
      maskClosable={!isLoading}
    >
      <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div className="text-white text-2xl font-semibold tracking-wider">
            Edit Profile
          </div>
          <CloseOutlined
            className="text-2xl cursor-pointer hover:text-white/70 transition-colors"
            style={{ color: "white" }}
            onClick={handleClose}
          />
        </div>

        {/* Form */}
        <div className="flex gap-5">
          {/* Avatar Section */}
          <div className="flex flex-col items-center">
            <label className="block text-white/80 text-sm font-medium mb-2">
              Avatar
            </label>
            <div className="relative w-[140px] h-[140px] hover:scale-105 transition-all duration-200 cursor-pointer">
              <img
                src={displayImage}
                alt="Artist avatar"
                className="w-full h-full rounded-2xl drop-shadow-[0_0_4px_rgba(255,255,255,0.3)] object-cover border border-white/20"
                onClick={handleImageClick}
              />
              <div
                className="absolute inset-0 bg-black/50 rounded-2xl opacity-0 hover:opacity-100 transition-opacity duration-200 flex items-center justify-center backdrop-blur-sm"
                onClick={handleImageClick}
              >
                <span className="text-white text-sm font-medium text-center">
                  Choose
                  <br />
                  photo
                </span>
              </div>
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleFileSelect}
              className="hidden"
              disabled={isLoading}
            />
          </div>

          {/* Form Fields */}
          <div className="flex-1 space-y-4">
            <div>
              <label className="block text-white/80 text-sm font-medium mb-2">
                Artist Name
              </label>
              <StyledInput
                value={
                  tempChanges.name !== undefined
                    ? tempChanges.name
                    : artist.name || ""
                }
                placeholder="Artist name"
                onChange={(e) => handleInputChange("name", e.target.value)}
                disabled={isLoading}
              />
            </div>

            <div>
              <label className="block text-white/80 text-sm font-medium mb-2">
                Biography
              </label>
              <StyledTextArea
                rows={4}
                value={
                  tempChanges.bio !== undefined
                    ? tempChanges.bio
                    : artist.bio || ""
                }
                placeholder="Tell your fans about yourself..."
                onChange={(e) => handleInputChange("bio", e.target.value)}
                disabled={isLoading}
                maxLength={500}
                showCount
              />
            </div>

            {/* Current Stats (Read-only) */}
            <div className="bg-white/5 rounded-lg p-3 border border-white/10">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-white/60">Followers:</span>
                  <p className="text-white font-medium">
                    {artist.followerCount.toLocaleString()}
                  </p>
                </div>
                <div>
                  <span className="text-white/60">Verified:</span>
                  <p className="text-white font-medium">
                    {artist.isVerified ? "✓ Verified" : "Not verified"}
                  </p>
                </div>
                <div>
                  <span className="text-white/60">Member since:</span>
                  <p className="text-white font-medium">
                    {new Date(artist.createdAt).getFullYear()}
                  </p>
                </div>
                <div>
                  <span className="text-white/60">Genres:</span>
                  <p className="text-white font-medium">
                    {artist.genres?.length
                      ? `${artist.genres.length} genres`
                      : "None"}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-3 pt-4">
          <button
            onClick={handleClose}
            disabled={isLoading}
            className="px-6 py-2 rounded-lg bg-white/10 text-white border border-white/20 hover:bg-white/20 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={!hasChanges || isLoading}
            className="px-8 py-2 rounded-lg bg-gradient-to-r from-green-500 to-emerald-500 text-white font-semibold hover:from-green-600 hover:to-emerald-600 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:from-green-500 disabled:hover:to-emerald-500"
          >
            {isLoading ? "Saving..." : "Save Changes"}
          </button>
        </div>
      </div>
    </Modal>
  );
};

export default EditProfileModal;
