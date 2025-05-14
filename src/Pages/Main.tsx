import Aside from "../components/aside/Aside";
import MainMenu from "../components/mainMenu/MainMenu";

export default function Main(){
    return (
        <div className="flex">
            <Aside />
            <MainMenu />
        </div>
    )
}