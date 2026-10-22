import { useState, useEffect, useCallback } from "react";
import Navbar from "../components/navbar";
import Sidebar from "../components/sidebar";
import ContentCard from "../components/ContentCard";
import CreateContentModal from "../components/Modales/CreateContentModal";

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

// Criterios de orden disponibles. `get` extrae el valor a comparar y `dir` es el
// sentido ("asc" o "desc"). Los elementos sin valor siempre quedan al final.
// Los criterios sin `get` aún no tienen datos en la API y solo muestran un aviso.
const STATUS_ORDER = ["watching", "plan_to_watch", "paused", "completed"];

const SORT_OPTIONS = {
    fecha_agregado: { get: (item) => item.id, dir: "desc" }, // el id crece con cada alta
    titulo: { get: (item) => item.title, dir: "asc" },
    anio_lanzamiento: { get: (item) => item.movie?.release_year ?? item.album?.release_year, dir: "desc" },
    calificacion_personal: { get: (item) => item.rating, dir: "desc" },
    duracion: { get: (item) => item.movie?.duration_minutes, dir: "desc" },
    cantidad_elementos: { get: (item) => item.album?.total_tracks, dir: "desc" },
    estado: { get: (item) => STATUS_ORDER.indexOf(item.status), dir: "asc" },
    director_artista_creador: { get: (item) => item.movie?.director ?? item.album?.artist, dir: "asc" },
    ultima_actividad: {},
    cantidad_etiquetas: {},
    genero: {},
    progreso: {},
    fecha_finalizacion: {},
    favoritos: {},
    orden_personalizado: {},
};

const sortContent = (items, sortKey, reversed = false) => {
    const option = SORT_OPTIONS[sortKey];
    if (!option?.get) return items;

    // Invertir cambia solo el sentido; los elementos sin valor siguen al final
    const isDesc = (option.dir === "desc") !== reversed;
    const factor = isDesc ? -1 : 1;
    return [...items].sort((a, b) => {
        const valueA = option.get(a);
        const valueB = option.get(b);
        const missingA = valueA === undefined || valueA === null || valueA === "";
        const missingB = valueB === undefined || valueB === null || valueB === "";

        if (missingA && missingB) return 0;
        if (missingA) return 1;
        if (missingB) return -1;

        if (typeof valueA === "string") {
            return factor * valueA.localeCompare(valueB, "es", { sensitivity: "base" });
        }
        return factor * (valueA - valueB);
    });
};

function Library() {
    const [content, setContent] = useState([]);
    const [activeFilter, setActiveFilter] = useState("all");
    const [sortBy, setSortBy] = useState("titulo");
    const [sortReversed, setSortReversed] = useState(false);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [bookmarkItem, setBookmarkItem] = useState(null); // item en edición, null = modal cerrado
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [selectedIds, setSelectedIds] = useState([]); // ids de los elementos seleccionados

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

    const closeBookmarkModal = useCallback(() => setBookmarkItem(null), []);

    const handleBookmarkSaved = () => {
        setBookmarkItem(null);
        fetchContent();
    };

    const currentFilter = TYPE_FILTERS.find((filter) => filter.id === activeFilter);
    const filteredContent = sortContent(
        content.filter((item) => matchesFilter(item, currentFilter)),
        sortBy,
        sortReversed
    );

    // Agrega o quita un elemento de la lista de seleccionados
    const toggleSelected = (id) => {
        setSelectedIds((prev) =>
            prev.includes(id) ? prev.filter((selectedId) => selectedId !== id) : [...prev, id]
        );
    };

    // "Seleccionar todos" actúa sobre los elementos visibles (respeta el filtro de tipo)
    const allSelected =
        filteredContent.length > 0 &&
        filteredContent.every((item) => selectedIds.includes(item.id));

    const toggleSelectAll = () => {
        const visibleIds = filteredContent.map((item) => item.id);
        setSelectedIds((prev) =>
            allSelected
                ? prev.filter((id) => !visibleIds.includes(id))
                : [...new Set([...prev, ...visibleIds])]
        );
    };

    const handleSortChange = (event) => {
        const selected = event.target.value;
        if (!SORT_OPTIONS[selected]?.get) {
            alert("Este criterio de orden todavía no está disponible.");
            return; // el select es controlado, vuelve a la opción anterior
        }
        setSortBy(selected);
    };


    // Borrar todos los contentID seleccionados
    const deleteSelectedElements = async () => {
        // 1. Si no hay nada seleccionado, avisamos y salimos
        if (selectedIds.length === 0) {
            alert("No hay elementos seleccionados para borrar.");
            return;
        }

        try {
            // 2. Una petición DELETE por cada id; allSettled espera a todas
            //    aunque alguna falle
            const results = await Promise.allSettled(
                selectedIds.map((id) =>
                    fetch(`http://localhost:8000/content/${id}`, { method: "DELETE" })
                )
            );

            // 3. Separamos los ids borrados de los que fallaron
            //    (204 = borrado, 404 = ya no existía, lo contamos como borrado)
            const deletedIds = [];
            results.forEach((result, index) => {
                if (
                    result.status === "fulfilled" &&
                    (result.value.ok || result.value.status === 404)
                ) {
                    deletedIds.push(selectedIds[index]);
                }
            });
            const failedCount = selectedIds.length - deletedIds.length;

            // 4. Quitamos de la selección solo los borrados; los fallidos
            //    siguen seleccionados para poder reintentar
            setSelectedIds((prev) => prev.filter((id) => !deletedIds.includes(id)));

            // 5. Si alguno falló, avisamos cuántos
            if (failedCount > 0) {
                alert(`No se pudieron borrar ${failedCount} elemento(s).`);
            }
        } catch (err) {
            console.error("Error al borrar contenido:", err);
            alert("Ocurrió un error al borrar los elementos.");
        } finally {
            // 6. Siempre volvemos a pedir la lista a la API
            await fetchContent();
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
                            
                            <select value={sortBy} onChange={handleSortChange} aria-label="Ordenar por">
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
                            <button
                                type="button"
                                onClick={() => setSortReversed((prev) => !prev)}
                                aria-pressed={sortReversed}
                                title="Invertir el orden"
                            >
                                {sortReversed ? "↑ Invertido" : "↕ Invertir"}
                            </button>
                            <button onClick={fetchContent}>Actualizar</button>
                            <button type="button" onClick={() => setShowCreateModal(true)}>Agregar</button>

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
                            <button type="button" onClick={toggleSelectAll}>
                                {allSelected ? "Deseleccionar todos" : "Seleccionar todos"}
                            </button>
                            <button>Agregar Separador</button>
                        </li>
                    </ul>
                </div>
            </div>

            {/*Botones de borrar y actualizar*/}
            <div>
                {selectedIds.length != 0 && 
                    <>
                        <button type="button" onClick={deleteSelectedElements}>
                            Borrar
                        </button>
                        
                        <button type="button">
                            Actualizar
                        </button>
                    
                    </>
                    
                }
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
                                item={item}
                                onBookmarkClick={setBookmarkItem}
                                selected={selectedIds.includes(item.id)}
                                onSelectChange={toggleSelected}
                            />
                        ))}
                    </div>
                )}
            </div>

            {showCreateModal && (
                <CreateContentModal
                    onClose={() => setShowCreateModal(false)}
                    onSaved={fetchContent}
                />
            )}

            

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