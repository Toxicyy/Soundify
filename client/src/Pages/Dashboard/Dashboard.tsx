import Aside from "../../components/dashboard/aside/Aside";
import Main from "../../components/dashboard/main/Main";

export default function Dashboard() {
  return (
    <div className="flex overflow-x-hidden">
      <Aside />
      <Main />
    </div>
  );
}
