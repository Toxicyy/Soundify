import { type FC, useState } from "react";
import { BaseHeader, HeaderContent } from "../../shared/BaseHeader";
import {
  PlusOutlined,
  EditOutlined,
  SettingOutlined,
  UnorderedListOutlined,
} from "@ant-design/icons";
import { motion } from "framer-motion";
import UploadTrackModal from "./components/UploadTrackModal";
import EditProfileModal from "./components/EditProfileModal";
import AdvancedSettingsModal from "./components/AdvancedSettingsModal";

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

interface ArtistStudioHeaderProps {
  artist: Artist;
  tracksCount: number;
  isLoading?: boolean;
  onArtistUpdate?: (updatedArtist: Partial<Artist>) => void;
}

const ActionButton: FC<{
  icon: React.ReactNode;
  text: string;
  onClick?: () => void;
  variant?: "primary" | "secondary";
}> = ({ icon, text, onClick, variant = "secondary" }) => (
  <motion.button
    onClick={onClick}
    className={`
      flex items-center gap-2 px-3 py-2 rounded-xl font-medium transition-all duration-300 cursor-pointer text-sm
      ${
        variant === "primary"
          ? "bg-gradient-to-r from-green-500/80 to-emerald-500/80 hover:from-green-500 hover:to-emerald-500 text-white shadow-lg hover:shadow-green-500/25"
          : "bg-white/10 hover:bg-white/20 text-white border border-white/20 hover:border-white/30"
      }
      backdrop-blur-md hover:scale-105 focus:outline-none focus:ring-2 focus:ring-white/20
    `}
    whileHover={{ y: -2 }}
    whileTap={{ scale: 0.98 }}
  >
    <span className="text-sm">{icon}</span>
    <span className="font-semibold">{text}</span>
  </motion.button>
);

const ArtistStudioHeader: FC<ArtistStudioHeaderProps> = ({
  artist,
  tracksCount,
  isLoading = false,
  onArtistUpdate,
}) => {
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isAdvancedModalOpen, setIsAdvancedModalOpen] = useState(false);

  // Форматируем числа для красивого отображения
  const formatNumber = (num: number): string => {
    if (num >= 1000000) {
      return `${(num / 1000000).toFixed(1)}M`;
    }
    if (num >= 1000) {
      return `${(num / 1000).toFixed(1)}K`;
    }
    return num.toString();
  };

  // Создаем приветствие с градиентом
  const welcomeTitle = (
    <div className="flex flex-col">
      <motion.span
        className="text-white/70 text-lg sm:text-xl lg:text-2xl font-normal mb-1"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        Welcome back,
      </motion.span>
      <motion.span
        className="bg-gradient-to-r from-white via-green-100 to-emerald-200 bg-clip-text text-transparent"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
      >
        {artist.name}
      </motion.span>
    </div>
  );

  // Статистика с иконками и анимацией
  const statsSubtitle = (
    <div className="flex flex-col sm:flex-row gap-4 sm:gap-8 mt-4">
      <motion.div
        className="flex items-center gap-2"
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 0.6 }}
      >
        <div className="w-2 h-2 bg-gradient-to-r from-blue-400 to-cyan-400 rounded-full"></div>
        <span className="text-white/90 font-medium">
          {formatNumber(tracksCount)} {tracksCount === 1 ? "Track" : "Tracks"}
        </span>
      </motion.div>

      <motion.div
        className="flex items-center gap-2"
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 0.8 }}
      >
        <div className="w-2 h-2 bg-gradient-to-r from-purple-400 to-pink-400 rounded-full"></div>
        <span className="text-white/90 font-medium">
          {formatNumber(artist.followerCount)}{" "}
          {artist.followerCount === 1 ? "Follower" : "Followers"}
        </span>
      </motion.div>

      {/* Быстрые действия */}
      <motion.div
        className="flex gap-2 sm:ml-auto flex-wrap"
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 1.0 }}
      >
        <ActionButton
          icon={<EditOutlined />}
          text="Edit Profile"
          onClick={() => setIsEditModalOpen(true)}
          variant="secondary"
        />
        <ActionButton
          icon={<SettingOutlined />}
          text="Advanced"
          onClick={() => setIsAdvancedModalOpen(true)}
          variant="secondary"
        />
        <ActionButton
          icon={<UnorderedListOutlined />}
          text="Create Album"
          onClick={() => console.log("Create Album - Coming soon!")}
          variant="secondary"
        />
        <ActionButton
          icon={<PlusOutlined />}
          text="Upload Track"
          onClick={() => setIsUploadModalOpen(true)}
          variant="primary"
        />
      </motion.div>
    </div>
  );

  return (
    <>
      <BaseHeader isLoading={isLoading}>
        <HeaderContent
          image={{
            src: artist.avatar || "/default-artist-avatar.png",
            alt: `${artist.name} avatar`,
            className:
              "w-[200px] h-[200px] lg:w-[230px] lg:h-[230px] rounded-full object-cover border-4 border-white/20 shadow-xl",
          }}
          badge={{
            show: true,
            showVerified: artist.isVerified,
            text: "Artist Studio",
          }}
          title={{
            text: welcomeTitle,
          }}
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
            transition={{ delay: 1.2, duration: 0.8 }}
          />
        )}
      </BaseHeader>

      {/* Модалки */}
      <UploadTrackModal
        isOpen={isUploadModalOpen}
        onClose={() => setIsUploadModalOpen(false)}
        artist={artist}
      />

      <EditProfileModal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        artist={artist}
        onSave={onArtistUpdate}
      />

      <AdvancedSettingsModal
        isOpen={isAdvancedModalOpen}
        onClose={() => setIsAdvancedModalOpen(false)}
        artist={artist}
        onSave={onArtistUpdate}
      />
    </>
  );
};

export default ArtistStudioHeader;
