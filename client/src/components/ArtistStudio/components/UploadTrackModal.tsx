import { useState, useRef, useCallback, useMemo } from "react";
import { Modal } from "antd";
import {
  CloseOutlined,
  UploadOutlined,
  DeleteOutlined,
  PlayCircleOutlined,
  CloudUploadOutlined,
} from "@ant-design/icons";
import { motion, AnimatePresence } from "framer-motion";
import { useNotification } from "../../../hooks/useNotification";
import { type Artist } from "../../../types/ArtistData";
import {
  StyledInput,
  StyledSelect,
  StyledMultiSelect,
  GlassButton,
  ModalContainer,
  FileUploadZone,
  ProgressBar,
  GlassCard,
} from "../../../shared/components/StyledComponents";

/**
 * UploadTrackModal - адаптивная модалка загрузки треков
 *
 * Особенности:
 * - Полная адаптивность для всех устройств
 * - Drag & Drop с визуальной обратной связью
 * - Preview аудио и изображений
 * - Валидация файлов с подробными ошибками
 * - Прогресс загрузки с анимацией
 * - Оптимизированная для мобильных устройств
 * - Упрощенный интерфейс на маленьких экранах
 */

interface UploadTrackModalProps {
  isOpen: boolean;
  onClose: () => void;
  artist: Pick<Artist, "_id" | "name" | "avatar">;
}

interface TrackData {
  name: string;
  genre: string;
  tags: string[];
  audioFile: File | null;
  coverFile: File | null;
}

interface FileState {
  audioFile: File | null;
  coverFile: File | null;
  audioPreview: string | null;
  coverPreview: string | null;
  audioIsDragActive: boolean;
  coverIsDragActive: boolean;
}

interface ValidationErrors {
  name?: string;
  genre?: string;
  audioFile?: string;
  coverFile?: string;
}

// Жанры и теги
const genres = [
  "Pop",
  "Rock",
  "Hip Hop",
  "R&B",
  "Jazz",
  "Classical",
  "Electronic",
  "Dance",
  "Country",
  "Alternative",
  "Indie",
  "Metal",
  "Folk",
  "Blues",
  "Reggae",
  "Punk",
  "Soul",
  "Funk",
  "Disco",
  "House",
  "Techno",
  "Dubstep",
  "Trap",
  "Latin",
  "K-Pop",
  "Afrobeat",
  "Gospel",
  "Ambient",
  "Experimental",
  "World",
];

const predefinedTags = [
  // Настроение
  "Energetic",
  "Chill",
  "Sad",
  "Happy",
  "Aggressive",
  "Romantic",
  "Melancholic",
  "Uplifting",
  // Активность
  "Workout",
  "Study",
  "Party",
  "Sleep",
  "Drive",
  "Focus",
  "Dance",
  "Relax",
  // Время
  "Morning",
  "Night",
  "Summer",
  "Winter",
  "Weekend",
  "Holiday",
  // Стиль
  "Acoustic",
  "Electric",
  "Instrumental",
  "Vocal",
  "Live",
  "Studio",
  "Remix",
  "Cover",
  // Темп
  "Fast",
  "Medium",
  "Slow",
  "Upbeat",
  "Downtempo",
];

const UploadTrackModal: React.FC<UploadTrackModalProps> = ({
  isOpen,
  onClose,
  artist,
}) => {
  const { showSuccess, showError, showWarning } = useNotification();

  // State management
  const [trackData, setTrackData] = useState<TrackData>({
    name: "",
    genre: "",
    tags: [],
    audioFile: null,
    coverFile: null,
  });

  const [fileState, setFileState] = useState<FileState>({
    audioFile: null,
    coverFile: null,
    audioPreview: null,
    coverPreview: null,
    audioIsDragActive: false,
    coverIsDragActive: false,
  });

  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [validationErrors, setValidationErrors] = useState<ValidationErrors>(
    {}
  );

  const audioInputRef = useRef<HTMLInputElement>(null);
  const coverInputRef = useRef<HTMLInputElement>(null);
  const dragCounterAudio = useRef(0);
  const dragCounterCover = useRef(0);

  // Валидация формы
  const validateForm = useCallback((): ValidationErrors => {
    const errors: ValidationErrors = {};

    if (!trackData.name.trim()) {
      errors.name = "Track name is required";
    } else if (trackData.name.trim().length < 2) {
      errors.name = "Track name must be at least 2 characters";
    }

    if (!trackData.genre) {
      errors.genre = "Genre is required";
    }

    if (!fileState.audioFile) {
      errors.audioFile = "Audio file is required";
    }

    if (!fileState.coverFile) {
      errors.coverFile = "Cover image is required";
    }

    return errors;
  }, [trackData, fileState]);

  // Валидация файлов
  const validateFile = useCallback(
    (file: File, type: "audio" | "image"): string | null => {
      if (type === "audio") {
        if (!file.type.match("audio.*")) {
          return "Please select a valid audio file";
        }
        if (file.size > 100 * 1024 * 1024) {
          // 100MB
          return "Audio file size must be less than 100MB";
        }
        const allowedAudioTypes = [
          "audio/mpeg",
          "audio/mp3",
          "audio/wav",
          "audio/flac",
        ];
        if (!allowedAudioTypes.includes(file.type)) {
          return "Only MP3, WAV and FLAC audio files are allowed";
        }
      } else {
        if (!file.type.match("image.*")) {
          return "Please select a valid image file";
        }
        if (file.size > 5 * 1024 * 1024) {
          // 5MB
          return "Image file size must be less than 5MB";
        }
        const allowedImageTypes = [
          "image/jpeg",
          "image/jpg",
          "image/png",
          "image/webp",
        ];
        if (!allowedImageTypes.includes(file.type)) {
          return "Only JPEG, PNG and WebP images are allowed";
        }
      }

      return null;
    },
    []
  );

  // Drag & Drop handlers для аудио
  const handleAudioDrag = useCallback(
    (e: React.DragEvent, type: "enter" | "leave" | "over" | "drop") => {
      e.preventDefault();
      e.stopPropagation();

      if (type === "enter") {
        dragCounterAudio.current++;
        if (e.dataTransfer.items && e.dataTransfer.items.length > 0) {
          setFileState((prev) => ({ ...prev, audioIsDragActive: true }));
        }
      } else if (type === "leave") {
        dragCounterAudio.current--;
        if (dragCounterAudio.current === 0) {
          setFileState((prev) => ({ ...prev, audioIsDragActive: false }));
        }
      } else if (type === "drop") {
        setFileState((prev) => ({ ...prev, audioIsDragActive: false }));
        dragCounterAudio.current = 0;

        if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
          const file = e.dataTransfer.files[0];
          handleAudioSelect(file);
          e.dataTransfer.clearData();
        }
      }
    },
    []
  );

  // Drag & Drop handlers для обложки
  const handleCoverDrag = useCallback(
    (e: React.DragEvent, type: "enter" | "leave" | "over" | "drop") => {
      e.preventDefault();
      e.stopPropagation();

      if (type === "enter") {
        dragCounterCover.current++;
        if (e.dataTransfer.items && e.dataTransfer.items.length > 0) {
          setFileState((prev) => ({ ...prev, coverIsDragActive: true }));
        }
      } else if (type === "leave") {
        dragCounterCover.current--;
        if (dragCounterCover.current === 0) {
          setFileState((prev) => ({ ...prev, coverIsDragActive: false }));
        }
      } else if (type === "drop") {
        setFileState((prev) => ({ ...prev, coverIsDragActive: false }));
        dragCounterCover.current = 0;

        if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
          const file = e.dataTransfer.files[0];
          handleCoverSelect(file);
          e.dataTransfer.clearData();
        }
      }
    },
    []
  );

  // Обработка выбора аудио файла
  const handleAudioSelect = useCallback(
    (file: File) => {
      const error = validateFile(file, "audio");
      if (error) {
        showError(error);
        return;
      }

      const url = URL.createObjectURL(file);
      setFileState((prev) => ({
        ...prev,
        audioFile: file,
        audioPreview: url,
      }));

      setTrackData((prev) => ({ ...prev, audioFile: file }));

      // Очистка ошибки валидации
      setValidationErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors.audioFile;
        return newErrors;
      });
    },
    [validateFile, showError]
  );

  // Обработка выбора обложки
  const handleCoverSelect = useCallback(
    (file: File) => {
      const error = validateFile(file, "image");
      if (error) {
        showError(error);
        return;
      }

      const reader = new FileReader();
      reader.onload = (e) => {
        const result = e.target?.result as string;
        setFileState((prev) => ({
          ...prev,
          coverFile: file,
          coverPreview: result,
        }));
      };
      reader.readAsDataURL(file);

      setTrackData((prev) => ({ ...prev, coverFile: file }));

      // Очистка ошибки валидации
      setValidationErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors.coverFile;
        return newErrors;
      });
    },
    [validateFile, showError]
  );

  // Удаление файлов
  const removeAudio = useCallback(() => {
    if (fileState.audioPreview) {
      URL.revokeObjectURL(fileState.audioPreview);
    }
    setFileState((prev) => ({
      ...prev,
      audioFile: null,
      audioPreview: null,
    }));
    setTrackData((prev) => ({ ...prev, audioFile: null }));
    if (audioInputRef.current) audioInputRef.current.value = "";
  }, [fileState.audioPreview]);

  const removeCover = useCallback(() => {
    setFileState((prev) => ({
      ...prev,
      coverFile: null,
      coverPreview: null,
    }));
    setTrackData((prev) => ({ ...prev, coverFile: null }));
    if (coverInputRef.current) coverInputRef.current.value = "";
  }, []);

  // Обработка изменения полей формы
  const handleInputChange = useCallback(
    <K extends keyof TrackData>(field: K, value: TrackData[K]) => {
      setTrackData((prev) => ({ ...prev, [field]: value }));

      // Очистка ошибки валидации
      if (validationErrors[field as keyof ValidationErrors]) {
        setValidationErrors((prev) => {
          const newErrors = { ...prev };
          delete newErrors[field as keyof ValidationErrors];
          return newErrors;
        });
      }
    },
    [validationErrors]
  );

  // Обработка загрузки
  const handleUpload = useCallback(async () => {
    const errors = validateForm();
    setValidationErrors(errors);

    if (Object.keys(errors).length > 0) {
      showWarning("Please fix all errors before uploading");
      return;
    }

    setIsUploading(true);

    const formData = new FormData();
    formData.append("name", trackData.name.trim());
    formData.append("artist", artist._id);
    formData.append("album", "single");
    formData.append("audio", fileState.audioFile!);
    formData.append("cover", fileState.coverFile!);
    formData.append("genre", trackData.genre);
    formData.append("tags", trackData.tags.join(","));

    try {
      const response = await new Promise<Response>((resolve, reject) => {
        const xhr = new XMLHttpRequest();

        xhr.upload.addEventListener("progress", (event) => {
          if (event.lengthComputable) {
            const progress = (event.loaded / event.total) * 70; // 70% для загрузки
            setUploadProgress(progress);
          }
        });

        xhr.onload = function () {
          if (xhr.status >= 200 && xhr.status < 300) {
            // Симуляция HLS конвертации
            let conversionProgress = 70;
            const conversionInterval = setInterval(() => {
              conversionProgress += Math.random() * 5 + 2;
              if (conversionProgress >= 100) {
                conversionProgress = 100;
                clearInterval(conversionInterval);
                resolve(new Response(xhr.responseText, { status: xhr.status }));
              }
              setUploadProgress(conversionProgress);
            }, 300);
          } else {
            reject(new Error(`Upload failed with status ${xhr.status}`));
          }
        };

        xhr.onerror = () => reject(new Error("Network error"));
        xhr.open("POST", "http://localhost:5000/api/tracks");
        xhr.setRequestHeader(
          "Authorization",
          `Bearer ${localStorage.getItem("token")}`
        );
        xhr.send(formData);
      });

      const data = await response.json();

      if (data.success) {
        showSuccess(
          "🎵 Track uploaded successfully! Converting to HLS format..."
        );
        handleClose();
      } else {
        throw new Error(data.message || "Upload failed");
      }
    } catch (error) {
      console.error("Upload error:", error);
      const errorMessage =
        error instanceof Error ? error.message : "Failed to upload track";
      showError(errorMessage);
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
    }
  }, [
    validateForm,
    trackData,
    fileState,
    artist._id,
    showSuccess,
    showError,
    showWarning,
  ]);

  // Обработка закрытия
  const resetForm = useCallback(() => {
    setTrackData({
      name: "",
      genre: "",
      tags: [],
      audioFile: null,
      coverFile: null,
    });
    if (fileState.audioPreview) {
      URL.revokeObjectURL(fileState.audioPreview);
    }
    setFileState({
      audioFile: null,
      coverFile: null,
      audioPreview: null,
      coverPreview: null,
      audioIsDragActive: false,
      coverIsDragActive: false,
    });
    setUploadProgress(0);
    setValidationErrors({});
  }, [fileState.audioPreview]);

  const handleClose = useCallback(() => {
    if (isUploading) return;

    const hasChanges =
      trackData.name ||
      trackData.genre ||
      trackData.tags.length > 0 ||
      fileState.audioFile ||
      fileState.coverFile;

    if (hasChanges) {
      const confirmClose = window.confirm(
        "You have unsaved changes. Are you sure you want to close?"
      );
      if (!confirmClose) return;
    }

    resetForm();
    onClose();
  }, [isUploading, trackData, fileState, resetForm, onClose]);

  // Проверка валидности формы
  const isFormValid = useMemo(() => {
    return (
      trackData.name.trim() &&
      trackData.genre &&
      fileState.audioFile &&
      fileState.coverFile &&
      Object.keys(validationErrors).length === 0
    );
  }, [trackData, fileState, validationErrors]);

  return (
    <ModalContainer>
      <Modal
        open={isOpen}
        onCancel={handleClose}
        closable={false}
        width="min(95vw, 700px)"
        styles={{
          content: {
            backgroundColor: "rgba(40, 40, 40, 0.95)",
            backdropFilter: "blur(15px)",
            border: "1px solid rgba(255, 255, 255, 0.1)",
            borderRadius: "16px",
            margin: "10px",
          },
          header: { display: "none" },
        }}
        footer={null}
        maskClosable={!isUploading}
      >
        <div className="space-y-4 sm:space-y-6 max-h-[85vh] overflow-y-auto">
          {/* Header */}
          <div className="flex justify-between items-center sticky top-0 bg-gray-800/90 backdrop-blur-sm p-3 sm:p-4 -m-3 sm:-m-4 mb-2 rounded-t-2xl">
            <div className="text-white text-lg sm:text-xl md:text-2xl font-semibold tracking-wider">
              Upload Track
            </div>
            <button
              onClick={handleClose}
              disabled={isUploading}
              className="text-xl sm:text-2xl text-white hover:text-white/70 transition-colors disabled:opacity-50"
              aria-label="Close modal"
            >
              <CloseOutlined />
            </button>
          </div>

          {/* Progress Bar */}
          <AnimatePresence>
            {isUploading && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
              >
                <GlassCard padding="1rem">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-white text-sm font-medium">
                      {uploadProgress < 70
                        ? "Uploading..."
                        : "Converting to HLS..."}
                    </span>
                    <span className="text-white text-sm">
                      {Math.round(uploadProgress)}%
                    </span>
                  </div>
                  <ProgressBar progress={uploadProgress} />
                </GlassCard>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Form */}
          <div className="space-y-4 sm:space-y-6">
            {/* Track Name */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
            >
              <label className="block text-white/80 text-sm font-medium mb-2">
                Track Name *
              </label>
              <StyledInput
                placeholder="Enter track name"
                value={trackData.name}
                onChange={(e) => handleInputChange("name", e.target.value)}
                disabled={isUploading}
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
            </motion.div>

            {/* Audio and Cover Upload - Desktop */}
            <div className="hidden sm:grid sm:grid-cols-2 gap-4 lg:gap-6">
              {/* Audio Upload */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
              >
                <label className="block text-white/80 text-sm font-medium mb-2">
                  Audio File * (MP3, WAV, FLAC)
                </label>
                <FileUploadZone
                  isDragActive={fileState.audioIsDragActive}
                  hasFile={!!fileState.audioFile}
                  onDragEnter={(e) => handleAudioDrag(e, "enter")}
                  onDragLeave={(e) => handleAudioDrag(e, "leave")}
                  onDragOver={(e) => handleAudioDrag(e, "over")}
                  onDrop={(e) => handleAudioDrag(e, "drop")}
                  onClick={() => audioInputRef.current?.click()}
                  className="h-32 text-center"
                >
                  {fileState.audioFile ? (
                    <div className="flex flex-col items-center gap-2">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            if (fileState.audioPreview) {
                              const audio = new Audio(fileState.audioPreview);
                              audio.play();
                            }
                          }}
                          className="p-2 bg-green-500/20 rounded-full hover:bg-green-500/30 transition-colors"
                          disabled={isUploading}
                        >
                          <PlayCircleOutlined className="text-green-400 text-xl" />
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            removeAudio();
                          }}
                          className="p-2 bg-red-500/20 rounded-full hover:bg-red-500/30 transition-colors"
                          disabled={isUploading}
                        >
                          <DeleteOutlined className="text-red-400" />
                        </button>
                      </div>
                      <span className="text-white text-sm truncate max-w-full">
                        {fileState.audioFile.name}
                      </span>
                      <span className="text-white/50 text-xs">
                        {(fileState.audioFile.size / (1024 * 1024)).toFixed(2)}{" "}
                        MB
                      </span>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center gap-2">
                      <CloudUploadOutlined className="text-white/60 text-3xl" />
                      <span className="text-white/80 text-sm font-medium">
                        {fileState.audioIsDragActive
                          ? "Drop audio here"
                          : "Drop audio or click"}
                      </span>
                      <span className="text-white/50 text-xs">Max 100MB</span>
                    </div>
                  )}
                </FileUploadZone>
                <input
                  ref={audioInputRef}
                  type="file"
                  accept="audio/mp3,audio/mpeg,audio/wav,audio/flac"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) handleAudioSelect(file);
                  }}
                  className="hidden"
                  disabled={isUploading}
                />
                <AnimatePresence>
                  {validationErrors.audioFile && (
                    <motion.p
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      className="text-red-400 text-xs mt-1"
                    >
                      {validationErrors.audioFile}
                    </motion.p>
                  )}
                </AnimatePresence>
              </motion.div>

              {/* Cover Upload */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
              >
                <label className="block text-white/80 text-sm font-medium mb-2">
                  Cover Image *
                </label>
                <FileUploadZone
                  isDragActive={fileState.coverIsDragActive}
                  hasFile={!!fileState.coverFile}
                  onDragEnter={(e) => handleCoverDrag(e, "enter")}
                  onDragLeave={(e) => handleCoverDrag(e, "leave")}
                  onDragOver={(e) => handleCoverDrag(e, "over")}
                  onDrop={(e) => handleCoverDrag(e, "drop")}
                  onClick={() => coverInputRef.current?.click()}
                  className="h-32"
                >
                  {fileState.coverFile && fileState.coverPreview ? (
                    <div className="relative w-full h-full">
                      <img
                        src={fileState.coverPreview}
                        alt="Cover preview"
                        className="w-full h-full object-cover rounded-lg"
                      />
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          removeCover();
                        }}
                        className="absolute top-2 right-2 p-1 bg-red-500/80 rounded-full hover:bg-red-500 transition-colors"
                        disabled={isUploading}
                      >
                        <DeleteOutlined className="text-white text-xs" />
                      </button>
                      <div className="absolute bottom-2 left-2 bg-black/50 rounded px-2 py-1">
                        <span className="text-white text-xs">
                          {(fileState.coverFile.size / (1024 * 1024)).toFixed(
                            2
                          )}{" "}
                          MB
                        </span>
                      </div>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center gap-2">
                      <CloudUploadOutlined className="text-white/60 text-3xl" />
                      <span className="text-white/80 text-sm font-medium text-center">
                        {fileState.coverIsDragActive
                          ? "Drop image here"
                          : "Drop image or click"}
                      </span>
                      <span className="text-white/50 text-xs">Max 5MB</span>
                    </div>
                  )}
                </FileUploadZone>
                <input
                  ref={coverInputRef}
                  type="file"
                  accept="image/*"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) handleCoverSelect(file);
                  }}
                  className="hidden"
                  disabled={isUploading}
                />
                <AnimatePresence>
                  {validationErrors.coverFile && (
                    <motion.p
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      className="text-red-400 text-xs mt-1"
                    >
                      {validationErrors.coverFile}
                    </motion.p>
                  )}
                </AnimatePresence>
              </motion.div>
            </div>

            {/* Audio and Cover Upload - Mobile */}
            <div className="sm:hidden space-y-4">
              {/* Audio Upload Mobile */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
              >
                <label className="block text-white/80 text-sm font-medium mb-2">
                  Audio File *
                </label>
                {fileState.audioFile ? (
                  <GlassCard padding="0.75rem">
                    <div className="flex items-center gap-3">
                      <button
                        onClick={() => {
                          if (fileState.audioPreview) {
                            const audio = new Audio(fileState.audioPreview);
                            audio.play();
                          }
                        }}
                        className="p-2 bg-green-500/20 rounded-full"
                        disabled={isUploading}
                      >
                        <PlayCircleOutlined className="text-green-400" />
                      </button>
                      <div className="flex-1 min-w-0">
                        <p className="text-white text-sm font-medium truncate">
                          {fileState.audioFile.name}
                        </p>
                        <p className="text-white/50 text-xs">
                          {(fileState.audioFile.size / (1024 * 1024)).toFixed(
                            2
                          )}{" "}
                          MB
                        </p>
                      </div>
                      <button
                        onClick={removeAudio}
                        className="p-2 bg-red-500/20 rounded-full"
                        disabled={isUploading}
                      >
                        <DeleteOutlined className="text-red-400" />
                      </button>
                    </div>
                  </GlassCard>
                ) : (
                  <button
                    onClick={() => audioInputRef.current?.click()}
                    className="w-full p-4 border-2 border-dashed border-white/30 rounded-lg bg-white/5 hover:bg-white/10 transition-colors"
                    disabled={isUploading}
                  >
                    <div className="flex flex-col items-center gap-2">
                      <UploadOutlined className="text-white/60 text-2xl" />
                      <span className="text-white/80 text-sm">
                        Select Audio File
                      </span>
                      <span className="text-white/50 text-xs">
                        MP3, WAV, FLAC • Max 100MB
                      </span>
                    </div>
                  </button>
                )}
                <input
                  ref={audioInputRef}
                  type="file"
                  accept="audio/mp3,audio/mpeg,audio/wav,audio/flac"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) handleAudioSelect(file);
                  }}
                  className="hidden"
                  disabled={isUploading}
                />
                <AnimatePresence>
                  {validationErrors.audioFile && (
                    <motion.p
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      className="text-red-400 text-xs mt-1"
                    >
                      {validationErrors.audioFile}
                    </motion.p>
                  )}
                </AnimatePresence>
              </motion.div>

              {/* Cover Upload Mobile */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
              >
                <label className="block text-white/80 text-sm font-medium mb-2">
                  Cover Image *
                </label>
                {fileState.coverFile && fileState.coverPreview ? (
                  <GlassCard padding="0.75rem">
                    <div className="flex items-center gap-3">
                      <img
                        src={fileState.coverPreview}
                        alt="Cover preview"
                        className="w-12 h-12 rounded-lg object-cover"
                      />
                      <div className="flex-1 min-w-0">
                        <p className="text-white text-sm font-medium truncate">
                          {fileState.coverFile.name}
                        </p>
                        <p className="text-white/50 text-xs">
                          {(fileState.coverFile.size / (1024 * 1024)).toFixed(
                            2
                          )}{" "}
                          MB
                        </p>
                      </div>
                      <button
                        onClick={removeCover}
                        className="p-2 bg-red-500/20 rounded-full"
                        disabled={isUploading}
                      >
                        <DeleteOutlined className="text-red-400" />
                      </button>
                    </div>
                  </GlassCard>
                ) : (
                  <button
                    onClick={() => coverInputRef.current?.click()}
                    className="w-full p-4 border-2 border-dashed border-white/30 rounded-lg bg-white/5 hover:bg-white/10 transition-colors"
                    disabled={isUploading}
                  >
                    <div className="flex flex-col items-center gap-2">
                      <UploadOutlined className="text-white/60 text-2xl" />
                      <span className="text-white/80 text-sm">
                        Select Cover Image
                      </span>
                      <span className="text-white/50 text-xs">
                        JPG, PNG, WebP • Max 5MB
                      </span>
                    </div>
                  </button>
                )}
                <input
                  ref={coverInputRef}
                  type="file"
                  accept="image/*"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) handleCoverSelect(file);
                  }}
                  className="hidden"
                  disabled={isUploading}
                />
                <AnimatePresence>
                  {validationErrors.coverFile && (
                    <motion.p
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      className="text-red-400 text-xs mt-1"
                    >
                      {validationErrors.coverFile}
                    </motion.p>
                  )}
                </AnimatePresence>
              </motion.div>
            </div>

            {/* Genre and Tags */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {/* Genre */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
              >
                <label className="block text-white/80 text-sm font-medium mb-2">
                  Genre *
                </label>
                <StyledSelect
                  placeholder="Select genre"
                  value={trackData.genre || undefined}
                  onChange={(value) => handleInputChange("genre", value)}
                  options={genres.map((genre) => ({
                    label: genre,
                    value: genre,
                  }))}
                  className="w-full"
                  disabled={isUploading}
                  showSearch
                  filterOption={(input, option) =>
                    String(option?.label ?? "")
                      .toLowerCase()
                      .includes(input.toLowerCase())
                  }
                  status={validationErrors.genre ? "error" : ""}
                />
                <AnimatePresence>
                  {validationErrors.genre && (
                    <motion.p
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      className="text-red-400 text-xs mt-1"
                    >
                      {validationErrors.genre}
                    </motion.p>
                  )}
                </AnimatePresence>
              </motion.div>

              {/* Tags */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
              >
                <label className="block text-white/80 text-sm font-medium mb-2">
                  Tags (Optional) - Max 5
                </label>
                <StyledMultiSelect
                  mode="multiple"
                  placeholder="Select tags"
                  value={trackData.tags}
                  onChange={(values) => {
                    if (values.length <= 5) {
                      handleInputChange("tags", values);
                    }
                  }}
                  options={predefinedTags.map((tag) => ({
                    label: tag,
                    value: tag,
                  }))}
                  className="w-full"
                  disabled={isUploading}
                  showSearch
                  maxTagCount="responsive"
                  filterOption={(input, option) =>
                    String(option?.label ?? "")
                      .toLowerCase()
                      .includes(input.toLowerCase())
                  }
                />
                <span className="text-xs text-white/50 mt-1 block">
                  Selected: {trackData.tags.length}/5
                </span>
              </motion.div>
            </div>

            {/* Artist Info */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 }}
            >
              <GlassCard padding="0.75rem">
                <div className="flex items-center gap-3">
                  <img
                    src={artist.avatar || "/default-artist-avatar.png"}
                    alt={artist.name}
                    className="w-10 h-10 rounded-full object-cover"
                  />
                  <div>
                    <span className="text-white/60 text-xs">Artist:</span>
                    <p className="text-white font-medium">{artist.name}</p>
                  </div>
                </div>
              </GlassCard>
            </motion.div>
          </div>

          {/* Footer */}
          <div className="flex flex-col sm:flex-row justify-end gap-3 pt-4">
            <GlassButton
              onClick={handleClose}
              disabled={isUploading}
              variant="secondary"
              size="md"
            >
              Cancel
            </GlassButton>

            <GlassButton
              onClick={handleUpload}
              disabled={!isFormValid || isUploading}
              variant="primary"
              size="md"
            >
              {isUploading ? "Uploading..." : "Upload Track"}
            </GlassButton>
          </div>
        </div>
      </Modal>
    </ModalContainer>
  );
};

export default UploadTrackModal;
