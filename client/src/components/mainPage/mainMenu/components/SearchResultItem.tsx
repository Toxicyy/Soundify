import { memo, useMemo } from "react";
import { motion } from "framer-motion";
import {
  PlayCircleOutlined,
  UserOutlined,
  PicRightOutlined,
  UnorderedListOutlined,
} from "@ant-design/icons";

interface SearchResultItemProps {
  item: any;
  onClick: () => void;
  showPlayButton?: boolean;
}

/**
 * Individual search result item component
 * Displays track, artist, album, or playlist with appropriate icon
 */
const SearchResultItem = ({
  item,
  onClick,
  showPlayButton = false,
}: SearchResultItemProps) => {
  const icon = useMemo(() => {
    switch (item.type) {
      case "track":
        return <PlayCircleOutlined className="text-lg text-white/70" />;
      case "artist":
        return <UserOutlined className="text-lg text-white/70" />;
      case "album":
        return <PicRightOutlined className="text-lg text-white/70" />;
      case "playlist":
        return <UnorderedListOutlined className="text-lg text-white/70" />;
      default:
        return null;
    }
  }, [item.type]);

  const secondaryText = useMemo(() => {
    switch (item.type) {
      case "track":
        return item.artist?.name || "Unknown artist";
      case "artist":
        return `${item.followerCount || 0} followers`;
      case "album":
        return item.artist?.name || "Unknown artist";
      case "playlist":
        return item.owner?.name || "Unknown user";
      default:
        return "";
    }
  }, [item]);

  return (
    <motion.div
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      onClick={onClick}
      className="px-4 py-3 cursor-pointer transition-all duration-200 flex items-center justify-between group hover:bg-white/10"
    >
      <div className="flex gap-3">
        <div className="relative flex-shrink-0">
          {item.coverUrl || item.avatar ? (
            <div className="w-12 h-12 rounded-lg overflow-hidden bg-white/10">
              <img
                src={item.coverUrl || item.avatar}
                alt={item.name}
                className="w-full h-full object-cover"
              />
            </div>
          ) : (
            <div className="w-12 h-12 rounded-lg bg-white/10 flex items-center justify-center">
              {icon}
            </div>
          )}

          {showPlayButton && (
            <div className="absolute inset-0 bg-black/50 rounded-lg flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
              <PlayCircleOutlined className="text-2xl text-white" />
            </div>
          )}
        </div>

        <div className="flex-1 min-w-0">
          <h4 className="font-medium text-white truncate">{item.name}</h4>
          <p className="text-sm text-white/60 truncate">{secondaryText}</p>
        </div>
      </div>
      <div>
        <h1 className="text-white/50 text-sm">{item.type}</h1>
      </div>
    </motion.div>
  );
};

export default memo(SearchResultItem);
