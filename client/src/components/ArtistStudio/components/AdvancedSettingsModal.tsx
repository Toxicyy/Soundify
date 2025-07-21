import { useState } from "react";
import { Modal, Input, Select } from "antd";
import {
  CloseOutlined,
  DeleteOutlined,
  SpotifyOutlined,
  InstagramOutlined,
  TwitterOutlined,
} from "@ant-design/icons";
import styled from "styled-components";
import { useNotification } from "../../../hooks/useNotification";

interface Artist {
  _id: string;
  name: string;
  avatar?: string;
  bio?: string;
  followerCount: number;
  isVerified: boolean;
  createdAt: string;
  genres: string[];
  socialLinks: {
    spotify?: string;
    instagram?: string;
    twitter?: string;
  };
}

interface AdvancedSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  artist: Artist;
  onSave?: (updatedArtist: Partial<Artist>) => void;
}

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

const StyledSelect = styled(Select<string[]>)`
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

  &.ant-select-focused .ant-select-selector {
    border-color: #1db954 !important;
    box-shadow: 0 0 0 2px rgba(29, 185, 84, 0.2) !important;
    background-color: rgba(255, 255, 255, 0.15) !important;
  }

  &:hover .ant-select-selector {
    background-color: rgba(255, 255, 255, 0.12) !important;
    border-color: rgba(255, 255, 255, 0.3) !important;
  }
`;

const genres = [
  "Pop",
  "Rock",
  "Hip Hop",
  "R&B",
  "Jazz",
  "Classical",
  "Electronic",
  "Dance",
  "Country",
  "Alternative",
  "Indie",
  "Metal",
  "Folk",
  "Blues",
  "Reggae",
  "Punk",
  "Soul",
  "Funk",
  "Disco",
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

const AdvancedSettingsModal: React.FC<AdvancedSettingsModalProps> = ({
  isOpen,
  onClose,
  artist,
  onSave,
}) => {
  const { showSuccess, showError } = useNotification();

  const [tempGenres, setTempGenres] = useState<string[]>(artist.genres || []);
  const [tempSocialLinks, setTempSocialLinks] = useState(
    artist.socialLinks || {}
  );
  const [isLoading, setIsLoading] = useState(false);

  const handleSocialLinkChange = (
    platform: keyof Artist["socialLinks"],
    value: string
  ) => {
    const platformInfo = socialPlatforms.find((p) => p.key === platform);
    if (!platformInfo) return;

    const fullUrl = value.trim()
      ? platformInfo.prefix + value.trim()
      : undefined;

    setTempSocialLinks((prev) => ({
      ...prev,
      [platform]: fullUrl,
    }));
  };

  const removeSocialLink = (platform: keyof Artist["socialLinks"]) => {
    setTempSocialLinks((prev) => {
      const updated = { ...prev };
      delete updated[platform];
      return updated;
    });
  };

  const handleSave = async () => {
    try {
      setIsLoading(true);

      const updatedData = {
        genres: tempGenres,
        socialLinks: tempSocialLinks,
      };

      const response = await fetch(
        `http://localhost:5000/api/artists/${artist._id}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
          body: JSON.stringify(updatedData),
        }
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || "Failed to update settings");
      }

      const data = await response.json();

      if (data.success) {
        showSuccess("Advanced settings updated successfully!");
        onSave?.(updatedData);
        handleClose();
      } else {
        throw new Error(data.message || "Failed to update settings");
      }
    } catch (error) {
      console.error("Save failed:", error);
      const errorMessage =
        error instanceof Error ? error.message : "Failed to update settings";
      showError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    if (!isLoading) {
      resetModal();
      onClose();
    }
  };

  const resetModal = () => {
    setTempGenres(artist.genres || []);
    setTempSocialLinks(artist.socialLinks || {});
  };

  const hasChanges =
    JSON.stringify(tempGenres) !== JSON.stringify(artist.genres) ||
    JSON.stringify(tempSocialLinks) !== JSON.stringify(artist.socialLinks);

  return (
    <Modal
      open={isOpen}
      onCancel={handleClose}
      closable={false}
      width={650}
      styles={{
        content: {
          backgroundColor: "rgba(40, 40, 40, 0.95)",
          backdropFilter: "blur(15px)",
          border: "1px solid rgba(255, 255, 255, 0.1)",
          borderRadius: "16px",
        },
        header: { display: "none" },
      }}
      footer={null}
      maskClosable={!isLoading}
    >
      <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div className="text-white text-2xl font-semibold tracking-wider">
            Advanced Settings
          </div>
          <CloseOutlined
            className="text-2xl cursor-pointer hover:text-white/70 transition-colors"
            style={{ color: "white" }}
            onClick={handleClose}
          />
        </div>

        {/* Genres Section */}
        <div className="space-y-4">
          <div>
            <label className="block text-white/80 text-lg font-semibold mb-3">
              🎵 Music Genres
            </label>
            <p className="text-white/60 text-sm mb-4">
              Select the genres that best describe your music style
            </p>
            <StyledSelect
              mode="multiple"
              placeholder="Select your music genres..."
              value={tempGenres}
              onChange={setTempGenres}
              options={genres.map((genre) => ({ label: genre, value: genre }))}
              className="w-full"
              disabled={isLoading}
              maxTagCount="responsive"
              showSearch
              filterOption={(input, option) =>
                String(option?.label ?? "")
                  .toLowerCase()
                  .includes(input.toLowerCase())
              }
            />
            <span className="text-xs text-white/50 mt-2 block">
              Selected: {tempGenres.length} genres
            </span>
          </div>
        </div>

        {/* Social Links Section */}
        <div className="space-y-4">
          <div>
            <label className="block text-white/80 text-lg font-semibold mb-3">
              🔗 Social Media Links
            </label>
            <p className="text-white/60 text-sm mb-4">
              Add your social media profiles to help fans connect with you
            </p>

            <div className="space-y-4">
              {socialPlatforms.map((platform) => {
                const currentFullUrl =
                  tempSocialLinks[
                    platform.key as keyof Artist["socialLinks"]
                  ] || "";
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
                              platform.key as keyof Artist["socialLinks"]
                            )
                          }
                        />
                      )}
                    </div>

                    <Input.Group compact>
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
                            platform.key as keyof Artist["socialLinks"],
                            e.target.value
                          )
                        }
                        disabled={isLoading}
                      />
                    </Input.Group>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Current Settings Summary */}
        <div className="bg-white/5 rounded-lg p-4 border border-white/10">
          <h4 className="text-white font-semibold mb-3">Current Settings</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-white/60">Genres:</span>
              <p className="text-white font-medium">
                {tempGenres.length ? tempGenres.join(", ") : "Not specified"}
              </p>
            </div>
            <div>
              <span className="text-white/60">Social Links:</span>
              <p className="text-white font-medium">
                {Object.keys(tempSocialLinks).length
                  ? `${Object.keys(tempSocialLinks).length} links added`
                  : "None added"}
              </p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-3 pt-4">
          <button
            onClick={handleClose}
            disabled={isLoading}
            className="px-6 py-2 rounded-lg bg-white/10 text-white border border-white/20 hover:bg-white/20 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={!hasChanges || isLoading}
            className="px-8 py-2 rounded-lg bg-gradient-to-r from-green-500 to-emerald-500 text-white font-semibold hover:from-green-600 hover:to-emerald-600 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:from-green-500 disabled:hover:to-emerald-500"
          >
            {isLoading ? "Saving..." : "Save Settings"}
          </button>
        </div>
      </div>
    </Modal>
  );
};

export default AdvancedSettingsModal;
