import { Link } from "react-router-dom";
import Sidebar from "../components/sidebar";
import Navbar from "../components/Navbar"
import { playlistCoverSrc } from "../api";
import "../css/playlists.css";

// Playlists por defecto. Sus ids son 1 a 4 porque el backend las crea en este orden al arrancar.
const DEFAULT_PLAYLISTS = [
    { id: 1, slug: "watchlater", label: "WatchLater" },
    { id: 2, slug: "vistos", label: "Vistos" },
    { id: 3, slug: "viendo", label: "Viendo" },
    { id: 4, slug: "recien-añadidas", label: "Recien añadidas" },
];

function Playlists(){

    return(

        <>
            <Navbar/>

            <Sidebar/>

            <>  
                <h1>Playlists</h1>
                <p>Organiza y guarda tus contenidos favoritos en playlists</p>
            </>

            <button>Añadir playlist</button>
        
            <div className="defaultPlaylist-Container">
                <ul>
                    {DEFAULT_PLAYLISTS.map((playlist) => (
                        <li key={playlist.id}>
                            {/* Fondo: si la portada no existe, la imagen se oculta y queda en blanco */}
                            <img
                                className="playlist-cover"
                                src={playlistCoverSrc(playlist.id)}
                                alt=""
                                onError={(event) => { event.currentTarget.style.display = "none"; }}
                            />
                            <Link to={`/playlist/${playlist.slug}`}>{playlist.label}</Link>
                        </li>
                    ))}
                </ul>

                
            </div>

            <div className="playlist-Container">
                <h2>Mis playlists</h2>
                
            </div>


        </>


    )


};



export default Playlists;