import { type FC, type ReactNode } from "react";
import VerifiedBadge from "./VerifiedBadge";

interface BaseHeaderProps {
  isLoading: boolean;
  children?: ReactNode;
  className?: string;
}

interface HeaderContentProps {
  image: {
    src?: string;
    alt: string;
    className: string;
    callback?: () => void;
  };
  badge?: {
    show: boolean;
    showVerified: boolean;
    text: string;
  };
  title: {
    text: string | ReactNode;
    callback?: () => void;
  };
  subtitle?: string | ReactNode;
  isLoading: boolean;
}

/**
 * Skeleton loader component for header elements
 */
const HeaderSkeleton: FC<{ className: string }> = ({ className }) => (
  <div
    className={`bg-gradient-to-r from-white/15 via-white/25 to-white/15 backdrop-blur-md border border-white/25 rounded-lg relative overflow-hidden ${className}`}
  >
    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/35 to-transparent -skew-x-12 animate-shimmer"></div>
  </div>
);

/**
 * Base header container with consistent styling and loading states
 */
export const BaseHeader: FC<BaseHeaderProps> = ({
  children,
  className = "",
}) => (
  <div
    className={`w-full h-[24vh] xl:h-[30vh] mt-12 bg-white/10 p-6 sm:p-8 lg:p-10 rounded-3xl border border-white/20 ${className}`}
  >
    {children}
  </div>
);

/**
 * Reusable header content component with image, title, and metadata
 * Handles loading states and responsive design
 */
export const HeaderContent: FC<HeaderContentProps> = ({
  image,
  badge,
  title,
  subtitle,
  isLoading,
}) => {
  if (isLoading) {
    return (
      <div className="flex gap-3 sm:gap-5 items-end flex-row">
        {/* Image skeleton */}
        <div
          className={`${image.className} bg-gradient-to-br from-white/10 via-white/20 to-white/5 backdrop-blur-md border border-white/20 relative overflow-hidden`}
        >
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent -skew-x-12 animate-shimmer"></div>
        </div>

        <div className="flex-1 text-center sm:text-left">
          {/* Badge skeleton */}
          {badge?.show && (
            <div className="flex items-center gap-2 mb-2 justify-center sm:justify-start">
              <HeaderSkeleton className="w-8 h-8 rounded-full" />
              <HeaderSkeleton className="h-5 w-32 sm:w-48 rounded-md" />
            </div>
          )}

          {/* Title skeleton */}
          <HeaderSkeleton className="h-12 sm:h-16 lg:h-20 w-64 sm:w-80 lg:w-96 rounded-2xl mb-2 mx-auto sm:mx-0" />

          {/* Subtitle skeleton */}
          <HeaderSkeleton className="h-4 sm:h-5 w-24 sm:w-32 rounded-md mx-auto sm:mx-0" />
        </div>
      </div>
    );
  }

  return (
    <div className="flex gap-3 sm:gap-5 items-end flex-row">
      {/* Main image */}
      <img
        src={image.src}
        alt={image.alt}
        className={`${image.className} drop-shadow-[0_7px_8px_rgba(0,0,0,0.3)]`}
        loading="lazy"
        onClick={image.callback}
      />

      <div className="flex-1 text-center sm:text-left">
        {/* Verified badge */}
        {badge?.show && (
          <div className="flex items-center gap-2 mb-2 justify-center sm:justify-start">
            {badge.showVerified && (
              <VerifiedBadge size={24} aria-hidden="true" />
            )}
            <p className="text-sm sm:text-lg font-medium text-white">
              {badge.text}
            </p>
          </div>
        )}

        {/* Main title */}
        <h1
          className={`text-2xl sm:text-4xl lg:text-[5rem] font-bold text-white mb-2 break-words cursor-${
            title.callback ? "pointer" : "default"
          } `}
          onClick={title.callback}
        >
          {typeof title.text === "string" ? title.text : title.text}
        </h1>

        {/* Subtitle/metadata */}
        {subtitle && (
          <div className="text-sm sm:text-lg text-white/80">{subtitle}</div>
        )}
      </div>
    </div>
  );
};
