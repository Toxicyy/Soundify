import { useState, useMemo, type FC, useEffect } from "react";
import type { Album } from "../../../../types/AlbumData";
import { Select, Spin, Typography } from "antd";

type SelectAlbumProps = {
  onSelect: (album: Album) => void;
  artist: { _id: string, name: string };
  placeholder?: string;
  status?: "" | "error" | "warning";
  disabled?: boolean;
};

const SelectAlbum: FC<SelectAlbumProps> = ({
  onSelect,
  artist,
  placeholder = "Select album...",
  status,
  disabled = false,
}) => {
  const [albums, setAlbums] = useState<Album[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchValue, setSearchValue] = useState("");
  const [selectedAlbum, setSelectedAlbum] = useState<Album | null>(null);

  // Load albums from specific artist
  const loadArtistAlbums = async (artistId: string) => {
    if (!artistId) return;

    setLoading(true);
    try {
      const response = await fetch(
        `http://localhost:5000/api/artists/${artistId}/albums`
      );
      const data = await response.json();

      if (response.ok && data.success) {
        setAlbums(data.data);
      }
    } catch (error) {
      console.error("Error loading artist albums:", error);
      setAlbums([]);
    } finally {
      setLoading(false);
    }
  };

  // Load albums when artist changes
  useEffect(() => {
    if (artist) {
      loadArtistAlbums(artist._id);
      setSelectedAlbum(null);
      setSearchValue("");
    } else {
      setAlbums([]);
      setSelectedAlbum(null);
      setSearchValue("");
    }
  }, [artist]);

  // Filter albums based on search query
  const filteredAlbums = useMemo(() => {
    if (!searchValue.trim()) {
      // Show first 3 albums when no search
      return albums.slice(0, 3);
    }

    // Filter albums by search query
    const filtered = albums.filter((album) =>
      album.name.toLowerCase().includes(searchValue.toLowerCase())
    );

    return filtered;
  }, [albums, searchValue]);

  const handleSearch = (value: string) => {
    setSearchValue(value);
  };

  const handleSelect = (_: string, option: any) => {
    const album = option.album;
    setSelectedAlbum(album);
    setSearchValue("");
    onSelect(album);
  };

  const handleClear = () => {
    setSelectedAlbum(null);
    setSearchValue("");
  };

  const selectOptions = useMemo(
    () =>
      filteredAlbums.map((album: Album) => ({
        value: album._id,
        label: (
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            {/* Album cover */}
            {album.coverUrl ? (
              <img
                src={album.coverUrl}
                alt={album.name}
                style={{
                  width: 40,
                  height: 40,
                  borderRadius: 4,
                  objectFit: "cover",
                }}
                onError={(e) => {
                  e.currentTarget.style.display = "none";
                }}
              />
            ) : (
              <div
                style={{
                  width: 40,
                  height: 40,
                  borderRadius: 4,
                  backgroundColor: "#f0f0f0",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: 14,
                  fontWeight: "bold",
                  color: "#666",
                }}
              >
                {album.name?.charAt(0)?.toUpperCase()}
              </div>
            )}

            <div style={{ flex: 1, minWidth: 0 }}>
              {/* Album name */}
              <Typography.Text strong style={{ display: "block" }}>
                {album.name}
              </Typography.Text>

              {/* Album details */}
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <Typography.Text type="secondary" style={{ fontSize: 12 }}>
                  {artist.name || "Unknown Artist"}
                </Typography.Text>

                {album.type && (
                  <>
                    <span style={{ color: "#d9d9d9", fontSize: 10 }}>•</span>
                    <Typography.Text type="secondary" style={{ fontSize: 12 }}>
                      {album.type.toUpperCase()}
                    </Typography.Text>
                  </>
                )}

                {album.releaseDate && (
                  <>
                    <span style={{ color: "#d9d9d9", fontSize: 10 }}>•</span>
                    <Typography.Text type="secondary" style={{ fontSize: 12 }}>
                      {new Date(album.releaseDate).getFullYear()}
                    </Typography.Text>
                  </>
                )}
              </div>
            </div>
          </div>
        ),
        album: album, // Передаем данные альбома в опцию
      })),
    [filteredAlbums]
  );

  const notFoundContent = useMemo(() => {
    if (loading) {
      return (
        <div
          style={{
            textAlign: "center",
            padding: "12px 0",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 8,
          }}
        >
          <Spin size="small" />
          <span>Loading albums...</span>
        </div>
      );
    }

    if (disabled || !artist) {
      return "Select an artist first";
    }

    if (searchValue && filteredAlbums.length === 0) {
      return "No albums found";
    }

    if (albums.length === 0) {
      return "This artist has no albums yet";
    }

    return null;
  }, [
    loading,
    searchValue,
    filteredAlbums.length,
    disabled,
    artist,
    albums.length,
  ]);

  return (
    <Select
      status={status}
      disabled={disabled || !artist}
      showSearch
      placeholder={placeholder}
      filterOption={false}
      onSearch={handleSearch}
      onSelect={handleSelect}
      onClear={handleClear}
      value={selectedAlbum ? selectedAlbum.name : undefined}
      options={selectOptions}
      notFoundContent={notFoundContent}
      style={{ width: "100%" }}
      allowClear
      searchValue={searchValue}
      suffixIcon={loading ? <Spin size="small" /> : undefined}
    />
  );
};

export default SelectAlbum;
