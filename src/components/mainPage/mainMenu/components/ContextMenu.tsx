import {
  HeartOutlined,
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
}


export default function ContextMenu({
  isOpen,
  onClose,
  onMenuItemClick,
  anchorRef,
  isPlaying,
  isLiked
}: ContextMenuProps) {
  const [hoveredMenuItem, setHoveredMenuItem] = useState<number | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const menuItems = [
    {
      icon: <HeartOutlined />,
      label: isLiked ? "Убрать из любимых треков" : "Добавить в любимые треки",
    },
    {
      icon: <UnorderedListOutlined />,
      label: "Добавить в очередь",
    },
    {
      icon: <EyeInvisibleOutlined />,
      label: "Скрыть трек",
    },
    {
      icon: <UserOutlined />,
      label: "К исполнителю",
    },
    {
      icon: <PlaySquareOutlined />,
      label: "К альбому",
    },
    {
      icon: <InfoCircleOutlined />,
      label: "Посмотреть сведения",
    },
    {
      icon: <ShareAltOutlined />,
      label: "Поделиться",
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

  const handleMenuItemClick = (index: number) => {
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
        .filter((item) => !isPlaying || item.label !== "Добавить в очередь")
        .map((item, index) => (
          <div
            key={index}
            className={`px-4 py-3 text-white text-sm cursor-pointer flex items-center gap-3 ${
              hoveredMenuItem === index
                ? "bg-white/10 backdrop-blur-sm"
                : "hover:bg-white/5"
            }`}
            onMouseEnter={() => setHoveredMenuItem(index)}
            onMouseLeave={() => setHoveredMenuItem(null)}
            onClick={() => handleMenuItemClick(index)}
          >
            <span
              className={`text-base transition-all duration-200 ${
                hoveredMenuItem === index ? "text-white" : "text-white/70"
              }`}
            >
              {item.icon}
            </span>
            <span className="flex-1">{item.label}</span>
          </div>
        ))}
    </div>
  );
}
