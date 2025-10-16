import { type FC, useState, useCallback, useMemo, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import {
  PlusOutlined,
  EditOutlined,
  SettingOutlined,
  UnorderedListOutlined,
  EllipsisOutlined,
} from "@ant-design/icons";
import { BaseHeader, HeaderContent } from "../../shared/BaseHeader";
import { GlassButton } from "../../shared/components/StyledComponents";
import { type Artist } from "../../types/ArtistData";
import UploadTrackModal from "./components/UploadTrackModal";
import EditProfileModal from "./components/EditProfileModal";
import AdvancedSettingsModal from "./components/AdvancedSettingsModal";

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
  size?: "xs" | "sm" | "md" | "lg";
  ariaLabel?: string;
  disabled?: boolean;
  className?: string;
}

const ActionButton: FC<ActionButtonProps> = ({
  icon,
  text,
  onClick,
  variant = "secondary",
  size = "sm",
  ariaLabel,
  disabled = false,
  className = "",
}) => (
  <GlassButton
    onClick={onClick}
    variant={variant}
    size={size}
    disabled={disabled}
    whileHover={{ y: -1 }}
    whileTap={{ scale: 0.98 }}
    aria-label={ariaLabel || text}
    role="button"
    tabIndex={0}
    className={className}
  >
    <span className="text-sm" aria-hidden="true">
      {icon}
    </span>
    <span className="font-medium text-xs sm:text-sm">{text}</span>
  </GlassButton>
);

/**
 * Mobile actions menu with all 3 options
 */
const MobileActionsMenu: FC<{
  isOpen: boolean;
  onClose: () => void;
  onAction: (action: string) => void;
}> = ({ isOpen, onClose, onAction }) => {
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
      return () => {
        document.body.style.overflow = "unset";
      };
    }
  }, [isOpen]);

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/30 backdrop-blur-sm z-[9998] md:hidden"
            onClick={onClose}
          />

          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: -10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -10 }}
            transition={{ duration: 0.15 }}
            className="fixed top-20 right-3 w-56 bg-gray-900/98 backdrop-blur-xl rounded-xl border border-white/15 shadow-2xl z-[9999] md:hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="py-2 flex flex-col">
              <button
                onClick={() => {
                  onAction("edit");
                  onClose();
                }}
                className="w-full px-4 py-3 text-left transition-all duration-150 hover:bg-white/10 active:bg-white/15 text-white border-b border-white/5"
                aria-label="Edit Profile"
              >
                <div className="flex items-center gap-3">
                  <span className="text-base text-white/80" aria-hidden="true">
                    <EditOutlined />
                  </span>
                  <span className="font-medium text-sm">Edit Profile</span>
                </div>
              </button>

              <button
                onClick={() => {
                  onAction("advanced");
                  onClose();
                }}
                className="w-full px-4 py-3 text-left transition-all duration-150 hover:bg-white/10 active:bg-white/15 text-white border-b border-white/5"
                aria-label="Advanced Settings"
              >
                <div className="flex items-center gap-3">
                  <span className="text-base text-white/80" aria-hidden="true">
                    <SettingOutlined />
                  </span>
                  <span className="font-medium text-sm">Advanced Settings</span>
                </div>
              </button>

              <button
                onClick={() => {
                  onAction("album");
                  onClose();
                }}
                className="w-full px-4 py-3 text-left transition-all duration-150 hover:bg-white/10 active:bg-white/15 text-white"
                aria-label="Create Album"
              >
                <div className="flex items-center gap-3">
                  <span className="text-base text-white/80" aria-hidden="true">
                    <UnorderedListOutlined />
                  </span>
                  <span className="font-medium text-sm">Create Album</span>
                </div>
              </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

/**
 * Artist studio header with stats, actions, and modal management
 * Features welcome message, statistics, and action buttons
 */
const ArtistStudioHeader: FC<ArtistStudioHeaderProps> = ({
  artist,
  tracksCount,
  isLoading = false,
  onArtistUpdate,
}) => {
  const navigate = useNavigate();

  const [modals, setModals] = useState<ModalState>({
    upload: false,
    edit: false,
    advanced: false,
    mobileMenu: false,
  });

  const toggleModal = useCallback(
    (modalName: keyof ModalState, state?: boolean) => {
      setModals((prev) => ({
        ...prev,
        [modalName]: state !== undefined ? state : !prev[modalName],
      }));
    },
    []
  );

  const handleNavigation = useCallback(
    async (path: string) => {
      if (modals.mobileMenu) {
        toggleModal("mobileMenu", false);
      }

      await new Promise((resolve) => setTimeout(resolve, 100));
      navigate(path, { replace: false });
    },
    [navigate, modals.mobileMenu, toggleModal]
  );

  const handleMobileAction = useCallback(
    (action: string) => {
      switch (action) {
        case "edit":
          toggleModal("edit", true);
          break;
        case "advanced":
          toggleModal("advanced", true);
          break;
        case "album":
          handleNavigation("/artist-studio/create-album");
          break;
      }
    },
    [toggleModal, handleNavigation]
  );

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

  const welcomeTitle = useMemo(
    () => (
      <div className="flex flex-col text-left">
        <motion.span
          className="text-white/70 text-sm sm:text-base lg:text-lg font-normal mb-1"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          Welcome back,
        </motion.span>
        <motion.span
          className="bg-gradient-to-r from-white via-green-100 to-emerald-200 bg-clip-text text-transparent text-lg sm:text-xl lg:text-2xl font-bold"
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

  const statsSubtitle = useMemo(
    () => (
      <div className="flex flex-col space-y-3">
        <div className="flex flex-wrap gap-3 sm:gap-4">
          <motion.div
            className="flex items-center gap-2"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.6 }}
          >
            <div className="w-2 h-2 bg-gradient-to-r from-blue-400 to-cyan-400 rounded-full"></div>
            <span className="text-white/90 font-medium text-sm">
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
            <span className="text-white/90 font-medium text-sm">
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
              <span className="text-green-400 font-medium text-sm">
                Verified
              </span>
            </motion.div>
          )}
        </div>

        <motion.div
          className="hidden md:flex items-center gap-2 lg:gap-3 justify-end"
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 1.2 }}
        >
          <ActionButton
            icon={<EditOutlined />}
            text="Edit"
            onClick={() => toggleModal("edit", true)}
            variant="secondary"
            size="sm"
            ariaLabel="Edit artist profile"
          />
          <ActionButton
            icon={<SettingOutlined />}
            text="Settings"
            onClick={() => toggleModal("advanced", true)}
            variant="secondary"
            size="sm"
            ariaLabel="Open advanced settings"
          />
          <ActionButton
            icon={<UnorderedListOutlined />}
            text="Album"
            onClick={() => handleNavigation("/artist-studio/create-album")}
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

        <motion.div
          className="flex md:hidden items-center gap-2"
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 1.2 }}
        >
          <ActionButton
            icon={<PlusOutlined />}
            text="Upload Track"
            onClick={() => toggleModal("upload", true)}
            variant="primary"
            size="xs"
            ariaLabel="Upload new track"
          />

          <div className="relative">
            <ActionButton
              icon={<EllipsisOutlined />}
              text="More"
              onClick={() => {
                toggleModal("mobileMenu");
              }}
              variant="secondary"
              size="sm"
              ariaLabel="Open more actions menu"
              className="whitespace-nowrap"
            />

            <MobileActionsMenu
              isOpen={modals.mobileMenu}
              onClose={() => {
                toggleModal("mobileMenu", false);
              }}
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
      handleNavigation,
      modals.mobileMenu,
      handleMobileAction,
    ]
  );

  const imageProps = useMemo(
    () => ({
      src: artist.avatar || "/default-artist-avatar.png",
      alt: `${artist.name} avatar`,
      className: `
        w-30 h-30 
        sm:w-36 sm:h-36
        md:w-40 md:h-40
        lg:w-45 lg:h-45
        rounded-full object-cover border-3 border-white/20 shadow-lg
      `,
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
      <BaseHeader
        isLoading={isLoading}
        className="h-[210px] sm:h-[230px] md:h-[235px] lg:h-[240px] xl:h-[250px]"
      >
        <HeaderContent
          image={imageProps}
          badge={badgeProps}
          title={titleProps}
          subtitle={statsSubtitle}
          isLoading={isLoading}
        />

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
