import { useState, useEffect } from "react";
import Navbar from "../components/navbar";
import Sidebar from "../components/sidebar";
import ContentCard from "../components/ContentCard";

// Valores de content.type según el modelo de datos (ContentType: movie | music).
// Series y Documentales aún no existen en el modelo, por eso no tienen valores.
// "Otros" agrupa cualquier tipo que no esté asignado a otro botón.
const TYPE_FILTERS = [
    { id: "all", label: "Todos" },
    { id: "movie", label: "Películas", types: ["movie"] },
    { id: "series", label: "Series", types: [] },
    { id: "music", label: "Música", types: ["music"] },
    { id: "documentary", label: "Documentales", types: [] },
    { id: "other", label: "Otros", isOther: true },
];

const KNOWN_TYPES = TYPE_FILTERS.flatMap((filter) => filter.types ?? []);

const matchesFilter = (item, filter) => {
    if (filter.id === "all") return true;
    if (filter.isOther) return !KNOWN_TYPES.includes(item.type);
    return filter.types.includes(item.type);
};

function Library() {
    const [content, setContent] = useState([]);
    const [activeFilter, setActiveFilter] = useState("all");
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

    const currentFilter = TYPE_FILTERS.find((filter) => filter.id === activeFilter);
    const filteredContent = content.filter((item) => matchesFilter(item, currentFilter));

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
                            
                            <select>
                                <option value="fecha_agregado">Fecha de agregado</option>
                                <option value="titulo">Título</option>
                                <option value="anio_lanzamiento">Año de lanzamiento</option>
                                <option value="calificacion_personal">Calificación personal</option>
                                <option value="duracion">Duración</option>
                                <option value="ultima_actividad">Última actividad</option>
                                <option value="cantidad_elementos">Cantidad de elementos</option>
                                <option value="cantidad_etiquetas">Cantidad de etiquetas</option>
                                <option value="estado">Estado</option>
                                <option value="director_artista_creador">Director/Artista/Creador</option>
                                <option value="genero">Género</option>
                                <option value="progreso">Progreso</option>
                                <option value="fecha_finalizacion">Fecha de finalización</option>
                                <option value="favoritos">Favoritos</option>
                                <option value="orden_personalizado">Orden personalizado</option>
                            </select>
                            <button onClick={fetchContent}>Actualizar</button>
                        </li>
                    </ul>
                </div>

                <div>
                    <ul>
                        <li>
                            {TYPE_FILTERS.map((filter) => (
                                <button
                                    key={filter.id}
                                    type="button"
                                    className={`type-filter${activeFilter === filter.id ? " active" : ""}`}
                                    aria-pressed={activeFilter === filter.id}
                                    onClick={() => setActiveFilter(filter.id)}
                                >
                                    {filter.label}
                                </button>
                            ))}
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
                ) : filteredContent.length === 0 ? (
                    <p>No hay contenido de este tipo</p>
                ) : (
                    <div className="content-grid">
                        {filteredContent.map((item) => (
                            <ContentCard
                                key={item.id}
                                title={`${getContentTypeEmoji(item.type)} ${item.title}`}
                                content={item.synopsis || "Sin descripción"}
                            />
                        ))}
                    </div>
                )}
            </div>

            <style>{`
                .type-filter.active {
                    background: #333;
                    color: white;
                }
            `}</style>
        </>
    );
}

export default Library;