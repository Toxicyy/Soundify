import { Link } from "react-router-dom";
import { useGetUserQuery } from "../../../../state/UserApi.slice";

export default function UserIcon({ userIcon }: { userIcon: string }) {
  const { data: user } = useGetUserQuery();
  return (
    <Link to={user ? `/profile/${user._id}` : "/"}>
      <div className="flex items-end drop-shadow-[0_5px_5px_rgba(0,0,0,0.4)] hover:scale-110 transition-all duration-300">
        <div className="w-[40px] h-[40px] rounded-full overflow-hidden flex">
          <img src={userIcon} alt="User Icon" />
        </div>
        <div className="w-[7px] h-[7px] bg-green-400 rounded-full mb-[5px] ml-[-8px] z-50"></div>
      </div>
    </Link>
  );
}
