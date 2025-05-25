import { useSelector } from "react-redux";
import type { AppState } from "../../store";
import Header from "./main/Header";

export default function Main() {
    const isMenuOpen = useSelector((state: AppState) => state.dashboardMenu.isOpen);
    return (
        <div className={"transition-all duration-300 ease-in-out " + (isMenuOpen ? "ml-[230px]" : "ml-[70px]")}>
            <Header />
        </div>
    );
}