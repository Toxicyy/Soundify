import { memo, useState, useRef, useEffect, useMemo } from "react";
import { createPortal } from "react-dom";
import {
  HeartOutlined,
  HeartFilled,
  UnorderedListOutlined,
  UserOutlined,
  PlaySquareOutlined,
  InfoCircleOutlined,
  ShareAltOutlined,
  DeleteOutlined,
} from "@ant-design/icons";

interface ContextMenuProps {
  isOpen: boolean;
  onClose: () => void;
  onMenuItemClick: (index: number) => void;
  anchorRef: React.RefObject<HTMLDivElement | null>;
  isPlaying: boolean;
  isLiked: boolean;
  isPending?: boolean;
  usePortal?: boolean;
  showRemoveFromPlaylist?: boolean;
}

/**
 * Context menu component with mobile and desktop layouts
 * Provides track actions: like, queue, artist, album, details, share
 */
const ContextMenu = ({
  isOpen,
  onClose,
  onMenuItemClick,
  anchorRef,
  isPlaying,
  isLiked,
  isPending = false,
  usePortal = true,
  showRemoveFromPlaylist = false,
}: ContextMenuProps) => {
  const [hoveredMenuItem, setHoveredMenuItem] = useState<number | null>(null);
  const [position, setPosition] = useState({ top: 0, left: 0 });
  const [isMobile, setIsMobile] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  const baseMenuItems = useMemo(
    () => [
      {
        icon: isPending ? (
          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
        ) : isLiked ? (
          <HeartFilled />
        ) : (
          <HeartOutlined />
        ),
        label: isLiked ? "Remove from liked tracks" : "Add to liked tracks",
        disabled: isPending,
      },
      {
        icon: <UnorderedListOutlined />,
        label: "Add to queue",
        disabled: false,
      },
      {
        icon: <UserOutlined />,
        label: "Go to artist",
        disabled: false,
      },
      {
        icon: <PlaySquareOutlined />,
        label: "Go to album",
        disabled: false,
      },
      {
        icon: <InfoCircleOutlined />,
        label: "View details",
        disabled: false,
      },
      {
        icon: <ShareAltOutlined />,
        label: "Share",
        disabled: false,
      },
    ],
    [isPending, isLiked]
  );

  const menuItems = useMemo(
    () =>
      showRemoveFromPlaylist
        ? [
            ...baseMenuItems,
            {
              icon: <DeleteOutlined />,
              label: "Remove from playlist",
              disabled: false,
            },
          ]
        : baseMenuItems,
    [baseMenuItems, showRemoveFromPlaylist]
  );

  useEffect(() => {
    if (isOpen && usePortal && anchorRef.current && !isMobile) {
      const visibleItems = menuItems.filter(
        (item) => !isPlaying || item.label !== "Add to queue"
      );
      const menuHeight = visibleItems.length * 48 + 16;
      const menuWidth = 220;

      const anchorRect = anchorRef.current.getBoundingClientRect();

      let top = anchorRect.top - menuHeight - 12;
      let left = anchorRect.left - menuWidth + anchorRect.width;

      if (top < 12) {
        top = anchorRect.bottom + 12;
      }

      if (left < 12) {
        left = anchorRect.left;
      } else if (left + menuWidth > window.innerWidth - 12) {
        left = anchorRect.right - menuWidth;
      }

      setPosition({ top, left });
    }
  }, [isOpen, usePortal, anchorRef, isPlaying, isMobile, menuItems]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        menuRef.current &&
        !menuRef.current.contains(event.target as Node) &&
        anchorRef.current &&
        !anchorRef.current.contains(event.target as Node)
      ) {
        onClose();
      }
    };

    const handleScroll = () => {
      if (usePortal && !isMobile) {
        onClose();
      }
    };

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      if (usePortal && !isMobile) {
        document.addEventListener("scroll", handleScroll, true);
      }
      document.addEventListener("keydown", handleEscape);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      if (usePortal && !isMobile) {
        document.removeEventListener("scroll", handleScroll, true);
      }
      document.removeEventListener("keydown", handleEscape);
    };
  }, [isOpen, onClose, anchorRef, usePortal, isMobile]);

  const handleMenuItemClick = (index: number, disabled: boolean) => {
    if (disabled) return;
    onMenuItemClick(index);
    onClose();
  };

  if (!isOpen) return null;

  if (isMobile) {
    const content = (
      <div className="fixed inset-0 z-[9999] flex items-end">
        <div
          className="absolute inset-0 bg-black/40 backdrop-blur-sm"
          onClick={onClose}
        />

        <div
          ref={menuRef}
          className="relative w-full bg-black/50 backdrop-blur-xl border-t border-white/20 rounded-t-3xl overflow-hidden animate-slide-up"
        >
          <div className="flex justify-center py-3">
            <div className="w-12 h-1 bg-white/30 rounded-full" />
          </div>

          <div className="px-4 pb-8">
            {menuItems
              .map((item, originalIndex) => ({ ...item, originalIndex }))
              .filter((item) => !isPlaying || item.label !== "Add to queue")
              .map((item) => {
                const isDeleteItem = item.label === "Remove from playlist";

                return (
                  <div
                    key={item.originalIndex}
                    className={`px-4 py-4 text-base flex items-center gap-4 transition-colors duration-200 rounded-xl mb-2 ${
                      item.disabled
                        ? "opacity-50 cursor-not-allowed"
                        : "cursor-pointer hover:bg-white/10 active:bg-white/20"
                    } ${
                      isDeleteItem ? "border-t border-white/10 mt-4 pt-6" : ""
                    }`}
                    onClick={() =>
                      handleMenuItemClick(item.originalIndex, item.disabled)
                    }
                  >
                    <span
                      className={`text-xl transition-colors duration-200 ${
                        item.disabled
                          ? "text-white/30"
                          : isDeleteItem
                          ? "text-red-400"
                          : "text-white/70"
                      }`}
                    >
                      {item.icon}
                    </span>
                    <span
                      className={`flex-1 font-medium ${
                        isDeleteItem ? "text-red-400" : "text-white"
                      }`}
                    >
                      {item.label}
                    </span>
                  </div>
                );
              })}
          </div>
        </div>
      </div>
    );

    return usePortal ? createPortal(content, document.body) : content;
  }

  const content = (
    <div
      ref={menuRef}
      className={`min-w-[220px] bg-black/30 backdrop-blur-md border border-white/20 rounded-lg shadow-2xl overflow-hidden ${
        usePortal ? "fixed" : "absolute bottom-full right-0 mb-2"
      }`}
      style={
        usePortal
          ? {
              top: position.top,
              left: position.left,
              zIndex: 9999,
              backdropFilter: "blur(20px)",
              WebkitBackdropFilter: "blur(20px)",
            }
          : {
              backdropFilter: "blur(20px)",
              WebkitBackdropFilter: "blur(20px)",
              zIndex: 50,
            }
      }
    >
      {menuItems
        .map((item, originalIndex) => ({ ...item, originalIndex }))
        .filter((item) => !isPlaying || item.label !== "Add to queue")
        .map((item, filteredIndex) => {
          const isDeleteItem = item.label === "Remove from playlist";

          return (
            <div
              key={item.originalIndex}
              className={`px-4 py-3 text-sm flex items-center gap-3 transition-colors duration-200 ${
                item.disabled
                  ? "opacity-50 cursor-not-allowed"
                  : "cursor-pointer hover:bg-white/5"
              } ${
                hoveredMenuItem === filteredIndex && !item.disabled
                  ? "bg-white/10"
                  : ""
              } ${isDeleteItem ? "border-t border-white/10" : ""}`}
              onMouseEnter={() =>
                !item.disabled && setHoveredMenuItem(filteredIndex)
              }
              onMouseLeave={() => setHoveredMenuItem(null)}
              onClick={() =>
                handleMenuItemClick(item.originalIndex, item.disabled)
              }
            >
              <span
                className={`text-base transition-colors duration-200 ${
                  item.disabled
                    ? "text-white/30"
                    : isDeleteItem
                    ? "text-red-400"
                    : hoveredMenuItem === filteredIndex
                    ? "text-white"
                    : "text-white/70"
                }`}
              >
                {item.icon}
              </span>
              <span
                className={`flex-1 ${
                  isDeleteItem ? "text-red-400" : "text-white"
                }`}
              >
                {item.label}
              </span>
            </div>
          );
        })}
    </div>
  );

  return usePortal ? createPortal(content, document.body) : content;
};

export default memo(ContextMenu);
