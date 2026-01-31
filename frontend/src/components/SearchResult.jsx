import React from "react";
import './component_styles.css'


const SearchResult = ({tracks, onAddSong, addToQueue}) =>{
    if(!tracks || tracks.length === 0) {
        return <p className="no-results">Search a Song/Artist</p>
    }

    return(
        <div className="track-container">
            {tracks.map((track,i)=>{
                return(
                    <div className="track-card" key={i} onClick={() => {onAddSong(track.id), addToQueue(track.id)}}>
                        <img src={track.album.images[0].url} alt={track.name} />
                        <h3 className="song-artist">{track.artists.map(a => a.name).join(', ')}</h3>
                        <h3 className="song-title">{track.name}</h3>
                    </div>
                )
            })}
        </div>
    )
}

export default SearchResult;