import { useSelector } from "react-redux";
import type { AppState } from "../store";

const API_URL = "https://api.spotify.com/v1/";
const tokenUrl = "https://accounts.spotify.com/api/token";


export const api = {
    getToken: async () => {
        const response = await fetch(`${tokenUrl}`, {
            method: "POST",
            headers: {
                "Content-Type": "application/x-www-form-urlencoded",
            },
            body: `grant_type=client_credentials&client_id=${import.meta.env.VITE_SPOTIFY_CLIENT_ID}&client_secret=${import.meta.env.VITE_SPOTIFY_CLIENT_SECRET}`,
        });
        const data = await response.json();
        return data;
    },
    getArtistByName: async (name: string, token: string) => {
        const response = await fetch(`${API_URL}search?q=${name}&type=artist`, {
            headers: {
                "Authorization": `Bearer ${token}`
            }
        })
        const data = await response.json();
        return data;
    },
    getArtistPopularTracks: async (id: string, token: string) => {
        const response = await fetch(`${API_URL}artists/${id}/top-tracks`, {
            headers: {
                "Authorization": `Bearer ${token}`
            }
        })
        const data = await response.json();
        return data;
    }
}

export const api2 ={
    searchUser: async (username: string) => {
        const url = `https://api.soundcloud.com/users?q=${encodeURIComponent(username)}&client_id=${import.meta.env.VITE_SOUNDCLOUD_CLIENT_ID}`;
        
        try {
          const response = await fetch(url);
          const data = await response.json();
          return data[0]; // Возвращаем первого найденного исполнителя
        } catch (error) {
          console.error('Ошибка поиска:', error);
        }
      }
}