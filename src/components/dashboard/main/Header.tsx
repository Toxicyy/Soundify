import { MenuOutlined } from "@ant-design/icons";
import { useDispatch } from "react-redux";
import type { AppDispatch } from "../../../store";
import { setMenuOpen } from "../../../state/DashboardMenu.slice";

export default function Header() {
  const dispatch = useDispatch<AppDispatch>();
  return (
    <div className="flex items-center h-[55px] w-[100vw] border-b-1 border-[#e6e6e6]">
      <div
        className="flex items-center justify-center gap-2 hover:bg-[#e6e5e5] h-[55px] w-[55px] duration-300 cursor-pointer"
        onClick={() => dispatch(setMenuOpen())}
      >
        <MenuOutlined style={{ fontSize: "24px", color: "black" }} />
      </div>
    </div>
  );
}
