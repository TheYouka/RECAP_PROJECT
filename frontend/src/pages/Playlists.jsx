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
                    <li>WatchLater</li>
                    <li>Vistos</li>
                    <li>Viendo</li>
                    <li>Recien añadidas</li>
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