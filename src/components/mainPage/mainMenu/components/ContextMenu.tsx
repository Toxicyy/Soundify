import {
  HeartOutlined,
  HeartFilled,
  UnorderedListOutlined,
  EyeInvisibleOutlined,
  UserOutlined,
  PlaySquareOutlined,
  InfoCircleOutlined,
  ShareAltOutlined,
} from "@ant-design/icons";
import { useState, useRef, useEffect } from "react";

interface ContextMenuProps {
  isOpen: boolean;
  onClose: () => void;
  onMenuItemClick: (index: number) => void;
  anchorRef: React.RefObject<HTMLDivElement | null>;
  isPlaying: boolean;
  isLiked: boolean;
  isPending?: boolean; // Добавляем prop для состояния загрузки лайка
}

export default function ContextMenu({
  isOpen,
  onClose,
  onMenuItemClick,
  anchorRef,
  isPlaying,
  isLiked,
  isPending = false,
}: ContextMenuProps) {
  const [hoveredMenuItem, setHoveredMenuItem] = useState<number | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  
  const menuItems = [
    {
      icon: isPending ? (
        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
      ) : isLiked ? (
        <HeartFilled />
      ) : (
        <HeartOutlined />
      ),
      label: isLiked ? "Убрать из любимых треков" : "Добавить в любимые треки",
      disabled: isPending, // Отключаем элемент во время загрузки
    },
    {
      icon: <UnorderedListOutlined />,
      label: "Добавить в очередь",
      disabled: false,
    },
    {
      icon: <EyeInvisibleOutlined />,
      label: "Скрыть трек",
      disabled: false,
    },
    {
      icon: <UserOutlined />,
      label: "К исполнителю",
      disabled: false,
    },
    {
      icon: <PlaySquareOutlined />,
      label: "К альбому",
      disabled: false,
    },
    {
      icon: <InfoCircleOutlined />,
      label: "Посмотреть сведения",
      disabled: false,
    },
    {
      icon: <ShareAltOutlined />,
      label: "Поделиться",
      disabled: false,
    },
  ];

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

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen, onClose, anchorRef]);

  const handleMenuItemClick = (index: number, disabled: boolean) => {
    if (disabled) return; // Не выполняем действие если элемент отключен
    
    onMenuItemClick(index);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div
      ref={menuRef}
      className="absolute bottom-full right-0 mb-2 min-w-[220px] bg-black/30 backdrop-blur-md border border-white/20 rounded-lg shadow-2xl z-50 overflow-hidden"
      style={{
        backdropFilter: "blur(20px)",
        WebkitBackdropFilter: "blur(20px)",
      }}
    >
      {menuItems
        .map((item, originalIndex) => ({ ...item, originalIndex })) // Сохраняем оригинальный индекс
        .filter((item) => !isPlaying || item.label !== "Добавить в очередь")
        .map((item, filteredIndex) => (
          <div
            key={item.originalIndex} // Используем оригинальный индекс для key
            className={`px-4 py-3 text-white text-sm flex items-center gap-3 transition-all duration-200 ${
              item.disabled
                ? "opacity-50 cursor-not-allowed"
                : "cursor-pointer hover:bg-white/5"
            } ${
              hoveredMenuItem === filteredIndex && !item.disabled
                ? "bg-white/10 backdrop-blur-sm"
                : ""
            }`}
            onMouseEnter={() => !item.disabled && setHoveredMenuItem(filteredIndex)}
            onMouseLeave={() => setHoveredMenuItem(null)}
            onClick={() => handleMenuItemClick(item.originalIndex, item.disabled)} // Передаем оригинальный индекс и состояние disabled
          >
            <span
              className={`text-base transition-all duration-200 ${
                item.disabled
                  ? "text-white/30"
                  : hoveredMenuItem === filteredIndex
                  ? "text-white"
                  : "text-white/70"
              }`}
            >
              {item.icon}
            </span>
            <span className="flex-1">{item.label}</span>
          </div>
        ))}
    </div>
  );
};