import { useState, type FC } from "react";
import { Input, Select, Button, message, Space } from "antd";
import {
  DeleteOutlined,
  InstagramOutlined,
  TwitterOutlined,
  SpotifyOutlined,
} from "@ant-design/icons";
import styled from "styled-components";
import type { ArtistCreate } from "../../Pages/BecomeAnArtist";

interface MainMenuProps {
  localChanges: ArtistCreate;
  setLocalChanges: (changes: Partial<ArtistCreate>) => void;
  onSave: (artistData: ArtistCreate) => Promise<void>;
}

const GlassContainer = styled.div`
  background: rgba(255, 255, 255, 0.15);
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 16px;
  padding: 24px;
  margin-bottom: 20px;
`;

const StyledInput = styled(Input)`
  &.ant-input {
    background-color: rgba(255, 255, 255, 0.1) !important;
    color: white !important;
    border: 1px solid rgba(255, 255, 255, 0.2) !important;
    border-radius: 8px;

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

const StyledSelect = styled(Select<string>)`
  .ant-select-selector {
    background-color: rgba(255, 255, 255, 0.1) !important;
    color: white !important;
    border: 1px solid rgba(255, 255, 255, 0.2) !important;
    border-radius: 8px !important;
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
  }
`;

const StyledMultiSelect = styled(Select<string[]>)`
  .ant-select-selector {
    background-color: rgba(255, 255, 255, 0.1) !important;
    color: white !important;
    border: 1px solid rgba(255, 255, 255, 0.2) !important;
    border-radius: 8px !important;
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
    font-size: 16px !important;
    height: 48px !important;
    border-radius: 24px !important;
    padding: 0 32px !important;
    box-shadow: 0 4px 16px rgba(29, 185, 84, 0.3) !important;
    transition: all 0.3s ease !important;

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
];

const socialPlatforms = [
  {
    key: "spotify",
    label: "Spotify",
    icon: <SpotifyOutlined />,
    prefix: "https://open.spotify.com/artist/",
    placeholder: "your-artist-id",
  },
  {
    key: "instagram",
    label: "Instagram",
    icon: <InstagramOutlined />,
    prefix: "https://instagram.com/",
    placeholder: "username",
  },
  {
    key: "twitter",
    label: "Twitter",
    icon: <TwitterOutlined />,
    prefix: "https://twitter.com/",
    placeholder: "username",
  },
];

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
      [platform]: fullUrl, // Store full URL or remove field if empty
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
      console.error("Failed to create artist profile:", error);
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

  return (
    <div className="w-full space-y-6">
      {/* Information Section */}
      <GlassContainer>
        <div className="flex items-center gap-3 mb-4">
          <div className="w-2 h-8 bg-gradient-to-b from-[#1db954] to-[#1ed760] rounded-full"></div>
          <h2 className="text-2xl font-bold text-white">
            Complete Your Artist Profile
          </h2>
        </div>
        <p className="text-white/70 leading-relaxed">
          Welcome to your artist journey! Fill out the information below to
          create your professional music profile. This will help listeners
          discover your music and connect with you across different platforms.
          Make sure to add your genres to help fans find your style of music.
        </p>
      </GlassContainer>

      {/* Genres Section */}
      <GlassContainer>
        <div className="flex items-center gap-3 mb-4">
          <div className="w-2 h-6 bg-gradient-to-b from-[#1db954] to-[#1ed760] rounded-full"></div>
          <h3 className="text-xl font-semibold text-white">Music Genres</h3>
        </div>
        <p className="text-white/60 mb-4">
          Select the genres that best describe your music style (you can choose
          multiple)
        </p>

        <StyledMultiSelect
          mode="multiple"
          size="large"
          placeholder="Select your music genres..."
          value={localChanges.genres || []}
          onChange={handleGenreChange}
          options={genres.map((genre) => ({ label: genre, value: genre }))}
          className="w-full"
          maxTagCount="responsive"
        />
      </GlassContainer>

      {/* Social Links Section */}
      <GlassContainer>
        <div className="flex items-center gap-3 mb-4">
          <div className="w-2 h-6 bg-gradient-to-b from-[#1db954] to-[#1ed760] rounded-full"></div>
          <h3 className="text-xl font-semibold text-white">
            Social Media Links
          </h3>
        </div>
        <p className="text-white/60 mb-4">
          Add your social media profiles to help fans connect with you
        </p>

        <div className="space-y-4">
          {socialPlatforms.map((platform) => {
            const currentFullUrl =
              localChanges.socialLinks?.[
                platform.key as keyof ArtistCreate["socialLinks"]
              ] || "";
            // Extract just the ID/username part from the full URL for display in input
            const currentValue = currentFullUrl
              ? currentFullUrl.replace(platform.prefix, "")
              : "";

            return (
              <div key={platform.key} className="space-y-2">
                <div className="flex items-center gap-2">
                  {platform.icon}
                  <span className="text-white font-medium">
                    {platform.label}
                  </span>
                  {currentFullUrl && (
                    <DeleteOutlined
                      className="text-red-400 cursor-pointer hover:text-red-300 transition-colors ml-auto"
                      onClick={() =>
                        removeSocialLink(
                          platform.key as keyof ArtistCreate["socialLinks"]
                        )
                      }
                    />
                  )}
                </div>

                <Space.Compact>
                  <Input
                    style={{
                      width: "60%",
                      backgroundColor: "rgba(255, 255, 255, 0.05)",
                      color: "rgba(255, 255, 255, 0.7)",
                      border: "1px solid rgba(255, 255, 255, 0.2)",
                      borderRadius: "6px 0 0 6px",
                    }}
                    value={platform.prefix}
                    readOnly
                  />
                  <StyledInput
                    style={{
                      width: "40%",
                      borderRadius: "0 6px 6px 0",
                      borderLeft: "none",
                    }}
                    placeholder={platform.placeholder}
                    value={currentValue}
                    onChange={(e) =>
                      handleSocialLinkChange(
                        platform.key as keyof ArtistCreate["socialLinks"],
                        e.target.value
                      )
                    }
                  />
                </Space.Compact>
              </div>
            );
          })}
        </div>
      </GlassContainer>

      {/* Profile Summary */}
      <GlassContainer>
        <div className="flex items-center gap-3 mb-4">
          <div className="w-2 h-6 bg-gradient-to-b from-[#1db954] to-[#1ed760] rounded-full"></div>
          <h3 className="text-xl font-semibold text-white">Profile Summary</h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-white/80">
          <div>
            <span className="text-white/60">Artist Name:</span>
            <p className="text-white font-medium">
              {localChanges.name || "Not specified"}
            </p>
          </div>
          <div>
            <span className="text-white/60">Biography:</span>
            <p className="text-white font-medium">
              {localChanges.bio || "Not specified"}
            </p>
          </div>
          <div>
            <span className="text-white/60">Genres:</span>
            <p className="text-white font-medium">
              {localChanges.genres?.length
                ? localChanges.genres.join(", ")
                : "Not specified"}
            </p>
          </div>
          <div>
            <span className="text-white/60">Social Links:</span>
            <p className="text-white font-medium">
              {localChanges.socialLinks &&
              Object.keys(localChanges.socialLinks).length > 0
                ? `${Object.keys(localChanges.socialLinks).length} links added`
                : "None added"}
            </p>
          </div>
        </div>
      </GlassContainer>

      {/* Save Button */}
      <div className="flex justify-center pt-6">
        <SaveButton
          size="large"
          loading={isLoading}
          disabled={!isFormValid}
          onClick={handleSave}
        >
          {isLoading ? "Creating Profile..." : "Create Artist Profile"}
        </SaveButton>
      </div>
    </div>
  );
};

export default MainMenu;
