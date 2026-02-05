import React, {useEffect, useState} from "react";
import {FaSearch} from "react-icons/fa"
import './component_styles.css'
import SearchResult from "./SearchResult";
import Toast from "./Toast";
import { API_URL } from '../config';
import { rateLimiter } from "../utils/rateLimiter";

export const SearchBar = () =>{

    const [input,setInput] = useState("")
    const [tracks, setTracks] = useState([])
    const [toast, setToast] = useState(null);

    const showToast = (message) => {
        setToast(message);
        setTimeout(() => setToast(null), 2500);
    };

    //Search
    async function search() {
        var trackList = await fetch(`${API_URL}/api/search?q=${input}&type=track`)
            .then(response => response.json())
            //.then(data =>{return data.artists.items[0].id})
            .then(data => {
                //console.log('🎵 Canciones:', data.tracks.items);  // Ver solo canciones
                return data; 
            })
            .then(data=>setTracks(data.tracks.items))
            .catch((err) => console.error(err))
    }

    async function addSong(trackID) {
        console.log('🎵 Trying to add to the playlist:', trackID); 

        const limitCheck = rateLimiter.canAddSong();

        if (!limitCheck.allowed) { // Si no puede, muestra cuánto falta
            const timeLeft = rateLimiter.formatTimeLeft(limitCheck.timeLeft);
            console.log('🚫 Blocked - Time left:', timeLeft);  // ← DEBUG
            showToast(`⏱️ Wait ${timeLeft} to add another song`);
            return;  // Sale de la función
        }
        
        try {
            const response = await fetch(`${API_URL}/api/add-track`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    trackId: trackID  // Solo envías el ID de la canción
                })
            });

            const data = await response.json();

        if (response.ok) {
            rateLimiter.recordAdd()
            setToast("🎶 Song added to the playlist");
            setTimeout(() => setToast(null), 2500);
        } else {
            setToast("❌ The song could not be added");
            setTimeout(() => setToast(null), 2500);
        }
        } catch (err) {
            setToast("❌ Connection error");
            setTimeout(() => setToast(null), 2500);
        }
    }

    async function addToQueue(trackID){
        console.log(trackID)

        try{
            const response = await fetch(`${API_URL}/api/queue` ,{
                method: 'POST',
                headers:{
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    trackId: trackID
                    
                })
            });
            const data = await response.json();
            if (data.success) {
                console.log('✅ Song added to queue');
            } else if (response.status === 404) {
                console.error('⚠️ No active device found.');
                alert('The playlist is not active yet.');
            }
        }catch(err) {
            console.error('❌ Error:', err);
        }
    }

    return(
    <>
    <div className="container">
        <div className='search-bar-container'>
            <div className="input-wrapper">
                <FaSearch id="search-icon"/>
                <input
                    type="text" 
                    placeholder="Type to search..."

                    onKeyDown={e =>{
                        if (e.key == "Enter"){
                            search()
                        }
                    }}
                    onChange={e => setInput(e.target.value)}
                    />
            </div>
            <button className="search-button" onClick={search}>
            Search
            </button>
        </div>
            <SearchResult tracks={tracks} onAddSong={addSong} addToQueue={addToQueue} />
    </div>
        {toast && <Toast message={toast} />}
    </>
    )
}