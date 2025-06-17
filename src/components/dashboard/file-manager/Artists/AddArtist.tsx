import { motion } from "framer-motion";
import { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import type { AppState } from "../../../../store";
import { Input, message, Cascader, Select, Space } from "antd";
import { AvatarInput } from "./AvatarInput";
import type { SelectProps } from "antd";
import { SettingOutlined } from "@ant-design/icons";
import type { ArtistData } from "../../../../types/ArtistData";

const { Option } = Select;

const selectBefore = (
  <Select defaultValue="http://">
    <Option value="http://">http://</Option>
    <Option value="https://">https://</Option>
  </Select>
);
const selectAfter = (
  <Select defaultValue=".com">
    <Option value=".com">.com</Option>
    <Option value=".jp">.jp</Option>
    <Option value=".cn">.cn</Option>
    <Option value=".org">.org</Option>
  </Select>
);
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

export default function AddArtist() {
  const [width, setWidth] = useState(0);
  const isMenuOpen = useSelector(
    (state: AppState) => state.dashboardMenu.isOpen
  );
  const [inputErrors, setInputErrors] = useState<{
    name: boolean;
    bio: boolean;
    avatar: boolean;
    genres: boolean;
  }>({
    name: false,
    bio: false,
    avatar: false,
    genres: false,
  });

  const [currentArtist, setCurrentArtist] = useState<ArtistData>({
    name: "",
    bio: "",
    avatar: null,
    genres: [],
    socialLinks: null,
  });

  const [avatarImage, setAvatarImage] = useState<{
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
    setCurrentArtist((prev) => ({ ...prev, genres: value }));
    setInputErrors((prev) => ({ ...prev, genres: false }));
  };

  // Универсальный обработчик для всех типов инпутов
  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setInputErrors((prev) => ({ ...prev, [name]: false }));
    setCurrentArtist((prev) => ({ ...prev, [name]: value }));
  };

  const handleSocialLinksChange = (
    platform: "spotify" | "instagram" | "twitter",
    value: string
  ) => {
    const baseUrls = {
      spotify: "http://spotify.com/artist/",
      twitter: "http://twitter.com/",
      instagram: "http://instagram.com/",
    };

    // Создаем полный URL или пустую строку если value пустой
    const fullUrl = value ? `${baseUrls[platform]}${value}` : "";

    setCurrentArtist((prev) => ({
      ...prev,
      socialLinks: {
        ...prev.socialLinks,
        spotify: prev.socialLinks?.spotify || "",
        instagram: prev.socialLinks?.instagram || "",
        twitter: prev.socialLinks?.twitter || "",
        [platform]: fullUrl,
      },
    }));
  };

  const handleFileChange = (file: File | null) => {
    if (!file) {
      setAvatarImage(null);
      setCurrentArtist((prev) => ({ ...prev, avatar: null }));
      return;
    }
    setInputErrors((prev) => ({ ...prev, avatar: false }));
    const reader = new FileReader();
    reader.onload = (event) => {
      setAvatarImage({
        preview: event.target?.result as string,
        file: file,
      });
      setCurrentArtist((prev) => ({ ...prev, avatar: file }));
    };
    reader.readAsDataURL(file);
  };

  const removeAvatar = () => {
    setAvatarImage(null);
    setCurrentArtist((prev) => ({ ...prev, avatar: null }));
  };

  const handleSubmit = async () => {
    if (
      !currentArtist.name ||
      !currentArtist.bio ||
      !currentArtist.avatar ||
      currentArtist.genres.length === 0
    ) {
      setInputErrors((prev) => ({
        ...prev,
        name: !currentArtist.name,
        bio: !currentArtist.bio,
        avatar: !currentArtist.avatar,
        genres: currentArtist.genres.length === 0,
      }));
      console.log(inputErrors);
      return;
    }

    const formData = new FormData();
    formData.append("name", currentArtist.name);
    formData.append("bio", currentArtist.bio);
    formData.append("avatar", currentArtist.avatar);
    formData.append("genres", JSON.stringify(currentArtist.genres));
    formData.append("socialLinks", JSON.stringify(currentArtist.socialLinks));

    try {
      const response = await fetch("http://localhost:5000/api/artists", {
        method: "POST",
        body: formData,
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      });
      const data = await response.json();
      console.log(data);
      setCurrentArtist({
        name: "",
        bio: "",
        avatar: null,
        genres: [],
        socialLinks: null,
      });
      setAvatarImage(null);
    } catch (e) {
      console.log(e);
      message.error("Произошла ошибка");
      return;
    }
    console.log(currentArtist);
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
        <Input
          placeholder="Artist name"
          name="name"
          value={currentArtist.name}
          onChange={handleInputChange}
          status={!inputErrors.name ? "" : "error"}
        />
        <TextArea
          placeholder="Bio"
          name="bio"
          value={currentArtist.bio}
          rows={4}
          onChange={handleInputChange}
          status={!inputErrors.bio ? "" : "error"}
        />

        <div className="flex justify-between">
          <div className="flex flex-col gap-2">
            <span className="text-sm text-gray-500">Avatar</span>
            <AvatarInput
              preview={avatarImage?.preview || null}
              onFileChange={handleFileChange}
              onRemove={removeAvatar}
              isAdded={!inputErrors.avatar}
            />
          </div>
        </div>

        <Space style={{ width: "100%" }} direction="vertical">
          <Select
            mode="multiple"
            allowClear
            style={{ width: "100%" }}
            placeholder="Please select"
            onChange={handleChange}
            options={options}
            status={!inputErrors.bio ? "" : "error"}
            value={currentArtist.genres}
            maxCount={5}
          />
        </Space>

        <div className="flex flex-col gap-3">
          <span className="text-sm text-gray-500">Social links (optional)</span>
          <Space direction="vertical">
            <Input
              addonBefore="http://spotify.com/artist/"
              placeholder="id"
              value={
                currentArtist.socialLinks?.spotify?.replace(
                  "http://spotify.com/artist/",
                  ""
                ) || ""
              }
              onChange={(e) =>
                handleSocialLinksChange("spotify", e.target.value)
              }
            />
            <Input
              addonBefore="http://twitter.com/"
              placeholder="id"
              value={
                currentArtist.socialLinks?.twitter?.replace(
                  "http://twitter.com/",
                  ""
                ) || ""
              }
              onChange={(e) =>
                handleSocialLinksChange("twitter", e.target.value)
              }
            />
            <Input
              addonBefore="http://instagram.com/"
              placeholder="id"
              value={
                currentArtist.socialLinks?.instagram?.replace(
                  "http://instagram.com/",
                  ""
                ) || ""
              }
              onChange={(e) =>
                handleSocialLinksChange("instagram", e.target.value)
              }
            />
          </Space>
        </div>

        <div className="flex gap-2">
          <button
            className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors"
            onClick={handleSubmit}
          >
            Save
          </button>
        </div>
      </div>
    </motion.div>
  );
}
