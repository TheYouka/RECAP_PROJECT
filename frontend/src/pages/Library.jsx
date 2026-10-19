import { useState, useEffect } from "react";
import Navbar from "../components/navbar";
import Sidebar from "../components/sidebar";
import ContentCard from "../components/ContentCard";

function Library() {
    const [content, setContent] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        fetchContent();
    }, []);

    const fetchContent = async () => {
        try {
            const response = await fetch("http://localhost:8000/content");
            if (!response.ok) {
                throw new Error(`Error HTTP: ${response.status}`);
            }
            const data = await response.json();
            setContent(data);
        } catch (err) {
            console.error("Error al obtener contenido:", err);
            setError("No se pudo cargar el contenido");
        } finally {
            setLoading(false);
        }
    };

    const getContentTypeEmoji = (type) => {
        switch (type) {
            case "movie": return "🎬";
            case "music": return "🎵";
            default: return "📺";
        }
    };

    return (
        <>
            <Navbar />
            <Sidebar />

            <div className="topMenu-container">
                <h1>Tu Librería</h1>
                <p>Todo el contenido que has guardado en un solo lugar</p>

                <div>
                    <ul>
                        <li>
                            <button>Filtros</button>
                            <button>Ordenar</button>
                            <button onClick={fetchContent}>Actualizar</button>
                        </li>
                    </ul>
                </div>

                <div>
                    <ul>
                        <li>
                            <button>Todos</button>
                            <button>Películas</button>
                            <button>Series</button>
                            <button>Música</button>
                            <button>Documentales</button>
                            <button>Otros</button>
                        </li>
                    </ul>
                </div>

                <div>
                    <ul>
                        <li>
                            <button>Seleccionar todo</button>
                            <button>Agregar Separador</button>
                        </li>
                    </ul>
                </div>
            </div>

            <div className="content-container">
                {loading ? (
                    <p>Cargando contenido...</p>
                ) : error ? (
                    <p className="error">{error}</p>
                ) : content.length === 0 ? (
                    <p>No hay contenido disponible. ¡Agrega algo primero!</p>
                ) : (
                    <div className="content-grid">
                        {content.map((item) => (
                            <ContentCard
                                key={item.id}
                                title={`${getContentTypeEmoji(item.type)} ${item.title}`}
                                content={item.synopsis || "Sin descripción"}
                            />
                        ))}
                    </div>
                )}
            </div>

            
        </>
    );
}

export default Library;