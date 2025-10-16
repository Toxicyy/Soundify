import { type FC, memo } from "react";

interface VerifiedBadgeProps {
  size?: number;
  className?: string;
  color?: "blue" | "gold" | "custom";
  customColors?: {
    background: string;
    border: string;
    check: string;
  };
}

/**
 * Verified badge component displaying verification status
 * Features responsive sizing, color themes, and accessibility support
 */
const VerifiedBadge: FC<VerifiedBadgeProps> = ({
  size = 24,
  className = "",
  color = "blue",
  customColors,
}) => {
  /**
   * Get color scheme based on selected theme
   */
  const getColors = () => {
    if (customColors) {
      return customColors;
    }

    switch (color) {
      case "gold":
        return {
          background: "#FFD700",
          border: "#FFA500",
          check: "white",
        };
      case "blue":
      default:
        return {
          background: "#4A90E2",
          border: "#3A7BD5",
          check: "white",
        };
    }
  };

  const colors = getColors();

  return (
    <div
      className={`inline-flex items-center justify-center ${className}`}
      role="img"
      aria-label="Verified badge"
      title="Verified account"
    >
      <svg
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="drop-shadow-sm"
      >
        <defs>
          <linearGradient
            id={`gradient-${size}`}
            x1="0%"
            y1="0%"
            x2="100%"
            y2="100%"
          >
            <stop offset="0%" stopColor={colors.background} />
            <stop offset="100%" stopColor={colors.border} />
          </linearGradient>
        </defs>

        <path
          d="M12 2L15.09 8.26L22 9L17 14L18.18 21L12 17.77L5.82 21L7 14L2 9L8.91 8.26L12 2Z"
          fill={`url(#gradient-${size})`}
          stroke={colors.border}
          strokeWidth="0.5"
        />

        <path
          d="M8.5 12.5L10.5 14.5L15.5 9.5"
          stroke={colors.check}
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          fill="none"
          className="drop-shadow-sm"
        />
      </svg>
    </div>
  );
};

export default memo(VerifiedBadge);