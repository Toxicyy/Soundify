import { useState, useRef, useCallback, useMemo, useEffect } from "react";
import { Modal } from "antd";
import { CloseOutlined, CameraOutlined } from "@ant-design/icons";
import { motion, AnimatePresence } from "framer-motion";
import { useNotification } from "../../../hooks/useNotification";
import { type Artist } from "../../../types/ArtistData";
import {
  StyledInput,
  StyledTextArea,
  GlassButton,
  ModalContainer,
  FileUploadZone,
} from "../../../shared/components/StyledComponents";
import { api } from "../../../shared/api";

/**
 * Edit profile modal for updating artist name, bio, and avatar
 * Features form validation, drag-and-drop file upload, and scroll handling
 */

interface EditProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  artist: Artist;
  onSave?: (updatedArtist: Partial<Artist>) => void;
}

interface FormData {
  name: string;
  bio: string;
}

interface FileState {
  file: File | null;
  preview: string | null;
  isDragActive: boolean;
}

interface ValidationErrors {
  name?: string;
  bio?: string;
  file?: string;
}

const EditProfileModal: React.FC<EditProfileModalProps> = ({
  isOpen,
  onClose,
  artist,
  onSave,
}) => {
  const { showSuccess, showError, showWarning } = useNotification();

  const [formData, setFormData] = useState<FormData>({
    name: artist.name || "",
    bio: artist.bio || "",
  });

  const [fileState, setFileState] = useState<FileState>({
    file: null,
    preview: null,
    isDragActive: false,
  });

  const [isLoading, setIsLoading] = useState(false);
  const [validationErrors, setValidationErrors] = useState<ValidationErrors>(
    {}
  );

  const fileInputRef = useRef<HTMLInputElement>(null);
  const dragCounter = useRef(0);

  useEffect(() => {
    if (isOpen) {
      const scrollY = window.scrollY;

      document.body.style.position = "fixed";
      document.body.style.top = `-${scrollY}px`;
      document.body.style.width = "100%";

      return () => {
        document.body.style.position = "";
        document.body.style.top = "";
        document.body.style.width = "";
        window.scrollTo(0, scrollY);
      };
    }
  }, [isOpen]);

  useEffect(() => {
    if (isOpen) {
      setFormData({
        name: artist.name || "",
        bio: artist.bio || "",
      });
      setFileState({
        file: null,
        preview: null,
        isDragActive: false,
      });
      setValidationErrors({});
    }
  }, [isOpen, artist]);

  const validateForm = useCallback((): ValidationErrors => {
    const errors: ValidationErrors = {};

    if (!formData.name.trim()) {
      errors.name = "Artist name is required";
    } else if (formData.name.trim().length < 2) {
      errors.name = "Artist name must be at least 2 characters";
    } else if (formData.name.trim().length > 50) {
      errors.name = "Artist name must be less than 50 characters";
    }

    if (formData.bio.length > 500) {
      errors.bio = "Biography must be less than 500 characters";
    }

    return errors;
  }, [formData]);

  const hasChanges = useMemo(() => {
    return (
      formData.name.trim() !== (artist.name || "") ||
      formData.bio !== (artist.bio || "") ||
      fileState.file !== null
    );
  }, [formData, artist, fileState.file]);

  const validateFile = useCallback((file: File): string | null => {
    if (!file.type.startsWith("image/")) {
      return "Please select a valid image file";
    }

    if (file.size > 5 * 1024 * 1024) {
      return "Image size must be less than 5MB";
    }

    const allowedTypes = ["image/jpeg", "image/jpg", "image/png", "image/webp"];
    if (!allowedTypes.includes(file.type)) {
      return "Only JPEG, PNG and WebP images are allowed";
    }

    return null;
  }, []);

  const handleFileSelect = useCallback(
    (file: File) => {
      const error = validateFile(file);
      if (error) {
        showError(error);
        return;
      }

      const reader = new FileReader();
      reader.onload = (e) => {
        const result = e.target?.result as string;
        setFileState({
          file,
          preview: result,
          isDragActive: false,
        });
      };
      reader.readAsDataURL(file);
    },
    [validateFile, showError]
  );

  const handleDragEnter = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    dragCounter.current++;
    if (e.dataTransfer.items && e.dataTransfer.items.length > 0) {
      setFileState((prev) => ({ ...prev, isDragActive: true }));
    }
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    dragCounter.current--;
    if (dragCounter.current === 0) {
      setFileState((prev) => ({ ...prev, isDragActive: false }));
    }
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setFileState((prev) => ({ ...prev, isDragActive: false }));
      dragCounter.current = 0;

      if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
        const file = e.dataTransfer.files[0];
        handleFileSelect(file);
        e.dataTransfer.clearData();
      }
    },
    [handleFileSelect]
  );

  const handleInputChange = useCallback(
    <K extends keyof FormData>(field: K, value: FormData[K]) => {
      setFormData((prev) => ({ ...prev, [field]: value }));

      if (validationErrors[field]) {
        setValidationErrors((prev) => {
          const newErrors = { ...prev };
          delete newErrors[field];
          return newErrors;
        });
      }
    },
    [validationErrors]
  );

  const handleSave = useCallback(async () => {
    const errors = validateForm();
    setValidationErrors(errors);

    if (Object.keys(errors).length > 0) {
      showWarning("Please fix the errors before saving");
      return;
    }

    try {
      setIsLoading(true);

      const formDataToSend = new FormData();
      formDataToSend.append("name", formData.name.trim());
      formDataToSend.append("bio", formData.bio);

      if (fileState.file) {
        formDataToSend.append("avatar", fileState.file);
      }

      const response = await api.artist.update(
        artist._id,
        formDataToSend,
        true
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || "Failed to update profile");
      }

      const data = await response.json();

      if (data.success) {
        showSuccess("Profile updated successfully!");

        const updatedFields: Partial<Artist> = {
          name: formData.name.trim(),
          bio: formData.bio,
        };

        if (fileState.preview) {
          updatedFields.avatar = fileState.preview;
        }

        onSave?.(updatedFields);
        handleClose();
      } else {
        throw new Error(data.message || "Failed to update profile");
      }
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Failed to update profile";
      showError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, [
    validateForm,
    formData,
    fileState,
    artist._id,
    onSave,
    showSuccess,
    showError,
    showWarning,
  ]);

  const handleClose = useCallback(() => {
    if (isLoading) return;

    if (hasChanges) {
      const confirmClose = window.confirm(
        "You have unsaved changes. Are you sure you want to close?"
      );
      if (!confirmClose) return;
    }

    setFormData({
      name: artist.name || "",
      bio: artist.bio || "",
    });
    setFileState({
      file: null,
      preview: null,
      isDragActive: false,
    });
    setValidationErrors({});
    onClose();
  }, [isLoading, hasChanges, artist, onClose]);

  const displayImage = useMemo(() => {
    return fileState.preview || artist.avatar || "/default-artist-avatar.png";
  }, [fileState.preview, artist.avatar]);

  const artistStats = useMemo(
    () => [
      {
        label: "Followers",
        value: artist.followerCount.toLocaleString(),
      },
      {
        label: "Verified",
        value: artist.isVerified ? "✓ Verified" : "Not verified",
      },
      {
        label: "Member since",
        value: new Date(artist.createdAt).getFullYear(),
      },
      {
        label: "Genres",
        value: artist.genres?.length
          ? `${artist.genres.length} genres`
          : "None",
      },
    ],
    [artist]
  );

  return (
    <ModalContainer>
      <Modal
        open={isOpen}
        onCancel={handleClose}
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
        footer={null}
        maskClosable={!isLoading && !hasChanges}
        destroyOnClose={true}
        getContainer={() => document.body}
        style={{
          top: "20px",
          paddingBottom: "40px",
        }}
      >
        <div className="p-4 sm:p-6 space-y-4 sm:space-y-6">
          <div className="flex justify-between items-center pb-4 border-b border-white/10">
            <div className="text-white text-lg sm:text-xl md:text-2xl font-semibold tracking-wider">
              Edit Profile
            </div>
            <button
              onClick={handleClose}
              disabled={isLoading}
              className="text-xl sm:text-2xl text-white hover:text-white/70 transition-colors disabled:opacity-50 p-2 -m-2"
              aria-label="Close modal"
            >
              <CloseOutlined />
            </button>
          </div>

          <div className="flex flex-col lg:flex-row gap-4 sm:gap-6">
            <div className="flex flex-col items-center lg:items-start">
              <label className="block text-white/80 text-sm font-medium mb-3 self-start lg:self-center">
                Avatar
              </label>

              <div className="relative group">
                <FileUploadZone
                  isDragActive={fileState.isDragActive}
                  hasFile={!!fileState.file}
                  onDragEnter={handleDragEnter}
                  onDragLeave={handleDragLeave}
                  onDragOver={handleDragOver}
                  onDrop={handleDrop}
                  onClick={() => fileInputRef.current?.click()}
                  className="w-32 h-32 sm:w-36 sm:h-36 lg:w-40 lg:h-40 rounded-2xl border-2 border-dashed p-0 flex items-center justify-center cursor-pointer transition-all duration-200"
                >
                  <img
                    src={displayImage}
                    alt="Artist avatar"
                    className="w-full h-full rounded-2xl object-cover"
                    loading="lazy"
                  />

                  <div className="absolute inset-0 bg-black/60 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-center justify-center">
                    <div className="text-center">
                      <CameraOutlined className="text-white text-xl sm:text-2xl mb-2" />
                      <span className="text-white text-xs sm:text-sm font-medium">
                        {fileState.isDragActive ? "Drop here" : "Change photo"}
                      </span>
                    </div>
                  </div>
                </FileUploadZone>

                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/jpeg,image/jpg,image/png,image/webp"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) handleFileSelect(file);
                  }}
                  className="hidden"
                  disabled={isLoading}
                  aria-label="Upload avatar image"
                />
              </div>

              <p className="text-xs text-white/50 mt-2 text-center lg:text-left max-w-[200px]">
                Drag & drop or click to upload
                <br />
                Max 5MB • JPEG, PNG, WebP
              </p>
            </div>

            <div className="flex-1 space-y-4 sm:space-y-5">
              <div>
                <label className="block text-white/80 text-sm font-medium mb-2">
                  Artist Name *
                </label>
                <StyledInput
                  value={formData.name}
                  placeholder="Enter artist name"
                  onChange={(e) => handleInputChange("name", e.target.value)}
                  disabled={isLoading}
                  status={validationErrors.name ? "error" : ""}
                  aria-describedby="name-error"
                  maxLength={50}
                />
                <AnimatePresence>
                  {validationErrors.name && (
                    <motion.p
                      id="name-error"
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      className="text-red-400 text-xs mt-1"
                      role="alert"
                    >
                      {validationErrors.name}
                    </motion.p>
                  )}
                </AnimatePresence>
              </div>

              <div>
                <label className="block text-white/80 text-sm font-medium mb-2">
                  Biography
                </label>
                <StyledTextArea
                  rows={4}
                  value={formData.bio}
                  placeholder="Tell your fans about yourself..."
                  onChange={(e) => handleInputChange("bio", e.target.value)}
                  disabled={isLoading}
                  maxLength={500}
                  showCount
                  status={validationErrors.bio ? "error" : ""}
                  aria-describedby="bio-error"
                />
                <AnimatePresence>
                  {validationErrors.bio && (
                    <motion.p
                      id="bio-error"
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      className="text-red-400 text-xs mt-1"
                      role="alert"
                    >
                      {validationErrors.bio}
                    </motion.p>
                  )}
                </AnimatePresence>
              </div>

              <div className="bg-white/5 rounded-lg p-3 sm:p-4 border border-white/10">
                <h4 className="text-white font-semibold mb-3 text-sm">
                  Current Stats
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 text-xs">
                  {artistStats.map((stat, index) => (
                    <div key={index}>
                      <span className="text-white/60">{stat.label}:</span>
                      <p className="text-white font-medium">{stat.value}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row justify-end gap-3 pt-4 border-t border-white/10">
            <GlassButton
              onClick={handleClose}
              disabled={isLoading}
              variant="secondary"
              size="md"
              className="order-2 sm:order-1"
            >
              Cancel
            </GlassButton>

            <GlassButton
              onClick={handleSave}
              disabled={
                !hasChanges ||
                isLoading ||
                Object.keys(validationErrors).length > 0
              }
              variant="primary"
              size="md"
              className="order-1 sm:order-2"
            >
              {isLoading ? "Saving..." : "Save Changes"}
            </GlassButton>
          </div>
        </div>
      </Modal>
    </ModalContainer>
  );
};

export default EditProfileModal;
