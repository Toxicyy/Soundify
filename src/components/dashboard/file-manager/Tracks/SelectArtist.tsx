import { useState, useMemo, type FC} from "react";
import { debounce } from "lodash";
import type { Artist } from "../../../../types/ArtistData";
import { Select, Spin, Typography } from "antd";

type selectArtistProps = {
  onSelect: (artist: Artist) => void;
  placeholder?: string;
  status?: "" | "error" | "warning";
};

const SelectArtist: FC<selectArtistProps> = ({
  onSelect,
  placeholder = "Выберите артиста...",
  status
}) => {
  const [artists, setArtists] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchValue, setSearchValue] = useState("");
  const [selectedArtist, setSelectedArtist] = useState<Artist | null>(null);
  const [alreadyPopular, setAlreadyPopular] = useState(false);

  const searchArtists = async (query: string) => {
    if (!query?.trim()) {
      setArtists([]);
      return;
    }

    setLoading(true);
    try {
      const params = new URLSearchParams({
        query: query.trim(),
        limit: "20",
      });

      const response = await fetch(
        `http://localhost:5000/api/artists/search?${params}`
      );
      const data = await response.json();

      if (response.ok) {
        const options = data.data.artists.map((artist: Artist) => ({
          value: artist._id,
          label: artist.name,
          artist: artist,
        }));
        if (searchValue === "") {
          setArtists(options);
        }
      }
    } catch (error) {
      console.error("Ошибка поиска артистов:", error);
      setArtists([]);
    } finally {
      setLoading(false);
    }
  };

  const debouncedSearch = useMemo(() => debounce(searchArtists, 100), []);

  const loadPopularArtists = async () => {
    setLoading(true);
    try {
      const response = await fetch(
        "http://localhost:5000/api/artists/popular?limit=10"
      );
      const data = await response.json();

      const options = data.data.artists.map((artist: Artist) => ({
        value: artist._id,
        label: artist.name,
        artist: artist,
      }));
      setArtists(options);
    } catch (error) {
      console.error("Ошибка загрузки артистов:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (value: string) => {
    const sanitizedValue = value.replace(/[^a-zA-Zа-яА-ЯёЁ0-9\s\-]/g, "");
    setSearchValue(sanitizedValue);
    if (sanitizedValue.length == 1) {
      searchArtists(sanitizedValue);
      setAlreadyPopular(false);
    } else if (sanitizedValue.trim() !== "") {
      debouncedSearch(sanitizedValue);
      setAlreadyPopular(false);
    } else if (!alreadyPopular) {
      loadPopularArtists();
      setAlreadyPopular(true);
    }
  };

  const handleFocus = () => {
    if (artists.length === 0) {
      loadPopularArtists();
    }
  };

  const handleSelect = (value: string, option: any) => {
    const artist = option.artist;
    setSelectedArtist(artist);
    setSearchValue("");
    onSelect?.(artist);
  };

  const handleClear = () => {
    setSelectedArtist(null);
    setSearchValue("");
    setArtists([]);
  };

  const selectOptions = useMemo(
    () =>
      artists.map((option: { value: string; artist: Artist }) => ({
        value: option.value,
        label: (
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            {option.artist.avatar ? (
              <img
                src={option.artist.avatar}
                alt={option.artist.name}
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: "50%",
                  objectFit: "cover",
                }}
                onError={(e) => {
                  e.currentTarget.style.display = "none";
                }}
              />
            ) : (
              <div
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: "50%",
                  backgroundColor: "#f0f0f0",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                {option.artist.name?.charAt(0)?.toUpperCase()}
              </div>
            )}
            <div>
              <Typography.Text strong>{option.artist.name}</Typography.Text>
              {option.artist.isVerified && (
                <span style={{ color: "#1890ff", marginLeft: 4 }}>✓</span>
              )}
              <div>
                <Typography.Text type="secondary" style={{ fontSize: 12 }}>
                  {option.artist.followerCount?.toLocaleString()} подписчиков
                </Typography.Text>
              </div>
            </div>
          </div>
        ),
        artist: option.artist,
      })),
    [artists]
  );

  // Улучшенный notFoundContent с индикатором загрузки
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
          <span>Поиск артистов...</span>
        </div>
      );
    }

    if (searchValue && artists.length === 0) {
      return "Артисты не найдены";
    }

    if (!searchValue && artists.length === 0) {
      return "Начните вводить имя артиста";
    }

    return null;
  }, [loading, searchValue, artists.length]);

  return (
    <Select
      status={status}
      showSearch
      placeholder={placeholder}
      filterOption={false}
      onSearch={handleSearch}
      onFocus={handleFocus}
      onSelect={handleSelect}
      onClear={handleClear}
      value={selectedArtist ? selectedArtist.name : undefined}
      options={selectOptions}
      notFoundContent={notFoundContent}
      style={{ width: "100%" }}
      allowClear
      searchValue={searchValue}
      // Добавляем индикатор загрузки в суффикс
      suffixIcon={loading ? <Spin size="small" /> : undefined}
    />
  );
};

export default SelectArtist;
