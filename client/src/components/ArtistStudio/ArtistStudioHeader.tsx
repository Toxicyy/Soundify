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

/**
 * ArtistStudioHeader - FINAL FIXED VERSION
 *
 * CRITICAL FIXES:
 * - Fixed More menu to include ALL options (Edit Profile, Advanced Settings, Create Album)
 * - Welcome text ALWAYS stays aligned to left edge of avatar, never centers
 * - Action buttons ALWAYS stay within header bounds, never overflow
 * - Fixed invalid Tailwind classes (w-25, h-25, etc.)
 * - Proper responsive layout that maintains structure at all breakpoints
 *
 * LAYOUT CONSTRAINTS:
 * - Text alignment: Always left-aligned relative to avatar
 * - Button positioning: Always within header container
 * - Avatar sizing: Proper Tailwind classes (w-16, w-20, etc.)
 * - Responsive behavior: Consistent across all screen sizes
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
  className?: string;
}

/**
 * Enhanced action button with proper sizing
 */
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
 * FIXED Mobile menu with ALL options included
 */
const MobileActionsMenu: FC<{
  isOpen: boolean;
  onClose: () => void;
  onAction: (action: string) => void;
}> = ({ isOpen, onClose, onAction }) => {
  // Lock body scroll when menu is open
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
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/30 backdrop-blur-sm z-[9998] sm:hidden"
            onClick={onClose}
          />

          {/* FIXED: Menu with ALL options */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: -10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -10 }}
            transition={{ duration: 0.15 }}
            className="fixed top-20 right-3 w-52 bg-gray-900/98 backdrop-blur-xl rounded-xl border border-white/15 shadow-2xl z-[9999] sm:hidden overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* ALL menu items included */}
            <div className="py-2">
              {[
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
                  className="w-full px-4 py-3 text-left transition-all duration-150 hover:bg-white/10 active:bg-white/15 text-white"
                  aria-label={item.text}
                >
                  <div className="flex items-center gap-3">
                    <span
                      className="text-base text-white/80"
                      aria-hidden="true"
                    >
                      {item.icon}
                    </span>
                    <span className="font-medium text-sm">{item.text}</span>
                  </div>
                </button>
              ))}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

const ArtistStudioHeader: FC<ArtistStudioHeaderProps> = ({
  artist,
  tracksCount,
  isLoading = false,
  onArtistUpdate,
}) => {
  const navigate = useNavigate();

  // Modal state management
  const [modals, setModals] = useState<ModalState>({
    upload: false,
    edit: false,
    advanced: false,
    mobileMenu: false,
  });

  // Optimized modal toggle handler
  const toggleModal = useCallback(
    (modalName: keyof ModalState, state?: boolean) => {
      setModals((prev) => ({
        ...prev,
        [modalName]: state !== undefined ? state : !prev[modalName],
      }));
    },
    []
  );

  /**
   * Fixed navigation handler with proper async handling
   */
  const handleNavigation = useCallback(
    async (path: string) => {
      try {
        if (modals.mobileMenu) {
          toggleModal("mobileMenu", false);
        }

        await new Promise((resolve) => setTimeout(resolve, 100));
        navigate(path, { replace: false });
      } catch (error) {
        console.error("Navigation error:", error);
      }
    },
    [navigate, modals.mobileMenu, toggleModal]
  );

  /**
   * Mobile action handler with fixed navigation
   */
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

  // Number formatting
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

  // FIXED: Welcome title with proper left alignment
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

  // FIXED: Stats and actions layout - buttons stay within header
  const statsSubtitle = useMemo(
    () => (
      <div className="flex flex-col space-y-3">
        {/* Stats with better mobile layout */}
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

        {/* FIXED: Desktop Actions - constrained within header */}
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

        {/* FIXED: Mobile Actions - constrained within header */}
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
            size="sm"
            ariaLabel="Upload new track"
            className="flex-1"
          />

          {/* Mobile menu button */}
          <div className="relative">
            <ActionButton
              icon={<EllipsisOutlined />}
              text="More"
              onClick={() => toggleModal("mobileMenu")}
              variant="secondary"
              size="sm"
              ariaLabel="Open more actions menu"
              className="whitespace-nowrap"
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
      handleNavigation,
      modals.mobileMenu,
      handleMobileAction,
    ]
  );

  // FIXED: Image props with correct Tailwind classes
  const imageProps = useMemo(
    () => ({
      src: artist.avatar || "/default-artist-avatar.png",
      alt: `${artist.name} avatar`,
      className: `
        w-16 h-16 
        sm:w-20 sm:h-20 
        md:w-24 md:h-24 
        lg:w-28 lg:h-28
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
      {/* FIXED: Header with proper height constraints */}
      <BaseHeader
        isLoading={isLoading}
        className="min-h-[160px] max-h-[200px] overflow-hidden"
      >
        <HeaderContent
          image={imageProps}
          badge={badgeProps}
          title={titleProps}
          subtitle={statsSubtitle}
          isLoading={isLoading}
        />

        {/* Enhanced gradient overlay */}
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

      {/* Modals with proper scroll handling */}
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
