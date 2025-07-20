import { type FC } from "react";
import {
  ApartmentOutlined,
  ClockCircleOutlined,
  HeartFilled,
  HomeOutlined,
  InsertRowRightOutlined,
  PlusOutlined,
} from "@ant-design/icons";
import { Link, useLocation } from "react-router-dom";

interface NavigationItem {
  text: string;
  animationDuration: number;
  path: string;
  callback?: () => void;
}

interface MobileNavigationProps {
  navigationItems: NavigationItem[];
}

/**
 * Mobile tab-bar navigation component
 * Features horizontal icon-based navigation with active states
 */
export const MobileNavigation: FC<MobileNavigationProps> = ({
  navigationItems,
}) => {
  const location = useLocation();
  const pathname = location.pathname;

  const getIcon = (text: string, isActive: boolean) => {
    const iconProps = {
      style: {
        color: isActive ? "white" : "rgba(255, 255, 255, 0.6)",
        fontSize: "20px",
      },
    };

    const icons = {
      Home: <HomeOutlined {...iconProps} />,
      Playlists: <ApartmentOutlined {...iconProps} />,
      Artists: <InsertRowRightOutlined {...iconProps} />,
      "Liked Songs": <HeartFilled {...iconProps} />,
      Recently: <ClockCircleOutlined {...iconProps} />,
      "New Playlist": <PlusOutlined {...iconProps} />,
    };

    return icons[text as keyof typeof icons] || <HomeOutlined {...iconProps} />;
  };

  const getDisplayText = (text: string) => {
    const shortNames = {
      Home: "Home",
      Playlists: "Radio",
      Artists: "Artists",
      "Liked Songs": "Liked",
      Recently: "Recent",
      "New Playlist": "New",
    };

    return shortNames[text as keyof typeof shortNames] || text;
  };

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-black/70 backdrop-blur-md border-t border-white/10 z-50">
      <div className="flex items-center justify-around px-2 py-2 pb-4">
        {navigationItems.map((item) => {
          const isActive = pathname === item.path && !item.callback;

          return (
            <Link
              key={item.text}
              to={item.path}
              onClick={item.callback ? item.callback : undefined}
              className="relative flex flex-col items-center justify-center py-2 px-1 min-w-0 flex-1 hover:bg-white/5 rounded-lg transition-colors duration-200"
            >
              <div className="mb-1">{getIcon(item.text, isActive)}</div>
              <span
                className={`text-xs font-medium truncate max-w-full transition-colors duration-200 ${
                  isActive ? "text-white" : "text-white/60"
                }`}
              >
                {getDisplayText(item.text)}
              </span>

              {/* Active indicator */}
              {isActive && (
                <div className="absolute top-0 left-1/2 transform -translate-x-1/2 w-1 h-1 bg-white rounded-full" />
              )}
            </Link>
          );
        })}
      </div>
    </div>
  );
};
