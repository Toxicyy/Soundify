import { useState } from "react";
import Header from "../components/BecomeAnArtist/Header";
import MainMenu from "../components/BecomeAnArtist/MainMenu";
import Anonym from "../images/User/Anonym.jpg";
import { api } from "../shared/api";
import { useNavigate } from "react-router-dom";
import { useNotification } from "../hooks/useNotification";

export type ArtistCreate = {
  name: string;
  bio: string;
  imageSrc: string;
  imageFile?: File;
  genres: string[];
  socialLinks: {
    spotify?: string;
    instagram?: string;
    twitter?: string;
  };
};

const DEFAULT_ARTIST: ArtistCreate = {
  name: "",
  bio: "",
  imageSrc: Anonym,
  genres: [],
  socialLinks: {},
};

export default function BecomeAnArtist() {
  const [artist, setArtist] = useState<ArtistCreate>(DEFAULT_ARTIST);
  const navigate = useNavigate();
  const { showSuccess, showError } = useNotification();

  const handleSaveArtist = async (artistData: ArtistCreate) => {
    try {
        const response = await api.artist.becomeAnArtist(artistData);
        const data = await response.json();

        // Для демонстрации используем console.log
        console.log("Saving artist data:", artistData);
        if (!data.success) {
          showError("Failed to create artist profile. Please try again.");
        } else {
          navigate("/");
          showSuccess("Artist profile created successfully!");
        }
    } catch (error) {
      console.error("Failed to save artist:", error);
      showError("Failed to create artist profile. Please try again.");
      throw error; // Перебрасываем ошибку для обработки в MainMenu
    }
  };

  return (
    <div className="w-full mainMenu pl-[22vw] pr-[2vw] flex flex-col gap-5">
      <Header
        imageSrc={artist.imageSrc || Anonym}
        localChanges={artist}
        setLocalChanges={(changes) =>
          setArtist((prev) => ({ ...prev, ...changes }))
        }
      />
      <div className="flex-1 overflow-y-auto pb-8">
        <MainMenu
          localChanges={artist}
          setLocalChanges={(changes) =>
            setArtist((prev) => ({ ...prev, ...changes }))
          }
          onSave={handleSaveArtist}
        />
      </div>
    </div>
  );
}
