import Aside from "../../components/dashboard/Aside";
import Main from "../../components/dashboard/Main";

export default function Dashboard() {
    return (
        <div className="flex overflow-x-hidden ">
            <Aside />
            <Main />
        </div>
    );
}