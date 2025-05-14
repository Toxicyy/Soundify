import SearchInput from "./SearchInput";
import UserIcon from "./UserIcon";
import userAvatar from "../../images/User/Anonym.jpg";
import { LeftOutlined, RightOutlined } from "@ant-design/icons";
import PlaylistModule from "./PlaylistModule";
import ArtistModule from "./ArtistModule";

export default function MainMenu() {
  return (
    <div className="h-screen w-[80vw] mainMenu pl-8 pt-6">
      <div className="w-[65%] flex flex-col ">
        <div className="flex items-center justify-end">
          <div className="w-[70%] flex items-center justify-between">
            <SearchInput />
            <UserIcon userIcon={userAvatar} />
          </div>
        </div>
        <div className="flex gap-4 mb-[10px]">
          <div className="w-[30px] h-[30px] rounded-md glass flex justify-center items-center cursor-not-allowed">
            <LeftOutlined style={{ color: "white" }} />
          </div>
          <div className="w-[30px] h-[30px] rounded-md bg-white flex justify-center items-center hover:bg-gray-200 cursor-pointer">
            <RightOutlined style={{ color: "black" }} />
          </div>
        </div>
          <PlaylistModule />
          <ArtistModule />
      </div>
    </div>
  );
}
