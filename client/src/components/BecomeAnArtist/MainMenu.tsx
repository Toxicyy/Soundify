import { useState, type FC } from "react";
import { Input, Select, Button, message } from "antd";
import {
  DeleteOutlined,
  InstagramOutlined,
  SpotifyOutlined,
  XOutlined,
} from "@ant-design/icons";
import styled from "styled-components";
import type { ArtistCreate } from "../../Pages/BecomeAnArtist";

interface MainMenuProps {
  localChanges: ArtistCreate;
  setLocalChanges: (changes: Partial<ArtistCreate>) => void;
  onSave: (artistData: ArtistCreate) => Promise<void>;
}

const GlassContainer = styled.div`
  background: rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(15px);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 16px;
  padding: 1rem;
  margin-bottom: 1.5rem;
  transition: all 0.3s ease;

  @media (min-width: 640px) {
    padding: 1.5rem;
  }

  @media (min-width: 1024px) {
    padding: 2rem;
  }

  &:hover {
    background: rgba(255, 255, 255, 0.12);
    border-color: rgba(255, 255, 255, 0.15);
  }
`;

const StyledInput = styled(Input)`
  &.ant-input {
    background-color: rgba(255, 255, 255, 0.1) !important;
    color: white !important;
    border: 1px solid rgba(255, 255, 255, 0.2) !important;
    border-radius: 8px;
    height: 40px;

    @media (min-width: 640px) {
      height: 44px;
    }

    &::placeholder {
      color: rgba(255, 255, 255, 0.6) !important;
      opacity: 1 !important;
    }

    &:focus {
      border-color: #1db954 !important;
      box-shadow: 0 0 0 2px rgba(29, 185, 84, 0.2) !important;
      background-color: rgba(255, 255, 255, 0.15) !important;
    }

    &:hover {
      background-color: rgba(255, 255, 255, 0.12) !important;
      border-color: rgba(255, 255, 255, 0.3) !important;
    }
  }
`;

const StyledMultiSelect = styled(Select<string[]>)`
  .ant-select-selector {
    background-color: rgba(255, 255, 255, 0.1) !important;
    color: white !important;
    border: 1px solid rgba(255, 255, 255, 0.2) !important;
    border-radius: 8px !important;
    min-height: 40px !important;

    @media (min-width: 640px) {
      min-height: 44px !important;
    }
  }

  .ant-select-selection-search-input {
    color: white !important;
  }

  .ant-select-selection-placeholder {
    color: rgba(255, 255, 255, 0.6) !important;
  }

  &.ant-select-focused .ant-select-selector {
    border-color: #1db954 !important;
    box-shadow: 0 0 0 2px rgba(29, 185, 84, 0.2) !important;
    background-color: rgba(255, 255, 255, 0.15) !important;
  }

  &:hover .ant-select-selector {
    background-color: rgba(255, 255, 255, 0.12) !important;
    border-color: rgba(255, 255, 255, 0.3) !important;
  }

  .ant-select-selection-item {
    background-color: rgba(29, 185, 84, 0.8) !important;
    border: 1px solid rgba(29, 185, 84, 0.4) !important;
    color: white !important;
    border-radius: 6px !important;
    font-size: 12px !important;

    @media (min-width: 640px) {
      font-size: 14px !important;
    }
  }

  .ant-select-selection-item-remove {
    color: rgba(255, 255, 255, 0.8) !important;

    &:hover {
      color: white !important;
    }
  }
`;

const SaveButton = styled(Button)`
  &.ant-btn {
    background: linear-gradient(
      135deg,
      rgba(29, 185, 84, 0.9),
      rgba(30, 215, 96, 0.9)
    ) !important;
    backdrop-filter: blur(10px) !important;
    border: 1px solid rgba(29, 185, 84, 0.4) !important;
    color: white !important;
    font-weight: 600 !important;
    font-size: 14px !important;
    height: 44px !important;
    border-radius: 22px !important;
    padding: 0 24px !important;
    box-shadow: 0 4px 16px rgba(29, 185, 84, 0.3) !important;
    transition: all 0.3s ease !important;

    @media (min-width: 640px) {
      font-size: 16px !important;
      height: 48px !important;
      padding: 0 32px !important;
      border-radius: 24px !important;
    }

    &:hover {
      transform: translateY(-2px) !important;
      box-shadow: 0 6px 20px rgba(29, 185, 84, 0.4) !important;
      background: linear-gradient(
        135deg,
        rgba(30, 215, 96, 0.95),
        rgba(29, 185, 84, 0.95)
      ) !important;
      border-color: rgba(29, 185, 84, 0.6) !important;
    }

    &:active {
      transform: translateY(0) !important;
    }

    &:disabled {
      background: rgba(255, 255, 255, 0.1) !important;
      color: rgba(255, 255, 255, 0.4) !important;
      border-color: rgba(255, 255, 255, 0.2) !important;
      transform: none !important;
      box-shadow: none !important;
    }
  }
`;

const genres = [
  "Pop",
  "Rock",
  "Hip-Hop",
  "R&B",
  "Jazz",
  "Classical",
  "Electronic",
  "Folk",
  "Country",
  "Reggae",
  "Blues",
  "Funk",
  "Soul",
  "Alternative",
  "Indie",
  "Metal",
  "Dance",
  "House",
  "Techno",
  "Dubstep",
  "Trap",
  "Latin",
  "K-Pop",
  "Afrobeat",
  "Gospel",
  "Ambient",
  "Experimental",
  "World",
];

const socialPlatforms = [
  {
    key: "spotify",
    label: "Spotify",
    icon: <SpotifyOutlined />,
    prefix: "https://open.spotify.com/artist/",
    placeholder: "your-artist-id",
    description: "Your Spotify artist profile ID",
  },
  {
    key: "instagram",
    label: "Instagram",
    icon: <InstagramOutlined />,
    prefix: "https://instagram.com/",
    placeholder: "username",
    description: "Your Instagram username",
  },
  {
    key: "twitter",
    label: "Twitter (X)",
    icon: <XOutlined />,
    prefix: "https://twitter.com/",
    placeholder: "username",
    description: "Your Twitter/X username",
  },
];

/**
 * Artist profile creation form
 * Features: genre selection, social links, progress tracking
 */
const MainMenu: FC<MainMenuProps> = ({
  localChanges,
  setLocalChanges,
  onSave,
}) => {
  const [isLoading, setIsLoading] = useState(false);

  const handleGenreChange = (selectedGenres: string[]) => {
    setLocalChanges({ genres: selectedGenres });
  };

  const handleSocialLinkChange = (
    platform: keyof ArtistCreate["socialLinks"],
    value: string
  ) => {
    const platformInfo = socialPlatforms.find((p) => p.key === platform);
    if (!platformInfo) return;

    const fullUrl = value.trim()
      ? platformInfo.prefix + value.trim()
      : undefined;

    const updatedSocialLinks = {
      ...localChanges.socialLinks,
      [platform]: fullUrl,
    };

    setLocalChanges({ socialLinks: updatedSocialLinks });
  };

  const removeSocialLink = (platform: keyof ArtistCreate["socialLinks"]) => {
    const updatedSocialLinks = { ...localChanges.socialLinks };
    delete updatedSocialLinks[platform];
    setLocalChanges({ socialLinks: updatedSocialLinks });
  };

  const handleSave = async () => {
    if (!localChanges.name?.trim()) {
      message.error("Artist name is required");
      return;
    }

    if (!localChanges.genres?.length) {
      message.error("Please select at least one genre");
      return;
    }

    if (
      !localChanges.socialLinks ||
      Object.keys(localChanges.socialLinks).length === 0
    ) {
      message.error("Please add at least one social media link");
      return;
    }

    setIsLoading(true);
    try {
      await onSave(localChanges);
      message.success("Artist profile created successfully!");
    } catch (error) {
      message.error("Failed to create artist profile. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const isFormValid =
    localChanges.name?.trim() &&
    localChanges.genres?.length &&
    localChanges.socialLinks &&
    Object.keys(localChanges.socialLinks).length > 0;

  const completionPercentage = () => {
    let completed = 0;
    const total = 4;

    if (localChanges.name?.trim()) completed++;
    if (localChanges.bio?.trim()) completed++;
    if (localChanges.genres?.length) completed++;
    if (
      localChanges.socialLinks &&
      Object.keys(localChanges.socialLinks).length > 0
    )
      completed++;

    return Math.round((completed / total) * 100);
  };

  return (
    <div className="w-full space-y-4 sm:space-y-6">
      <GlassContainer>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg sm:text-xl lg:text-2xl font-bold text-white">
            Profile Completion
          </h2>
          <span className="text-green-400 font-semibold text-sm sm:text-base">
            {completionPercentage()}%
          </span>
        </div>
        <div className="w-full bg-white/10 rounded-full h-2 sm:h-3">
          <div
            className="bg-gradient-to-r from-green-500 to-emerald-500 h-full rounded-full transition-all duration-500"
            style={{ width: `${completionPercentage()}%` }}
          />
        </div>
        <p className="text-white/60 text-xs sm:text-sm mt-2">
          Complete all sections to create your artist profile
        </p>
      </GlassContainer>

      <GlassContainer>
        <div className="flex items-start gap-3 mb-4">
          <div className="w-1 sm:w-2 h-6 sm:h-8 bg-gradient-to-b from-[#1db954] to-[#1ed760] rounded-full flex-shrink-0 mt-1" />
          <div className="flex-1">
            <h2 className="text-lg sm:text-xl lg:text-2xl font-bold text-white mb-2">
              Create Your Artist Profile
            </h2>
            <p className="text-white/70 text-sm sm:text-base leading-relaxed">
              Welcome to your artist journey! Fill out the information below to
              create your professional music profile. This will help listeners
              discover your music and connect with you across different
              platforms.
            </p>
          </div>
        </div>
      </GlassContainer>

      <GlassContainer>
        <div className="flex items-start gap-3 mb-4">
          <div className="w-1 sm:w-2 h-5 sm:h-6 bg-gradient-to-b from-[#1db954] to-[#1ed760] rounded-full flex-shrink-0 mt-1" />
          <div className="flex-1">
            <h3 className="text-base sm:text-lg lg:text-xl font-semibold text-white mb-2">
              Music Genres
              {localChanges.genres?.length ? (
                <span className="ml-2 text-green-400 text-sm">✓</span>
              ) : (
                <span className="ml-2 text-red-400 text-sm">*</span>
              )}
            </h3>
            <p className="text-white/60 text-sm mb-4">
              Select the genres that best describe your music style (you can
              choose multiple)
            </p>
          </div>
        </div>

        <StyledMultiSelect
          mode="multiple"
          size="large"
          placeholder="Select your music genres..."
          value={localChanges.genres || []}
          onChange={handleGenreChange}
          options={genres.map((genre) => ({ label: genre, value: genre }))}
          className="w-full"
          maxTagCount="responsive"
          showSearch
          filterOption={(input, option) =>
            String(option?.label ?? "")
              .toLowerCase()
              .includes(input.toLowerCase())
          }
        />

        {localChanges.genres?.length > 0 && (
          <p className="text-green-400 text-xs sm:text-sm mt-2">
            Selected {localChanges.genres.length} genre
            {localChanges.genres.length !== 1 ? "s" : ""}
          </p>
        )}
      </GlassContainer>

      <GlassContainer>
        <div className="flex items-start gap-3 mb-4">
          <div className="w-1 sm:w-2 h-5 sm:h-6 bg-gradient-to-b from-[#1db954] to-[#1ed760] rounded-full flex-shrink-0 mt-1" />
          <div className="flex-1">
            <h3 className="text-base sm:text-lg lg:text-xl font-semibold text-white mb-2">
              Social Media Links
              {localChanges.socialLinks &&
              Object.keys(localChanges.socialLinks).length > 0 ? (
                <span className="ml-2 text-green-400 text-sm">✓</span>
              ) : (
                <span className="ml-2 text-red-400 text-sm">*</span>
              )}
            </h3>
            <p className="text-white/60 text-sm mb-4">
              Add your social media profiles to help fans connect with you
            </p>
          </div>
        </div>

        <div className="space-y-4 sm:space-y-5">
          {socialPlatforms.map((platform) => {
            const currentFullUrl =
              localChanges.socialLinks?.[
                platform.key as keyof ArtistCreate["socialLinks"]
              ] || "";
            const currentValue = currentFullUrl
              ? currentFullUrl.replace(platform.prefix, "")
              : "";

            return (
              <div key={platform.key} className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-base sm:text-lg">
                      {platform.icon}
                    </span>
                    <div>
                      <span className="text-white font-medium text-sm sm:text-base">
                        {platform.label}
                      </span>
                      <p className="text-white/50 text-xs">
                        {platform.description}
                      </p>
                    </div>
                  </div>

                  {currentFullUrl && (
                    <button
                      onClick={() =>
                        removeSocialLink(
                          platform.key as keyof ArtistCreate["socialLinks"]
                        )
                      }
                      className="text-red-400 hover:text-red-300 transition-colors p-1 rounded"
                      aria-label={`Remove ${platform.label} link`}
                    >
                      <DeleteOutlined className="text-sm sm:text-base" />
                    </button>
                  )}
                </div>

                <div className="flex flex-col sm:flex-row rounded-lg overflow-hidden gap-2 sm:gap-0">
                  <div className="bg-white/5 border border-white/20 px-3 py-2 text-white/70 text-xs sm:text-sm flex items-center sm:border-r-0 rounded-lg sm:rounded-r-none">
                    <span className="truncate">{platform.prefix}</span>
                  </div>
                  <div className="flex-1">
                    <StyledInput
                      placeholder={platform.placeholder}
                      value={currentValue}
                      onChange={(e) =>
                        handleSocialLinkChange(
                          platform.key as keyof ArtistCreate["socialLinks"],
                          e.target.value
                        )
                      }
                      className="rounded-lg sm:rounded-l-none sm:border-l-0"
                    />
                  </div>
                </div>

                {currentValue && (
                  <p className="text-green-400 text-xs flex items-center gap-1">
                    <span>✓</span>
                    {platform.label} link added successfully
                  </p>
                )}
              </div>
            );
          })}
        </div>

        <div className="mt-4 p-3 bg-white/5 rounded-lg border border-white/10">
          <p className="text-white/60 text-xs sm:text-sm">
            Connected platforms:{" "}
            <span className="text-white font-medium">
              {localChanges.socialLinks
                ? Object.keys(localChanges.socialLinks).length
                : 0}{" "}
              of {socialPlatforms.length}
            </span>
          </p>
        </div>
      </GlassContainer>

      <GlassContainer>
        <div className="flex items-start gap-3 mb-4">
          <div className="w-1 sm:w-2 h-5 sm:h-6 bg-gradient-to-b from-[#1db954] to-[#1ed760] rounded-full flex-shrink-0 mt-1" />
          <h3 className="text-base sm:text-lg lg:text-xl font-semibold text-white">
            Profile Summary
          </h3>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 text-white/80">
          <div className="p-3 bg-white/5 rounded-lg">
            <span className="text-white/60 text-xs sm:text-sm block mb-1">
              Artist Name:
            </span>
            <p className="text-white font-medium text-sm sm:text-base">
              {localChanges.name || "Not specified"}
            </p>
          </div>
          <div className="p-3 bg-white/5 rounded-lg">
            <span className="text-white/60 text-xs sm:text-sm block mb-1">
              Biography:
            </span>
            <p className="text-white font-medium text-sm sm:text-base">
              {localChanges.bio ? "Added" : "Not specified"}
            </p>
          </div>
          <div className="p-3 bg-white/5 rounded-lg">
            <span className="text-white/60 text-xs sm:text-sm block mb-1">
              Genres:
            </span>
            <p className="text-white font-medium text-sm sm:text-base">
              {localChanges.genres?.length
                ? `${localChanges.genres.length} selected`
                : "Not specified"}
            </p>
          </div>
          <div className="p-3 bg-white/5 rounded-lg">
            <span className="text-white/60 text-xs sm:text-sm block mb-1">
              Social Links:
            </span>
            <p className="text-white font-medium text-sm sm:text-base">
              {localChanges.socialLinks &&
              Object.keys(localChanges.socialLinks).length > 0
                ? `${Object.keys(localChanges.socialLinks).length} links added`
                : "None added"}
            </p>
          </div>
        </div>
      </GlassContainer>

      <div className="flex justify-center pt-4 sm:pt-6 pb-8">
        <SaveButton
          size="large"
          loading={isLoading}
          disabled={!isFormValid}
          onClick={handleSave}
          className="w-full sm:w-auto min-w-[200px]"
        >
          {isLoading ? "Creating Profile..." : "Create Artist Profile"}
        </SaveButton>
      </div>

      {!isFormValid && (
        <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-3 sm:p-4">
          <p className="text-yellow-300 text-xs sm:text-sm">
            <span className="font-medium">Required fields:</span> Artist name,
            at least one genre, and one social media link
          </p>
        </div>
      )}
    </div>
  );
};

export default MainMenu;
