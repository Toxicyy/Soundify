
import Aside from "../components/aside/Aside";
import MainMenu from "../components/mainMenu/MainMenu";

export default function Main() {

  return (
    <div className="flex mainMenu w-full overflow-hidden">
      <Aside />
      <MainMenu />
    </div>
  );
}
