import { Link } from "react-router-dom";
import Sidebar from "../components/sidebar";
import Navbar from "../components/Navbar"

function Playlists(){

    return(

        <>
            <Navbar/>

            <Sidebar/>

            <>  
                <h1>Playlists</h1>
                <p>Organiza y guarda tus contenidos favoritos en playlists</p>
            </>
        
            <div className="defaultPlaylist-Container">
                <ul>
                    <li><Link to="/playlist/watchlater">WatchLater</Link></li>
                    <li><Link to="/playlist/vistos">Vistos</Link></li>
                    <li><Link to="/playlist/viendo">Viendo</Link></li>
                    <li><Link to="/playlist/recien-añadidas">Recien añadidas</Link></li>
                    <button>Añadir playlist</button>

                </ul>
            </div>

            <div className="playlist-Container">
                <h2>Mis playlists</h2>
                
            </div>


        </>


    )


};



export default Playlists;