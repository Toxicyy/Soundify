import { useRef, useState, type FC } from "react";
import { BaseHeader, HeaderContent } from "../../shared/BaseHeader";
import { Input, Modal } from "antd";
import { CloseOutlined } from "@ant-design/icons";
import styled from "styled-components";
import TextArea from "antd/es/input/TextArea";
import type { ArtistCreate } from "../../Pages/BecomeAnArtist";

interface HeaderProps {
  imageSrc: string;
  localChanges: ArtistCreate;
  setLocalChanges: (changes: Partial<ArtistCreate>) => void;
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
  &.ant-input {
    background-color: rgba(255, 255, 255, 0.1) !important;
    color: white !important;
    border: 1px solid rgba(255, 255, 255, 0.2) !important;
    border-radius: 8px;
    height: 75%;

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

const Header: FC<HeaderProps> = ({
  imageSrc,
  localChanges,
  setLocalChanges,
}) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [tempChanges, setTempChanges] = useState<Partial<ArtistCreate>>({});
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImageClick = () => {
    fileInputRef.current?.click();
  };

  const handleOk = () => {
    try {
      // Объединяем временные изменения с изображением и файлом
      const finalChanges: Partial<ArtistCreate> = {
        ...tempChanges,
      };

      // Если выбрано новое изображение, сохраняем и base64 для отображения, и File для загрузки
      if (selectedImage && selectedFile) {
        finalChanges.imageSrc = selectedImage; // base64 для отображения
        finalChanges.imageFile = selectedFile; // File объект для загрузки
      }

      setLocalChanges(finalChanges);
      console.log("Saving changes:", finalChanges);

      setIsModalOpen(false);
      resetModal();
    } catch (error) {
      console.error("Save failed:", error);
      alert("Failed to save changes");
    }
  };

  const resetModal = () => {
    setTempChanges({});
    setSelectedImage(null);
    setSelectedFile(null);
  };

  const handleCancel = () => {
    setIsModalOpen(false);
    resetModal();
  };

  // Показываем выбранное изображение или текущее изображение художника
  const displayImage = selectedImage || localChanges.imageSrc || imageSrc;

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !file.type.startsWith("image/") || file.size > 5 * 1024 * 1024)
      return;

    // Сохраняем File объект
    setSelectedFile(file);

    // Создаем base64 для предварительного просмотра
    const reader = new FileReader();
    reader.onload = (e) => {
      const result = e.target?.result as string;
      setSelectedImage(result);
    };
    reader.readAsDataURL(file);
  };

  const handleInputChange = (field: keyof ArtistCreate, value: string) => {
    setTempChanges((prev) => ({ ...prev, [field]: value }));
  };

  return (
    <div>
      <BaseHeader isLoading={false}>
        <HeaderContent
          image={{
            src: localChanges.imageSrc || imageSrc,
            alt: "Artist avatar",
            className:
              "w-[120px] h-[120px] lg:w-[12vw] lg:h-[12vw] xl:w-[10vw] xl:h-[10vw] rounded-full mx-auto sm:mx-0 cursor-pointer",
            callback: () => setIsModalOpen(true),
          }}
          title={{
            text: localChanges.name || "Become an artist",
            callback: () => setIsModalOpen(true),
          }}
          subtitle={
            localChanges.bio ||
            "Create your own music and share it with the world."
          }
          isLoading={false}
        />
      </BaseHeader>
      <Modal
        open={isModalOpen}
        onOk={handleOk}
        onCancel={handleCancel}
        closable={false}
        styles={{
          content: {
            backgroundColor: "rgba(40, 40, 40, 0.95)",
            backdropFilter: "blur(10px)",
            border: "1px solid rgba(255, 255, 255, 0.1)",
          },
          header: { visibility: "hidden" },
        }}
        footer={
          <button
            className="px-10 py-2 rounded-full text-xl bg-gradient-to-r from-[#1db954] to-[#1ed760] text-white hover:scale-105 transition-all duration-200 backdrop-blur-sm"
            onClick={handleOk}
            disabled={false}
          >
            Save
          </button>
        }
      >
        <div className="flex justify-between items-center mb-5">
          <div className="text-white text-2xl font-semibold tracking-wider">
            Artist changes
          </div>
          <CloseOutlined
            className="text-2xl cursor-pointer hover:text-white/70 transition-colors"
            style={{ color: "white" }}
            onClick={handleCancel}
          />
        </div>

        <div className="flex gap-5">
          <div className="relative w-full max-w-[180px] h-[180px] hover:scale-105 transition-all duration-200 cursor-pointer">
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
              value={
                tempChanges.name !== undefined
                  ? tempChanges.name
                  : localChanges.name || ""
              }
              placeholder="Artist name"
              onChange={(e) => handleInputChange("name", e.target.value)}
            />
            <StyledTextArea
              rows={4}
              value={
                tempChanges.bio !== undefined
                  ? tempChanges.bio
                  : localChanges.bio || ""
              }
              placeholder="Add description (optional)"
              onChange={(e) => handleInputChange("bio", e.target.value)}
            />
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default Header;
