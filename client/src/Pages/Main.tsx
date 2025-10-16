import { Outlet } from "react-router-dom";
import Aside from "../components/mainPage/aside/Aside";

/**
 * Main layout component with sidebar
 */
export default function Main() {
  return (
    <div className="flex mainMenu w-full">
      <Aside />
      <Outlet />
    </div>
  );
}