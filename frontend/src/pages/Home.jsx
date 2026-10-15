import Navbar from "../components/navbar";
import Sidebar from "../components/sidebar";


function Home(){

    return (

        <>  

            <Navbar/>

            <Sidebar/>

            <h2>
                Hola, ¿Qué quieres ver hoy?
            </h2>   

            <p>
                Tus peliculas, series, música y más en un solo lugar.
            </p>

            <div className="stats-container">
                <div className="vistos">

                </div>

                <div className="enProgreso">
                                        
                </div>

                <div className="porVer">
                                        
                </div>

                <div className="tags">
                                        
                </div>
            </div>

            <div className="cWatching-container">

                <p>En construcción</p>
            </div>

            <div className="middle-container">
                <div className="watchLater-container">
                    <p>Watch later</p>
                </div>

                <div className="recommendationsTags-container">
                    <p>Recommendations tags</p>
                </div>
            </div>


            <div className="moreRecents-container">

                <p>Más recientes</p>
            
            </div>

        
        </>
    )


}

export default Home;