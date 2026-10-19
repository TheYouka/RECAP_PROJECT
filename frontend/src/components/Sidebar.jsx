import { Link } from 'react-router-dom'

function Sidebar(){


    return (

        <div className="sidebar-container">

            <ul>

                <li>
                    <Link to="/">Inicio</Link>
                </li>

                <li>
                    <Link to="/library">Libreria</Link>
                </li>

                <li>
                    <Link to="/playlists">Playlists</Link>
                </li>

                <li>
                    <Link to="/tags">Tags</Link>
                </li>

            </ul>

        </div>

    )

};

export default Sidebar;