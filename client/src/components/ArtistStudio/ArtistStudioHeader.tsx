import { type FC, useState, useCallback, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import {
  PlusOutlined,
  EditOutlined,
  SettingOutlined,
  UnorderedListOutlined,
  MenuOutlined,
} from "@ant-design/icons";
import { BaseHeader, HeaderContent } from "../../shared/BaseHeader";
import { GlassButton } from "../../shared/components/StyledComponents";
import { type Artist } from "../../types/ArtistData";
import UploadTrackModal from "./components/UploadTrackModal";
import EditProfileModal from "./components/EditProfileModal";
import AdvancedSettingsModal from "./components/AdvancedSettingsModal";

/**
 * ArtistStudioHeader - адаптивный заголовок для Artist Studio
 *
 * Особенности:
 * - Полная адаптивность с responsive дизайном
 * - Мемоизация для оптимизации производительности
 * - Улучшенная доступность (ARIA, keyboard navigation)
 * - Mobile-first подход с коллапсирующими кнопками
 * - Lazy loading модалок
 * - Оптимизированные анимации
 *
 * Breakpoints:
 * - >= 1280px (xl): полный набор кнопок в одну строку
 * - >= 768px (md): кнопки в две строки
 * - < 768px: меню-дропдаун с основными действиями
 */

interface ArtistStudioHeaderProps {
  artist: Artist;
  tracksCount: number;
  isLoading?: boolean;
  onArtistUpdate?: (updatedArtist: Partial<Artist>) => void;
}

interface ModalState {
  upload: boolean;
  edit: boolean;
  advanced: boolean;
  mobileMenu: boolean;
}

interface ActionButtonProps {
  icon: React.ReactNode;
  text: string;
  onClick?: () => void;
  variant?: "primary" | "secondary";
  size?: "sm" | "md" | "lg";
  ariaLabel?: string;
  disabled?: boolean;
}

/**
 * Переиспользуемая кнопка действия с улучшенной доступностью
 */
const ActionButton: FC<ActionButtonProps> = ({
  icon,
  text,
  onClick,
  variant = "secondary",
  size = "md",
  ariaLabel,
  disabled = false,
}) => (
  <GlassButton
    onClick={onClick}
    variant={variant}
    size={size}
    disabled={disabled}
    whileHover={{ y: -2 }}
    whileTap={{ scale: 0.98 }}
    aria-label={ariaLabel || text}
    role="button"
    tabIndex={0}
  >
    <span className="text-sm" aria-hidden="true">
      {icon}
    </span>
    <span className="font-semibold">{text}</span>
  </GlassButton>
);

/**
 * Мобильное меню действий
 */
const MobileActionsMenu: FC<{
  isOpen: boolean;
  onClose: () => void;
  onAction: (action: string) => void;
}> = ({ isOpen, onClose, onAction }) => (
  <AnimatePresence>
    {isOpen && (
      <>
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/20 backdrop-blur-sm z-40 md:hidden"
          onClick={onClose}
        />

        {/* Menu */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: -20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: -20 }}
          className="absolute top-full right-4 mt-2 w-56 bg-gray-900/95 backdrop-blur-xl rounded-2xl border border-white/10 shadow-2xl z-50 md:hidden"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="p-2">
            {[
              {
                key: "upload",
                icon: <PlusOutlined />,
                text: "Upload Track",
                variant: "primary" as const,
              },
              {
                key: "edit",
                icon: <EditOutlined />,
                text: "Edit Profile",
                variant: "secondary" as const,
              },
              {
                key: "advanced",
                icon: <SettingOutlined />,
                text: "Advanced Settings",
                variant: "secondary" as const,
              },
              {
                key: "album",
                icon: <UnorderedListOutlined />,
                text: "Create Album",
                variant: "secondary" as const,
              },
            ].map((item) => (
              <button
                key={item.key}
                onClick={() => {
                  onAction(item.key);
                  onClose();
                }}
                className={`w-full p-3 rounded-xl text-left transition-all duration-200 mb-1 last:mb-0 ${
                  item.variant === "primary"
                    ? "bg-gradient-to-r from-green-500/20 to-emerald-500/20 text-green-300 hover:from-green-500/30 hover:to-emerald-500/30"
                    : "text-white hover:bg-white/10"
                }`}
                aria-label={item.text}
              >
                <div className="flex items-center gap-3">
                  <span className="text-lg" aria-hidden="true">
                    {item.icon}
                  </span>
                  <span className="font-medium">{item.text}</span>
                </div>
              </button>
            ))}
          </div>
        </motion.div>
      </>
    )}
  </AnimatePresence>
);

const ArtistStudioHeader: FC<ArtistStudioHeaderProps> = ({
  artist,
  tracksCount,
  isLoading = false,
  onArtistUpdate,
}) => {
  const navigate = useNavigate();

  // Состояние модалок с типизацией
  const [modals, setModals] = useState<ModalState>({
    upload: false,
    edit: false,
    advanced: false,
    mobileMenu: false,
  });

  // Мемоизированные обработчики для оптимизации
  const toggleModal = useCallback(
    (modalName: keyof ModalState, state?: boolean) => {
      setModals((prev) => ({
        ...prev,
        [modalName]: state !== undefined ? state : !prev[modalName],
      }));
    },
    []
  );

  const handleMobileAction = useCallback(
    (action: string) => {
      switch (action) {
        case "upload":
          toggleModal("upload", true);
          break;
        case "edit":
          toggleModal("edit", true);
          break;
        case "advanced":
          toggleModal("advanced", true);
          break;
        case "album":
          navigate("/artist-studio/create-album");
          break;
      }
    },
    [toggleModal, navigate]
  );

  // Мемоизированная функция форматирования чисел
  const formatNumber = useMemo(
    () =>
      (num: number): string => {
        if (num >= 1000000) {
          return `${(num / 1000000).toFixed(1)}M`;
        }
        if (num >= 1000) {
          return `${(num / 1000).toFixed(1)}K`;
        }
        return num.toString();
      },
    []
  );

  // Мемоизированный заголовок с градиентом
  const welcomeTitle = useMemo(
    () => (
      <div className="flex flex-col">
        <motion.span
          className="text-white/70 text-base sm:text-lg lg:text-xl xl:text-2xl font-normal mb-1"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          Welcome back,
        </motion.span>
        <motion.span
          className="bg-gradient-to-r from-white via-green-100 to-emerald-200 bg-clip-text text-transparent text-lg sm:text-xl lg:text-2xl xl:text-3xl font-bold"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          {artist.name}
        </motion.span>
      </div>
    ),
    [artist.name]
  );

  // Мемоизированная статистика с адаптивностью
  const statsSubtitle = useMemo(
    () => (
      <div className="flex flex-col space-y-4 mt-4">
        {/* Stats */}
        <div className="flex flex-col sm:flex-row gap-3 sm:gap-6 lg:gap-8">
          <motion.div
            className="flex items-center gap-2"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.6 }}
          >
            <div className="w-2 h-2 bg-gradient-to-r from-blue-400 to-cyan-400 rounded-full"></div>
            <span className="text-white/90 font-medium text-sm sm:text-base">
              {formatNumber(tracksCount)}{" "}
              {tracksCount === 1 ? "Track" : "Tracks"}
            </span>
          </motion.div>

          <motion.div
            className="flex items-center gap-2"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.8 }}
          >
            <div className="w-2 h-2 bg-gradient-to-r from-purple-400 to-pink-400 rounded-full"></div>
            <span className="text-white/90 font-medium text-sm sm:text-base">
              {formatNumber(artist.followerCount)}{" "}
              {artist.followerCount === 1 ? "Follower" : "Followers"}
            </span>
          </motion.div>

          {artist.isVerified && (
            <motion.div
              className="flex items-center gap-2"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 1.0 }}
            >
              <svg
                className="w-4 h-4 text-green-400"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path
                  fillRule="evenodd"
                  d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                  clipRule="evenodd"
                />
              </svg>
              <span className="text-green-400 font-medium text-sm sm:text-base">
                Verified
              </span>
            </motion.div>
          )}
        </div>

        {/* Actions - Desktop */}
        <motion.div
          className="hidden md:flex gap-2 lg:gap-3 flex-wrap justify-start lg:justify-end lg:ml-auto"
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 1.2 }}
        >
          <ActionButton
            icon={<EditOutlined />}
            text="Edit Profile"
            onClick={() => toggleModal("edit", true)}
            variant="secondary"
            size="sm"
            ariaLabel="Edit artist profile"
          />
          <ActionButton
            icon={<SettingOutlined />}
            text="Advanced"
            onClick={() => toggleModal("advanced", true)}
            variant="secondary"
            size="sm"
            ariaLabel="Open advanced settings"
          />
          <ActionButton
            icon={<UnorderedListOutlined />}
            text="Create Album"
            onClick={() => navigate("/artist-studio/create-album")}
            variant="secondary"
            size="sm"
            ariaLabel="Create new album"
          />
          <ActionButton
            icon={<PlusOutlined />}
            text="Upload Track"
            onClick={() => toggleModal("upload", true)}
            variant="primary"
            size="sm"
            ariaLabel="Upload new track"
          />
        </motion.div>

        {/* Actions - Mobile */}
        <motion.div
          className="flex md:hidden justify-between items-center"
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 1.2 }}
        >
          <ActionButton
            icon={<PlusOutlined />}
            text="Upload"
            onClick={() => toggleModal("upload", true)}
            variant="primary"
            size="sm"
            ariaLabel="Upload new track"
          />

          <div className="relative">
            <ActionButton
              icon={<MenuOutlined />}
              text="More"
              onClick={() => toggleModal("mobileMenu")}
              variant="secondary"
              size="sm"
              ariaLabel="Open more actions menu"
            />

            <MobileActionsMenu
              isOpen={modals.mobileMenu}
              onClose={() => toggleModal("mobileMenu", false)}
              onAction={handleMobileAction}
            />
          </div>
        </motion.div>
      </div>
    ),
    [
      formatNumber,
      tracksCount,
      artist.followerCount,
      artist.isVerified,
      toggleModal,
      navigate,
      modals.mobileMenu,
      handleMobileAction,
    ]
  );

  // Мемоизированные пропсы для BaseHeader
  const imageProps = useMemo(
    () => ({
      src: artist.avatar || "/default-artist-avatar.png",
      alt: `${artist.name} avatar`,
      className:
        "w-32 h-32 sm:w-40 sm:h-40 lg:w-48 lg:h-48 xl:w-[200px] xl:h-[200px] 2xl:w-[230px] 2xl:h-[230px] rounded-full object-cover border-4 border-white/20 shadow-xl",
    }),
    [artist.avatar, artist.name]
  );

  const badgeProps = useMemo(
    () => ({
      show: true,
      showVerified: artist.isVerified,
      text: "Artist Studio",
    }),
    [artist.isVerified]
  );

  const titleProps = useMemo(
    () => ({
      text: welcomeTitle,
    }),
    [welcomeTitle]
  );

  return (
    <>
      <BaseHeader isLoading={isLoading}>
        <HeaderContent
          image={imageProps}
          badge={badgeProps}
          title={titleProps}
          subtitle={statsSubtitle}
          isLoading={isLoading}
        />

        {/* Дополнительный градиентный overlay для красоты */}
        {!isLoading && (
          <motion.div
            className="absolute inset-0 rounded-3xl pointer-events-none"
            style={{
              background:
                "linear-gradient(135deg, rgba(16, 185, 129, 0.05) 0%, rgba(34, 197, 94, 0.02) 50%, rgba(6, 182, 212, 0.05) 100%)",
            }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.4, duration: 0.8 }}
          />
        )}
      </BaseHeader>

      {/* Модалки с lazy loading */}
      <AnimatePresence>
        {modals.upload && (
          <UploadTrackModal
            isOpen={modals.upload}
            onClose={() => toggleModal("upload", false)}
            artist={{
              _id: artist._id,
              name: artist.name,
              avatar: artist.avatar,
            }}
          />
        )}

        {modals.edit && (
          <EditProfileModal
            isOpen={modals.edit}
            onClose={() => toggleModal("edit", false)}
            artist={artist}
            onSave={onArtistUpdate}
          />
        )}

        {modals.advanced && (
          <AdvancedSettingsModal
            isOpen={modals.advanced}
            onClose={() => toggleModal("advanced", false)}
            artist={artist}
            onSave={onArtistUpdate}
          />
        )}
      </AnimatePresence>
    </>
  );
};

export default ArtistStudioHeader;
