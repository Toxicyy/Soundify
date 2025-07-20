import { useState } from "react";
import { ChevronDown } from "lucide-react";
import { useDispatch } from "react-redux";
import type { AppDispatch } from "../../../../store";
import { setIsGenreSelectOpen } from "../../../../state/isGenreSelectOpen.slice";

interface GenreSelectProps {
  value: string | null;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
}

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

export default function GenreSelect({
  value,
  onChange,
  placeholder = "Select genre",
  className = "",
}: GenreSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
 const dispatch = useDispatch<AppDispatch>();
  const filteredGenres = genres.filter((genre) =>
    genre.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleSelect = (genre: string) => {
    onChange(genre);
    setIsOpen(false);
    setSearchTerm("");
    dispatch(setIsGenreSelectOpen(false))
  };

  return (
    <div className={`relative ${className}`}>
      <div
        className="flex items-center justify-between px-4 py-2.5 bg-white border border-gray-300 rounded-lg cursor-pointer hover:border-gray-400 transition-colors z-50"
        onClick={() => {
          dispatch(setIsGenreSelectOpen(!isOpen))
          setIsOpen(!isOpen)
        }
      }
      >
        <span className={value ? "text-gray-900" : "text-gray-500"}>
          {value || placeholder}
        </span>
        <ChevronDown
          className={`w-4 h-4 text-gray-500 transition-transform ${
            isOpen ? "rotate-180" : ""
          }`}
        />
      </div>

      {isOpen && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-10"
            onClick={() => setIsOpen(false)}
          />

          {/* Dropdown */}
          <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-20 max-h-64 overflow-hidden">
            {/* Search input */}
            <div className="p-2 border-b border-gray-100">
              <input
                type="text"
                placeholder="Search genre..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full px-3 py-1.5 text-sm border border-gray-200 rounded-md focus:outline-none focus:border-blue-400"
                onClick={(e) => e.stopPropagation()}
              />
            </div>

            {/* Genre list */}
            <div className="overflow-y-auto max-h-48">
              {filteredGenres.length > 0 ? (
                filteredGenres.map((genre) => (
                  <div
                    key={genre}
                    className={`px-4 py-2.5 cursor-pointer transition-colors ${
                      value === genre
                        ? "bg-blue-50 text-blue-600"
                        : "hover:bg-gray-50"
                    }`}
                    onClick={() => handleSelect(genre)}
                  >
                    {genre}
                  </div>
                ))
              ) : (
                <div className="px-4 py-3 text-gray-500 text-center">
                  No genres found
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
