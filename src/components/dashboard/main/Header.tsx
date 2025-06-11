import {
  CaretDownOutlined,
  MenuOutlined,
  UserOutlined,
  MessageOutlined,
  CheckSquareOutlined,
  SettingOutlined,
  LogoutOutlined,
} from "@ant-design/icons";
import { useDispatch, useSelector } from "react-redux";
import type { AppDispatch, AppState } from "../../../store";
import { setMenuOpen } from "../../../state/DashboardMenu.slice";
import { useGetUserQuery } from "../../../state/UserApi.slice";
import userAvatar from "../../../images/User/Anonym.jpg";
import { useState, useRef, useEffect } from "react";

export default function Header() {
  const { data: user } = useGetUserQuery();
  const dispatch = useDispatch<AppDispatch>();
  const [userHover, setUserHover] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const isMenuOpen = useSelector(
    (state: AppState) => state.dashboardMenu.isOpen
  );

  // Закрытие dropdown при клике вне его
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setDropdownOpen(false);
      }
    };

    if (dropdownOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [dropdownOpen]);

  const menuItems = [
    { icon: <UserOutlined />, text: "My Profile", path: "/profile" },
    { icon: <MessageOutlined />, text: "My chat", path: "/chat" },
    { icon: <CheckSquareOutlined />, text: "Tasks", path: "/tasks" },
    { icon: <SettingOutlined />, text: "Settings", path: "/settings" },
    { icon: <LogoutOutlined />, text: "Logout", path: "/logout" },
  ];

  return (
    <div
      className={`flex items-center h-[55px] border-b-1 border-[#e6e6e6] justify-between transition-all duration-300`}
      style={{ width: `calc(100vw - ${isMenuOpen ? "230px" : "70px"})` }}
    >
      <div
        className="flex items-center justify-center gap-2 hover:bg-[#e6e5e5] h-[55px] w-[55px] cursor-pointer"
        onClick={() => dispatch(setMenuOpen())}
      >
        <MenuOutlined style={{ fontSize: "24px", color: "black" }} />
      </div>

      <div className="relative" ref={dropdownRef}>
        <div
          className="flex items-center gap-4 justify-center cursor-pointer px-5"
          onMouseEnter={() => setUserHover(true)}
          onMouseLeave={() => setUserHover(false)}
          onClick={() => setDropdownOpen(!dropdownOpen)}
        >
          <img
            src={user?.avatar !== null ? user?.avatar : userAvatar}
            alt=""
            className="w-[40px] h-[40px] rounded-full"
          />
          <h1
            className={`text-lg transition-colors ${
              userHover ? "text-blue-500" : "text-gray-600"
            }`}
          >
            {user?.name}
          </h1>
          <CaretDownOutlined
            className={`text-sm transition-all duration-200 ${
              dropdownOpen ? "rotate-180" : ""
            }`}
            style={{ color: userHover ? "#4299e1" : "#718096" }}
          />
        </div>

        {/* Dropdown Menu */}
        {dropdownOpen && (
          <div className="absolute right-0 mt-1 mx-5 w-[200px] bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-50">
            {menuItems.map((item, index) => (
              <a
                key={index}
                href={item.path}
                className="flex items-center gap-3 px-4 py-2.5 text-gray-700 hover:bg-gray-50 hover:text-blue-500 transition-colors"
                onClick={(e) => {
                  // Здесь можно добавить навигацию через React Router
                  e.preventDefault();
                  setDropdownOpen(false);
                  // navigate(item.path); // если используете React Router
                }}
              >
                <span className="text-lg">{item.icon}</span>
                <span className="text-sm font-medium">{item.text}</span>
              </a>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
