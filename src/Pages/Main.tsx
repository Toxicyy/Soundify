import { useEffect } from "react";
import Aside from "../components/aside/Aside";
import MainMenu from "../components/mainMenu/MainMenu";
import { api, api2 } from "../shared/api";
import { useDispatch, useSelector } from "react-redux";
import type { AppDispatch, AppState } from "../store";
import { setToken } from "../state/Token.slice";

export default function Main(){
    const dispatch = useDispatch<AppDispatch>()
    useEffect(() => {
        api2.searchUser("9mice").then((data) => {
            console.log(data)
        })
    }, [])

    return (
        <div className="flex overflow-hidden">
            <Aside />
            <MainMenu />
        </div>
    )
}