import React, {useEffect, useState} from "react";
import {FaSearch} from "react-icons/fa"
import './component_styles.css'
import SearchResult from "./SearchResult";
import Toast from "./Toast";

export const SearchBar = () =>{

    const [input,setInput] = useState("")
    const [tracks, setTracks] = useState([])
    const [toast, setToast] = useState(null);

    //Search
    async function search() {
        var trackList = await fetch(`http://localhost:3001/api/search?q=${input}&type=track`)
            .then(response => response.json())
            //.then(data =>{return data.artists.items[0].id})
            .then(data => {
                console.log('📦 Datos completos:', data);  // Ver TODO
                console.log('🎵 Canciones:', data.tracks.items);  // Ver solo canciones
                return data;  // ⚠️ IMPORTANTE: devuelve data para el siguiente .then()
            })
            .then(data=>setTracks(data.tracks.items))
            .catch((err) => console.error(err))
    }

async function addSong(trackID) {
    try {
        const response = await fetch('http://localhost:3001/api/add-track', {
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
      setToast("🎶 Canción agregada a la playlist");
      setTimeout(() => setToast(null), 2500);
    } else {
      setToast("❌ No se pudo agregar la canción");
      setTimeout(() => setToast(null), 2500);
    }
  } catch (err) {
    setToast("❌ Error de conexión");
    setTimeout(() => setToast(null), 2500);
  }
        
       /*    
        if (data.success) {
            console.log('✅ Canción agregada:', data);
        } else {
            console.error('❌ Error:', data);
        }
    } catch (err) {
        console.error('❌ Error al agregar:', err);
    }
        */
    }

async function addToQueue(trackID){
    console.log(trackID)
    console.log("entre")
    try{
        const response = await fetch('http://localhost:3001/api/queue' ,{
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
        console.log('✅ Canción agregada a la cola');
        // Mostrar mensaje al usuario
        } else if (response.status === 404) {
        console.error('⚠️ No hay dispositivo activo');
        alert('Abre Spotify en tu teléfono o computadora primero');
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
                <button className="button" onClick={search}>
                    <FaSearch id="search-icon"/>
                </button>
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
        </div>
            <SearchResult tracks={tracks} onAddSong={addSong} addToQueue={addToQueue} />
    </div>
        {toast && <Toast message={toast} />}
    </>
    )
}