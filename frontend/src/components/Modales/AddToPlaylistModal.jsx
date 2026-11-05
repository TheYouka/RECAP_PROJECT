import { useState, useEffect } from "react";
import { API_URL } from "../../api";
import "../../css/add-to-playlist-modal.css";

// Pasa el nombre a minúsculas y sin tildes para compararlo sin problemas
// ("Recién añadidas" y "recien anadidas" quedan iguales)
const normalizeName = (name) =>
    name.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().trim();

// "Recien añadidas" NO se puede elegir: es una playlist calculada en el frontend
// (PlaylistView.jsx muestra lo creado en los últimos 7 días) y no guarda items.
const isCalculatedPlaylist = (playlist) =>
    normalizeName(playlist.name) === normalizeName("Recien añadidas");

// Lee el motivo del error que manda el backend en "detail" (o null si no hay)
const readDetail = async (response) => {
    const errorBody = await response.json().catch(() => null);
    return typeof errorBody?.detail === "string" ? errorBody.detail : null;
};

// Modal para agregar uno o varios contenidos a UNA playlist.
// - contentIds: ids de los contenidos a agregar
// - onDone: se llama cuando todo terminó bien (el padre cierra el modal)
function AddToPlaylistModal({ contentIds, onClose, onDone }) {
    const [playlists, setPlaylists] = useState([]);
    const [loading, setLoading] = useState(true);
    const [loadError, setLoadError] = useState(null);
    const [selectedPlaylistId, setSelectedPlaylistId] = useState(null);
    const [saving, setSaving] = useState(false);
    const [saveError, setSaveError] = useState(null);

    // Al abrir el modal, pedimos la lista de playlists: GET /playlists/
    useEffect(() => {
        const fetchPlaylists = async () => {
            try {
                const response = await fetch(`${API_URL}/playlists/`);
                if (!response.ok) {
                    throw new Error(`Error HTTP: ${response.status}`);
                }
                const data = await response.json();
                setPlaylists(data.filter((playlist) => !isCalculatedPlaylist(playlist)));
            } catch (err) {
                console.error("Error al obtener las playlists:", err);
                setLoadError("No se pudieron cargar las playlists");
            } finally {
                setLoading(false);
            }
        };

        fetchPlaylists();
    }, []);

    const handleSubmit = async (event) => {
        event.preventDefault();               // evita que la página se recargue
        setSaveError(null);

        try {
            setSaving(true);

            // 1. Una petición POST por contenido (el backend agrega de a uno).
            //    allSettled espera a todas aunque alguna falle.
            const results = await Promise.allSettled(
                contentIds.map(async (contentId) => {
                    const response = await fetch(`${API_URL}/playlists/${selectedPlaylistId}/items`, {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ content_id: contentId }),
                    });

                    // 201 = agregado. 409 = ya estaba en la playlist, también está bien.
                    if (response.ok || response.status === 409) return;

                    // Cualquier otro caso es un fallo (ej. 404: la playlist o el contenido no existen)
                    const detail = await readDetail(response);
                    throw new Error(detail ?? `Error HTTP: ${response.status}`);
                })
            );

            // 2. Nos quedamos solo con los que fallaron
            const failures = results.filter((result) => result.status === "rejected");

            // 3. Si todo salió bien, avisamos al padre para que cierre el modal
            if (failures.length === 0) {
                onDone?.();
                return;
            }

            // 4. Si algo falló, el modal sigue abierto y se explica qué pasó.
            //    Reintentar es seguro: lo ya agregado responde 409 y cuenta como correcto.
            const firstError = failures[0].reason;
            console.error("Error al agregar a la playlist:", firstError);

            if (firstError instanceof TypeError) {
                // fetch falló antes de recibir respuesta: backend apagado o sin red
                setSaveError("No se pudo conectar con el servidor.");
            } else {
                setSaveError(
                    `No se pudieron agregar ${failures.length} de ${contentIds.length} elemento(s): ${firstError.message}`
                );
            }
        } catch (err) {
            console.error("Error al agregar a la playlist:", err);
            setSaveError("Ocurrió un error al agregar los elementos.");
        } finally {
            setSaving(false);
        }
    };

    return (
        // Clic en el fondo oscuro cierra el modal
        <div className="add-playlist-modal-overlay" onClick={onClose}>

            <div
                className="add-playlist-modal"
                role="dialog"
                aria-modal="true"
                aria-labelledby="addToPlaylist-title"
                onClick={(event) => event.stopPropagation()}
            >

                {/* Encabezado */}
                <div className="add-playlist-modal-header">
                    <div>
                        <h3 id="addToPlaylist-title">Agregar a playlist</h3>
                        <p>{contentIds.length} elemento(s) seleccionado(s)</p>
                    </div>
                    <button type="button" aria-label="Cerrar" onClick={onClose}>✕</button>
                </div>

                <form onSubmit={handleSubmit}>

                    {/* Lista de playlists: cargando, error, vacía o con opciones */}
                    {loading ? (
                        <p>Cargando playlists...</p>
                    ) : loadError ? (
                        <p role="alert">{loadError}</p>
                    ) : playlists.length === 0 ? (
                        <p>No hay playlists disponibles.</p>
                    ) : (
                        <fieldset>
                            <legend>Elige una playlist</legend>

                            {playlists.map((playlist) => (
                                <label key={playlist.id} className="add-playlist-modal-option">
                                    <input
                                        type="radio"
                                        name="playlist"
                                        value={playlist.id}
                                        checked={selectedPlaylistId === playlist.id}
                                        onChange={() => setSelectedPlaylistId(playlist.id)}
                                    />
                                    <span>{playlist.name}</span>
                                </label>
                            ))}
                        </fieldset>
                    )}

                    {/* Mensaje de error (solo aparece si saveError tiene texto) */}
                    {saveError && <p role="alert">{saveError}</p>}

                    {/* Acciones */}
                    <div className="add-playlist-modal-actions">
                        <button type="button" onClick={onClose}>Cancelar</button>
                        <button type="submit" disabled={selectedPlaylistId === null || saving}>
                            {saving ? "Agregando..." : "Agregar a playlist"}
                        </button>
                    </div>
                </form>

            </div>

        </div>
    );
}

export default AddToPlaylistModal;
