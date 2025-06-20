
import { Outlet } from "react-router-dom";
import Aside from "../components/aside/Aside";

export default function Main() {

  return (
    <div className="flex mainMenu w-full overflow-hidden">
      <Aside />
      <Outlet />
    </div>
  );
}
