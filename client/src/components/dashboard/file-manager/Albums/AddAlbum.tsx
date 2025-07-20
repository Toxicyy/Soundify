import { motion } from "framer-motion";
import { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import type { AppState } from "../../../../store";
import { Input, message, Select, Space } from "antd";
import type { SelectProps } from "antd";
import type { AlbumData } from "../../../../types/AlbumData";
import type { Artist } from "../../../../types/ArtistData";
import { CoverInput } from "../Tracks/CoverInput";
import SelectArtist from "../Tracks/SelectArtist";
import SelectAlbum from "../Tracks/SelectAlbum";

const options: SelectProps["options"] = [
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
].map((genre) => ({ value: genre, label: genre }));

const { TextArea } = Input;

export default function AddAlbum() {
  const [width, setWidth] = useState(0);
  const isMenuOpen = useSelector(
    (state: AppState) => state.dashboardMenu.isOpen
  );
  const [artistResetKey, setArtistResetKey] = useState(0);
  const [inputErrors, setInputErrors] = useState<{
    name: boolean;
    cover: boolean;
    genre: boolean;
    artist: boolean;
  }>({
    name: false,
    cover: false,
    genre: false,
    artist: false,
  });

  const [currentAlbum, setCurrentAlbum] = useState<AlbumData>({
    name: "",
    artist: {} as Artist,
    description: "",
    cover: null,
    genre: [],
  });

  const [coverImage, setCoverImage] = useState<{
    preview: string;
    file: File | null;
  } | null>(null);

  useEffect(() => {
    const updateWidth = () => setWidth(pageWidth());
    updateWidth();
    window.addEventListener("resize", updateWidth);
    return () => window.removeEventListener("resize", updateWidth);
  }, [isMenuOpen]);

  function pageWidth() {
    return (
      (document.documentElement.clientWidth - (isMenuOpen ? 230 : 70)) * 0.47
    );
  }

  const handleChange = (value: string[]) => {
    setCurrentAlbum((prev) => ({ ...prev, genre: value }));
    setInputErrors((prev) => ({ ...prev, genre: false }));
  };

  const handleArtistSelect = (artist: Artist) => {
    setCurrentAlbum((prev) => ({ ...prev, artist: artist }));
    setInputErrors((prev) => ({ ...prev, artist: false }));
  };

  // Универсальный обработчик для всех типов инпутов
  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setInputErrors((prev) => ({ ...prev, [name]: false }));
    setCurrentAlbum((prev) => ({ ...prev, [name]: value }));
  };

  const handleFileChange = (file: File | null) => {
    if (!file) {
      setCoverImage(null);
      setCurrentAlbum((prev) => ({ ...prev, cover: null }));
      return;
    }
    setInputErrors((prev) => ({ ...prev, cover: false }));
    const reader = new FileReader();
    reader.onload = (event) => {
      setCoverImage({
        preview: event.target?.result as string,
        file: file,
      });
      setCurrentAlbum((prev) => ({ ...prev, cover: file }));
    };
    reader.readAsDataURL(file);
  };

  const removeCover = () => {
    setCoverImage(null);
    setCurrentAlbum((prev) => ({ ...prev, cover: null }));
  };

  const handleSubmit = async () => {
    console.log(currentAlbum);
    console.log(inputErrors);
    if (!currentAlbum.name || !currentAlbum.cover || !currentAlbum.genre) {
      setInputErrors((prev) => ({
        ...prev,
        name: !currentAlbum.name,
        avatar: !currentAlbum.cover,
        genres: !currentAlbum.genre,
      }));
      return;
    }

    const formData = new FormData();
    formData.append("name", currentAlbum.name);
    formData.append("artist", currentAlbum.artist._id);
    formData.append("description", currentAlbum.description);
    formData.append("cover", currentAlbum.cover);
    formData.append("genre", JSON.stringify(currentAlbum.genre));

    try {
      const response = await fetch("http://localhost:5000/api/albums", {
        method: "POST",
        body: formData,
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      });

      if (!response.ok) {
        throw new Error("Failed to add artist");
      }
      setCurrentAlbum({
        name: "",
        artist: {} as Artist,
        description: "",
        cover: null,
        genre: [],
      });
      setCoverImage(null);
      setArtistResetKey((prev) => prev + 1);
    } catch (e) {
      message.error("Произошла ошибка");
      return;
    }
    message.success("Трек добавлен в базу данных");
  };

  return (
    <motion.div
      className="drop-shadow-2xl h-full bg-white rounded-3xl flex min-w-[460px]"
      style={{ width: `${width}px` }}
      initial={{ opacity: 0, y: 300, width: 0 }}
      animate={{
        opacity: 1,
        y: 0,
        width: width,
      }}
      transition={{
        duration: 0.5,
        ease: "easeOut",
        width: { duration: 0.3 },
        opacity: { delay: 0.2 },
      }}
    >
      <div className="py-5 px-5 flex flex-col gap-5 w-full">
        <SelectArtist
          onSelect={handleArtistSelect}
          placeholder="Find and choose artist..."
          status={!inputErrors.artist ? "" : "error"}
          key={artistResetKey}
        />
        <Input
          placeholder="Album title"
          name="name"
          value={currentAlbum.name}
          onChange={handleInputChange}
          status={!inputErrors.name ? "" : "error"}
        />
        <TextArea
          placeholder="Description"
          name="description"
          value={currentAlbum.description}
          rows={4}
          onChange={handleInputChange}
        />

        <div className="flex justify-between">
          <div className="flex flex-col gap-2">
            <span className="text-sm text-gray-500">Cover</span>
            <CoverInput
              preview={coverImage?.preview || null}
              onFileChange={handleFileChange}
              onRemove={removeCover}
              isAdded={!inputErrors.cover}
            />
          </div>
        </div>

        <div>
          <h1 className="text-sm text-gray-500">Genre</h1>
          <Space style={{ width: "100%" }} direction="vertical">
            <Select
              mode="multiple"
              value={currentAlbum.genre}
              allowClear
              style={{ width: "100%" }}
              placeholder="Please select"
              onChange={handleChange}
              options={options}
              status={!inputErrors.genre ? "" : "error"}
              maxCount={5}
            />
          </Space>
        </div>

        <div className="flex flex-col gap-2">
          <h1 className="text-sm text-gray-400">
            After creation, the album will be empty and won't be visible on the
            artist's page. <br /> You can add tracks to the album on the 'Create
            Track' page.
          </h1>
          <button
            className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors cursor-pointer"
            onClick={handleSubmit}
          >
            Save
          </button>
        </div>
      </div>
    </motion.div>
  );
}
