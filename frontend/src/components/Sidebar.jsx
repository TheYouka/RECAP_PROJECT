import { NavLink } from 'react-router-dom'
import "../css/sidebar.css";

function Sidebar(){


    return (

        <div className="sidebar-container">

            <ul>

                <li>
                    {/* "end" hace que Inicio solo se marque en "/" exacto.
                        Sin "end", "/" coincide con todas las rutas y siempre estaría activo. */}
                    <NavLink to="/" end>Inicio</NavLink>
                </li>

                <li>
                    <NavLink to="/library">Libreria</NavLink>
                </li>

                <li>
                    <NavLink to="/playlists">Playlists</NavLink>
                </li>

                <li>
                    <NavLink to="/tags">Tags</NavLink>
                </li>
            </ul>

        </div>

    )

};

export default Sidebar;
