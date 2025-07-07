import { createPortal } from "react-dom";
import {
  HeartOutlined,
  HeartFilled,
  UnorderedListOutlined,
  EyeInvisibleOutlined,
  UserOutlined,
  PlaySquareOutlined,
  InfoCircleOutlined,
  ShareAltOutlined,
  DeleteOutlined,
} from "@ant-design/icons";
import { useState, useRef, useEffect } from "react";

interface ContextMenuProps {
  isOpen: boolean;
  onClose: () => void;
  onMenuItemClick: (index: number) => void;
  anchorRef: React.RefObject<HTMLDivElement | null>;
  isPlaying: boolean;
  isLiked: boolean;
  isPending?: boolean;
  usePortal?: boolean;
  showRemoveFromPlaylist?: boolean; // Новый проп для показа опции удаления
}

export default function ContextMenu({
  isOpen,
  onClose,
  onMenuItemClick,
  anchorRef,
  isPlaying,
  isLiked,
  isPending = false,
  usePortal = true,
  showRemoveFromPlaylist = false,
}: ContextMenuProps) {
  const [hoveredMenuItem, setHoveredMenuItem] = useState<number | null>(null);
  const [position, setPosition] = useState({ top: 0, left: 0 });
  const menuRef = useRef<HTMLDivElement>(null);

  // Базовые пункты меню
  const baseMenuItems = [
    {
      icon: isPending ? (
        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
      ) : isLiked ? (
        <HeartFilled />
      ) : (
        <HeartOutlined />
      ),
      label: isLiked ? "Убрать из любимых треков" : "Добавить в любимые треки",
      disabled: isPending,
      className: "",
    },
    {
      icon: <UnorderedListOutlined />,
      label: "Добавить в очередь",
      disabled: false,
      className: "",
    },
    {
      icon: <EyeInvisibleOutlined />,
      label: "Скрыть трек",
      disabled: false,
      className: "",
    },
    {
      icon: <UserOutlined />,
      label: "К исполнителю",
      disabled: false,
      className: "",
    },
    {
      icon: <PlaySquareOutlined />,
      label: "К альбому",
      disabled: false,
      className: "",
    },
    {
      icon: <InfoCircleOutlined />,
      label: "Посмотреть сведения",
      disabled: false,
      className: "",
    },
    {
      icon: <ShareAltOutlined />,
      label: "Поделиться",
      disabled: false,
      className: "",
    },
  ];

  // Добавляем пункт удаления из плейлиста если нужно
  const menuItems = showRemoveFromPlaylist
    ? [
        ...baseMenuItems,
        {
          icon: <DeleteOutlined />,
          label: "Удалить из плейлиста",
          disabled: false,
          className: "text-red-400 hover:text-red-300", // Красный цвет для удаления
        },
      ]
    : baseMenuItems;

  // Вычисляем позицию меню (только для портала)
  useEffect(() => {
    if (isOpen && usePortal && anchorRef.current) {
      const visibleItems = menuItems.filter(
        (item) => !isPlaying || item.label !== "Добавить в очередь"
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
  }, [isOpen, usePortal, anchorRef, isPlaying, showRemoveFromPlaylist]);

  // Закрытие меню при клике вне его
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
      if (usePortal) {
        onClose(); // Закрываем меню при скролле только для портала
      }
    };

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      if (usePortal) {
        document.addEventListener("scroll", handleScroll, true);
      }
      document.addEventListener("keydown", handleEscape);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      if (usePortal) {
        document.removeEventListener("scroll", handleScroll, true);
      }
      document.removeEventListener("keydown", handleEscape);
    };
  }, [isOpen, onClose, anchorRef, usePortal]);

  const handleMenuItemClick = (index: number, disabled: boolean) => {
    if (disabled) return;

    onMenuItemClick(index);
    onClose();
  };

  if (!isOpen) return null;

  // Основной JSX меню
  const menuContent = (
    <div
      ref={menuRef}
      className={`min-w-[220px] bg-black/30 backdrop-blur-md border border-white/20 rounded-lg shadow-2xl overflow-hidden animate-fade-in-up ${
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
        .filter((item) => !isPlaying || item.label !== "Добавить в очередь")
        .map((item, filteredIndex) => {
          const isDeleteItem = item.label === "Удалить из плейлиста";

          return (
            <div
              key={item.originalIndex}
              className={`px-4 py-3 text-sm flex items-center gap-3 transition-all duration-200 ${
                item.disabled
                  ? "opacity-50 cursor-not-allowed"
                  : "cursor-pointer hover:bg-white/5"
              } ${
                hoveredMenuItem === filteredIndex && !item.disabled
                  ? "bg-white/10 backdrop-blur-sm"
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
                className={`text-base transition-all duration-200 ${
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

  // Возвращаем либо через портал, либо обычным способом
  return usePortal ? createPortal(menuContent, document.body) : menuContent;
}
