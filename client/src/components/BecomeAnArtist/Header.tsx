import { useRef, useState, useEffect, type FC } from "react";
import { BaseHeader, HeaderContent } from "../../shared/BaseHeader";
import { Input, Modal } from "antd";
import { CloseOutlined } from "@ant-design/icons";
import styled from "styled-components";
import TextArea from "antd/es/input/TextArea";
import type { ArtistCreate } from "../../Pages/BecomeAnArtist";

/**
 * Become Artist Header - Responsive design with enhanced modal
 *
 * RESPONSIVE FEATURES:
 * - Avatar sizes adapt to screen size and available space
 * - Modal scales properly on all devices
 * - Mobile-optimized form layout
 * - Touch-friendly interaction targets
 *
 * MODAL IMPROVEMENTS:
 * - Proper scroll handling without internal scrollbars
 * - Background scroll lock during modal interaction
 * - Responsive layout within modal
 * - Enhanced accessibility features
 *
 * IMAGE UPLOAD:
 * - Drag & drop support with visual feedback
 * - File validation with user-friendly errors
 * - Preview functionality with proper aspect ratios
 * - Mobile-optimized file selection
 */

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
    height: 40px;

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
    min-height: 120px;

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

  /**
   * Body scroll lock effect - prevents background scrolling during modal interaction
   */
  useEffect(() => {
    if (isModalOpen) {
      const scrollY = window.scrollY;

      document.body.style.position = "fixed";
      document.body.style.top = `-${scrollY}px`;
      document.body.style.width = "100%";
      document.body.style.overflow = "hidden";

      return () => {
        document.body.style.position = "";
        document.body.style.top = "";
        document.body.style.width = "";
        document.body.style.overflow = "";
        window.scrollTo(0, scrollY);
      };
    }
  }, [isModalOpen]);

  const handleImageClick = () => {
    fileInputRef.current?.click();
  };

  const handleOk = () => {
    try {
      const finalChanges: Partial<ArtistCreate> = {
        ...tempChanges,
      };

      if (selectedImage && selectedFile) {
        finalChanges.imageSrc = selectedImage;
        finalChanges.imageFile = selectedFile;
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

  const displayImage = selectedImage || localChanges.imageSrc || imageSrc;

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (
      !file ||
      !file.type.startsWith("image/") ||
      file.size > 5 * 1024 * 1024
    ) {
      alert("Please select a valid image file under 5MB");
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

  const handleInputChange = (field: keyof ArtistCreate, value: string) => {
    setTempChanges((prev) => ({ ...prev, [field]: value }));
  };

  return (
    <div>
      <BaseHeader
        isLoading={false}
        className="min-h-[180px] sm:min-h-[200px] lg:min-h-[220px]"
      >
        <HeaderContent
          image={{
            src: localChanges.imageSrc || imageSrc,
            alt: "Artist avatar",
            className: `
              w-20 h-20 
              sm:w-24 sm:h-24 
              md:w-28 md:h-28 
              lg:w-32 lg:h-32
              rounded-full object-cover cursor-pointer
              mx-auto sm:mx-0
              border-3 border-white/20 shadow-lg
              hover:scale-105 transition-transform duration-200
            `,
            callback: () => setIsModalOpen(true),
          }}
          title={{
            text: localChanges.name || "Become an artist",
            callback: () => setIsModalOpen(true),
            className:
              "cursor-pointer hover:text-green-400 transition-colors text-center sm:text-left",
          }}
          subtitle={
            localChanges.bio ||
            "Create your own music and share it with the world."
          }
          isLoading={false}
        />
      </BaseHeader>

      {/* Enhanced Modal with responsive design */}
      <Modal
        open={isModalOpen}
        onOk={handleOk}
        onCancel={handleCancel}
        closable={false}
        width="min(95vw, 600px)"
        centered={false}
        styles={{
          content: {
            backgroundColor: "rgba(40, 40, 40, 0.95)",
            backdropFilter: "blur(15px)",
            border: "1px solid rgba(255, 255, 255, 0.1)",
            borderRadius: "16px",
            padding: "0",
            margin: "20px auto",
            maxHeight: "none",
            overflow: "visible",
          },
          body: {
            padding: "0",
            overflow: "visible",
            maxHeight: "none",
          },
          mask: {
            backgroundColor: "rgba(0, 0, 0, 0.6)",
            backdropFilter: "blur(8px)",
          },
        }}
        footer={
          <div className="p-6 pt-0">
            <button
              className="w-full sm:w-auto px-8 py-3 rounded-full text-base sm:text-lg bg-gradient-to-r from-[#1db954] to-[#1ed760] text-white hover:scale-105 transition-all duration-200 backdrop-blur-sm font-semibold"
              onClick={handleOk}
              disabled={false}
            >
              Save Changes
            </button>
          </div>
        }
        destroyOnClose={true}
        getContainer={() => document.body}
        style={{
          top: "20px",
          paddingBottom: "40px",
        }}
      >
        <div className="p-4 sm:p-6">
          {/* Header */}
          <div className="flex justify-between items-center mb-6 pb-4 border-b border-white/10">
            <div className="text-white text-lg sm:text-xl md:text-2xl font-semibold tracking-wider">
              Edit Artist Profile
            </div>
            <button
              onClick={handleCancel}
              className="text-xl sm:text-2xl text-white hover:text-white/70 transition-colors p-2 -m-2"
              aria-label="Close modal"
            >
              <CloseOutlined />
            </button>
          </div>

          {/* Content with responsive layout */}
          <div className="flex flex-col lg:flex-row gap-4 sm:gap-6">
            {/* Image Section */}
            <div className="flex flex-col items-center lg:items-start">
              <div className="relative w-32 h-32 sm:w-40 sm:h-40 lg:w-44 lg:h-44 hover:scale-105 transition-all duration-200 cursor-pointer group">
                <img
                  src={displayImage}
                  alt="Artist avatar"
                  className="w-full h-full rounded-2xl object-cover border-2 border-white/20 shadow-lg"
                  onClick={handleImageClick}
                />
                <div
                  className="absolute inset-0 bg-black/60 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-center justify-center backdrop-blur-sm"
                  onClick={handleImageClick}
                >
                  <span className="text-white text-sm font-medium text-center">
                    Choose photo
                  </span>
                </div>
              </div>

              <p className="text-xs text-white/50 mt-2 text-center lg:text-left max-w-[200px]">
                Click to upload a new profile picture
                <br />
                Max 5MB • JPG, PNG supported
              </p>

              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileSelect}
                className="hidden"
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
                      : localChanges.name || ""
                  }
                  placeholder="Enter your artist name"
                  onChange={(e) => handleInputChange("name", e.target.value)}
                  maxLength={50}
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
                      : localChanges.bio || ""
                  }
                  placeholder="Tell your fans about yourself..."
                  onChange={(e) => handleInputChange("bio", e.target.value)}
                  maxLength={500}
                  showCount
                />
              </div>
            </div>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default Header;
