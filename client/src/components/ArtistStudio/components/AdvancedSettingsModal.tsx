import { useState, useEffect, useCallback, useMemo } from "react";
import { Modal } from "antd";
import {
  CloseOutlined,
  DeleteOutlined,
  SpotifyOutlined,
  InstagramOutlined,
  XOutlined,
} from "@ant-design/icons";
import { motion, AnimatePresence } from "framer-motion";
import { useNotification } from "../../../hooks/useNotification";
import { type Artist } from "../../../types/ArtistData";
import {
  StyledInput,
  StyledMultiSelect,
  GlassButton,
  ModalContainer,
  GlassCard,
} from "../../../shared/components/StyledComponents";

/**
 * AdvancedSettingsModal - оптимизированная модалка продвинутых настроек
 *
 * Особенности:
 * - Использование общих styled-components
 * - Мемоизация для производительности
 * - Улучшенная валидация социальных ссылок
 * - Адаптивный дизайн
 * - Drag & Drop для жанров
 */

interface AdvancedSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  artist: Artist;
  onSave?: (updatedArtist: Partial<Artist>) => void;
}

interface SocialPlatform {
  key: keyof NonNullable<Artist["socialLinks"]>;
  label: string;
  icon: React.ReactNode;
  prefix: string;
  placeholder: string;
  validator?: (value: string) => string | null;
}

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

const socialPlatforms: SocialPlatform[] = [
  {
    key: "spotify",
    label: "Spotify",
    icon: <SpotifyOutlined style={{ color: "#1db954", fontSize: "16px" }} />,
    prefix: "https://open.spotify.com/artist/",
    placeholder: "your-artist-id",
    validator: (value) => {
      if (value && !/^[a-zA-Z0-9]{22}$/.test(value)) {
        return "Invalid Spotify artist ID format";
      }
      return null;
    },
  },
  {
    key: "instagram",
    label: "Instagram",
    icon: <InstagramOutlined style={{ color: "#E4405F", fontSize: "16px" }} />,
    prefix: "https://instagram.com/",
    placeholder: "username",
    validator: (value) => {
      if (value && !/^[a-zA-Z0-9._]{1,30}$/.test(value)) {
        return "Invalid Instagram username format";
      }
      return null;
    },
  },
  {
    key: "twitter",
    label: "Twitter(X)",
    icon: <XOutlined style={{ color: "white", fontSize: "16px" }} />,
    prefix: "https://twitter.com/",
    placeholder: "username",
    validator: (value) => {
      if (value && !/^[a-zA-Z0-9_]{1,15}$/.test(value)) {
        return "Invalid Twitter username format";
      }
      return null;
    },
  },
];

const AdvancedSettingsModal: React.FC<AdvancedSettingsModalProps> = ({
  isOpen,
  onClose,
  artist,
  onSave,
}) => {
  const { showSuccess, showError, showWarning } = useNotification();

  const [tempGenres, setTempGenres] = useState<string[]>([]);
  const [tempSocialLinks, setTempSocialLinks] = useState<
    NonNullable<Artist["socialLinks"]>
  >({} as NonNullable<Artist["socialLinks"]>);
  const [isLoading, setIsLoading] = useState(false);
  const [validationErrors, setValidationErrors] = useState<
    Record<string, string>
  >({});

  // Инициализация состояния при открытии модального окна
  useEffect(() => {
    if (isOpen) {
      setTempGenres(artist.genres || []);
      setTempSocialLinks(artist.socialLinks || {} as NonNullable<Artist["socialLinks"]>);
      setValidationErrors({});
    }
  }, [isOpen, artist]);

  // Валидация социальной ссылки
  const validateSocialLink = useCallback(
    (platform: SocialPlatform, value: string): string | null => {
      if (!value.trim()) return null;
      return platform.validator ? platform.validator(value.trim()) : null;
    },
    []
  );

  // Обработка изменения социальной ссылки
  const handleSocialLinkChange = useCallback(
    (platform: SocialPlatform, value: string) => {
      const trimmedValue = value.trim();
      const error = validateSocialLink(platform, trimmedValue);

      // Обновляем ошибки валидации
      setValidationErrors((prev) => {
        const newErrors = { ...prev };
        if (error) {
          newErrors[platform.key] = error;
        } else {
          delete newErrors[platform.key];
        }
        return newErrors;
      });

      // Обновляем значение
      setTempSocialLinks((prev) => {
        const updated = { ...prev };
        if (trimmedValue) {
          updated[platform.key] = platform.prefix + trimmedValue;
        } else {
          delete updated[platform.key];
        }
        return updated;
      });
    },
    [validateSocialLink]
  );

  // Удаление социальной ссылки
  const removeSocialLink = useCallback((platform: SocialPlatform) => {
    setTempSocialLinks((prev) => {
      const updated = { ...prev };
      delete updated[platform.key];
      return updated;
    });

    setValidationErrors((prev) => {
      const newErrors = { ...prev };
      delete newErrors[platform.key];
      return newErrors;
    });
  }, []);

  // Проверка изменений
  const hasChanges = useMemo(() => {
    return (
      JSON.stringify(tempGenres.sort()) !==
        JSON.stringify((artist.genres || []).sort()) ||
      JSON.stringify(tempSocialLinks) !==
        JSON.stringify(artist.socialLinks || {})
    );
  }, [tempGenres, tempSocialLinks, artist.genres, artist.socialLinks]);

  // Валидация формы
  const isFormValid = useMemo(() => {
    return Object.keys(validationErrors).length === 0;
  }, [validationErrors]);

  // Обработка сохранения
  const handleSave = useCallback(async () => {
    if (!isFormValid) {
      showWarning("Please fix validation errors before saving");
      return;
    }

    try {
      setIsLoading(true);

      const updatedData = {
        genres: tempGenres,
        socialLinks:
          Object.keys(tempSocialLinks).length > 0 ? tempSocialLinks : null,
      };

      const response = await fetch(
        `http://localhost:5000/api/artists/${artist._id}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
          body: JSON.stringify(updatedData),
        }
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || "Failed to update settings");
      }

      const data = await response.json();

      if (data.success) {
        showSuccess("Advanced settings updated successfully!");
        onSave?.(updatedData);
        handleClose();
      } else {
        throw new Error(data.message || "Failed to update settings");
      }
    } catch (error) {
      console.error("Save failed:", error);
      const errorMessage =
        error instanceof Error ? error.message : "Failed to update settings";
      showError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, [
    isFormValid,
    tempGenres,
    tempSocialLinks,
    artist._id,
    onSave,
    showSuccess,
    showError,
    showWarning,
  ]);

  // Обработка закрытия
  const handleClose = useCallback(() => {
    if (isLoading) return;

    if (hasChanges) {
      const confirmClose = window.confirm(
        "You have unsaved changes. Are you sure you want to close?"
      );
      if (!confirmClose) return;
    }

    onClose();
  }, [isLoading, hasChanges, onClose]);

  // Мемоизированная статистика
  const activeSocialLinksCount = useMemo(() => {
    return Object.values(tempSocialLinks).filter(
      (link) => link && link.trim() !== ""
    ).length;
  }, [tempSocialLinks]);

  return (
    <ModalContainer>
      <Modal
        open={isOpen}
        onCancel={handleClose}
        closable={false}
        width={700}
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
        <div className="space-y-6 max-h-[80vh] overflow-y-auto">
          {/* Header */}
          <div className="flex justify-between items-center sticky top-0 bg-gray-800/90 backdrop-blur-sm p-4 -m-4 mb-2 rounded-t-2xl">
            <div className="text-white text-xl sm:text-2xl font-semibold tracking-wider">
              Advanced Settings
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

          {/* Genres Section */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <GlassCard>
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <span className="text-2xl">🎵</span>
                  <div>
                    <h3 className="text-white/90 text-lg font-semibold">
                      Music Genres
                    </h3>
                    <p className="text-white/60 text-sm">
                      Select genres that best describe your music style
                    </p>
                  </div>
                </div>

                <StyledMultiSelect
                  mode="multiple"
                  placeholder="Select your music genres..."
                  value={tempGenres}
                  onChange={setTempGenres}
                  options={genres.map((genre) => ({
                    label: genre,
                    value: genre,
                  }))}
                  className="w-full"
                  disabled={isLoading}
                  maxTagCount="responsive"
                  showSearch
                  filterOption={(input, option) =>
                    String(option?.label ?? "")
                      .toLowerCase()
                      .includes(input.toLowerCase())
                  }
                />

                <div className="flex justify-between items-center text-xs">
                  <span className="text-white/50">
                    Selected: {tempGenres.length} genres
                  </span>
                  {tempGenres.length > 5 && (
                    <span className="text-yellow-400">
                      Consider selecting fewer genres for better categorization
                    </span>
                  )}
                </div>
              </div>
            </GlassCard>
          </motion.div>

          {/* Social Links Section */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <GlassCard>
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <span className="text-2xl">🔗</span>
                  <div>
                    <h3 className="text-white/90 text-lg font-semibold">
                      Social Media Links
                    </h3>
                    <p className="text-white/60 text-sm">
                      Add your social media profiles to help fans connect with
                      you
                    </p>
                  </div>
                </div>

                <div className="space-y-4">
                  {socialPlatforms.map((platform) => {
                    const currentFullUrl = tempSocialLinks[platform.key] || "";
                    const currentValue = currentFullUrl
                      ? currentFullUrl.replace(platform.prefix, "")
                      : "";
                    const hasError = validationErrors[platform.key];

                    return (
                      <div key={platform.key} className="space-y-2">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            {platform.icon}
                            <span className="text-white font-medium text-sm">
                              {platform.label}
                            </span>
                          </div>

                          {currentFullUrl && (
                            <button
                              onClick={() => removeSocialLink(platform)}
                              className="text-red-400 hover:text-red-300 transition-colors p-1"
                              disabled={isLoading}
                              aria-label={`Remove ${platform.label} link`}
                            >
                              <DeleteOutlined className="text-sm" />
                            </button>
                          )}
                        </div>

                        <div className="flex rounded-lg overflow-hidden">
                          <div className="bg-white/5 border border-white/20 border-r-0 px-3 py-2 text-white/70 text-sm">
                            {platform.prefix}
                          </div>
                          <StyledInput
                            placeholder={platform.placeholder}
                            value={currentValue}
                            onChange={(e) =>
                              handleSocialLinkChange(platform, e.target.value)
                            }
                            disabled={isLoading}
                            status={hasError ? "error" : ""}
                            className="flex-1 rounded-l-none border-l-0"
                          />
                        </div>

                        <AnimatePresence>
                          {hasError && (
                            <motion.p
                              initial={{ opacity: 0, height: 0 }}
                              animate={{ opacity: 1, height: "auto" }}
                              exit={{ opacity: 0, height: 0 }}
                              className="text-red-400 text-xs"
                            >
                              {hasError}
                            </motion.p>
                          )}
                        </AnimatePresence>
                      </div>
                    );
                  })}
                </div>
              </div>
            </GlassCard>
          </motion.div>

          {/* Summary Section */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <GlassCard>
              <h4 className="text-white font-semibold mb-3">
                Current Settings Summary
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-white/60">Genres:</span>
                  <p className="text-white font-medium">
                    {tempGenres.length
                      ? tempGenres.slice(0, 3).join(", ") +
                        (tempGenres.length > 3
                          ? `... (+${tempGenres.length - 3} more)`
                          : "")
                      : "Not specified"}
                  </p>
                </div>
                <div>
                  <span className="text-white/60">Social Links:</span>
                  <p className="text-white font-medium">
                    {activeSocialLinksCount
                      ? `${activeSocialLinksCount} platform${
                          activeSocialLinksCount !== 1 ? "s" : ""
                        } connected`
                      : "None added"}
                  </p>
                </div>
              </div>
            </GlassCard>
          </motion.div>

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
              disabled={!hasChanges || !isFormValid || isLoading}
              variant="primary"
              size="md"
            >
              {isLoading ? "Saving..." : "Save Settings"}
            </GlassButton>
          </div>
        </div>
      </Modal>
    </ModalContainer>
  );
};

export default AdvancedSettingsModal;
