import { useState, useRef, useCallback, useMemo } from "react";
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

/**
 * EditProfileModal - оптимизированная модалка редактирования профиля артиста
 *
 * Особенности:
 * - Использование общих styled-components
 * - Полная адаптивность с responsive дизайном
 * - Drag & Drop для загрузки изображений
 * - Preview изображений перед загрузкой
 * - Валидация форм на клиенте
 * - Оптимизированная загрузка с прогрессом
 * - Улучшенная доступность (a11y)
 * - Мемоизация для производительности
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

  // State management
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

  // Валидация формы
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

  // Проверка изменений
  const hasChanges = useMemo(() => {
    return (
      formData.name.trim() !== (artist.name || "") ||
      formData.bio !== (artist.bio || "") ||
      fileState.file !== null
    );
  }, [formData, artist, fileState.file]);

  // Валидация файла
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

  // Обработка выбора файла
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

  // Drag & Drop handlers
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

  // Обработка изменения полей формы
  const handleInputChange = useCallback(
    <K extends keyof FormData>(field: K, value: FormData[K]) => {
      setFormData((prev) => ({ ...prev, [field]: value }));

      // Очистка ошибки валидации при изменении поля
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

  // Обработка сохранения
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

      const response = await fetch(
        `http://localhost:5000/api/artists/${artist._id}`,
        {
          method: "PUT",
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
          body: formDataToSend,
        }
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || "Failed to update profile");
      }

      const data = await response.json();

      if (data.success) {
        showSuccess("Profile updated successfully!");

        // Обновляем данные артиста
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
      console.error("Save failed:", error);
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

  // Обработка закрытия модалки
  const handleClose = useCallback(() => {
    if (isLoading) return;

    if (hasChanges) {
      const confirmClose = window.confirm(
        "You have unsaved changes. Are you sure you want to close?"
      );
      if (!confirmClose) return;
    }

    // Сброс состояния
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

  // Мемоизированное изображение для отображения
  const displayImage = useMemo(() => {
    return fileState.preview || artist.avatar || "/default-artist-avatar.png";
  }, [fileState.preview, artist.avatar]);

  // Мемоизированные статистики
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
        width={600}
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
        maskClosable={!isLoading && !hasChanges}
      >
        <div className="space-y-6">
          {/* Header */}
          <div className="flex justify-between items-center">
            <div className="text-white text-xl sm:text-2xl font-semibold tracking-wider">
              Edit Profile
            </div>
            <button
              onClick={handleClose}
              disabled={isLoading}
              className="text-2xl text-white hover:text-white/70 transition-colors disabled:opacity-50"
              aria-label="Close modal"
            >
              <CloseOutlined />
            </button>
          </div>

          {/* Form */}
          <div className="flex flex-col sm:flex-row gap-5">
            {/* Avatar Section */}
            <div className="flex flex-col items-center sm:items-start">
              <label className="block text-white/80 text-sm font-medium mb-3">
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
                  className="w-36 h-36 sm:w-40 sm:h-40 rounded-2xl border-2 border-dashed p-0 flex items-center justify-center cursor-pointer"
                >
                  <img
                    src={displayImage}
                    alt="Artist avatar"
                    className="w-full h-full rounded-2xl object-cover"
                  />

                  {/* Overlay */}
                  <div className="absolute inset-0 bg-black/60 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-center justify-center">
                    <div className="text-center">
                      <CameraOutlined className="text-white text-2xl mb-2" />
                      <span className="text-white text-sm font-medium">
                        {fileState.isDragActive ? "Drop here" : "Change photo"}
                      </span>
                    </div>
                  </div>
                </FileUploadZone>

                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) handleFileSelect(file);
                  }}
                  className="hidden"
                  disabled={isLoading}
                />
              </div>

              <p className="text-xs text-white/50 mt-2 text-center sm:text-left">
                Drag & drop or click to upload
                <br />
                Max 5MB • JPEG, PNG, WebP
              </p>
            </div>

            {/* Form Fields */}
            <div className="flex-1 space-y-4">
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
                />
                <AnimatePresence>
                  {validationErrors.name && (
                    <motion.p
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      className="text-red-400 text-xs mt-1"
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
                />
                <AnimatePresence>
                  {validationErrors.bio && (
                    <motion.p
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      className="text-red-400 text-xs mt-1"
                    >
                      {validationErrors.bio}
                    </motion.p>
                  )}
                </AnimatePresence>
              </div>

              {/* Current Stats (Read-only) */}
              <div className="bg-white/5 rounded-lg p-3 border border-white/10">
                <h4 className="text-white font-semibold mb-3 text-sm">
                  Current Stats
                </h4>
                <div className="grid grid-cols-2 gap-4 text-xs">
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

          {/* Footer */}
          <div className="flex flex-col sm:flex-row justify-end gap-3 pt-4">
            <GlassButton
              onClick={handleClose}
              disabled={isLoading}
              variant="secondary"
              size="md"
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
