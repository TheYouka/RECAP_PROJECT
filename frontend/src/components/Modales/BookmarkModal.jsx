import { useState } from "react";
import { API_URL, coverSrc } from "../../api";
import "../../css/bookmark-modal.css";

// Convierte minutos en "2h 46m"
const formatDuration = (minutes) => {
    if (!minutes) return null;
    const hours = Math.floor(minutes / 60);
    const rest = minutes % 60;
    return hours > 0 ? `${hours}h ${rest}m` : `${rest}m`;
};

// Formulario del separador de UNA película.
// Sin separador: POST /content/{id}/bookmark. Con separador: PATCH al mismo endpoint.
// "Generar resumen con IA" todavía no funciona.
function BookmarkForm({ item, onClose, onSaved }) {
    const { title, cover_url, movie, bookmark } = item;
    const isEdit = Boolean(bookmark);

    // Fuente del resumen: "manual" (lo escribe el usuario) o "ia" (lo genera la IA)
    const [source, setSource] = useState(bookmark?.recap_source ?? "manual");
    const [saving, setSaving] = useState(false);
    const [saveError, setSaveError] = useState(null);

    const handleSubmit = async (event) => {
        event.preventDefault();               // evita que la página se recargue
        setSaveError(null);

        const data = new FormData(event.target);
        const position = data.get("position").trim();

        if (!position) {
            setSaveError("Indica dónde te quedaste.");
            return;
        }

        const payload = { position, recap_source: source };

        if (source === "manual") {
            // Resumen vacío = sin resumen (null)
            payload.recap_text = data.get("recap_text").trim() || null;
        } else if (!isEdit) {
            // IA: la generación aún no existe, así que se crea sin resumen.
            // Al editar no se envía recap_text, para conservar el resumen que ya tenga.
            payload.recap_text = null;
        }

        try {
            setSaving(true);

            const response = await fetch(`${API_URL}/content/${item.id}/bookmark`, {
                method: isEdit ? "PATCH" : "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload),
            });

            if (!response.ok) {
                // El backend explica el motivo en "detail" (ej. "no admite separador")
                const errorBody = await response.json().catch(() => null);
                const detail = typeof errorBody?.detail === "string" ? errorBody.detail : null;
                throw new Error(detail ?? `Error HTTP: ${response.status}`);
            }

            // El padre cierra el modal y recarga la lista
            onSaved?.();
        } catch (err) {
            console.error("Error al guardar el separador:", err);

            if (err instanceof TypeError) {
                // fetch falló antes de recibir respuesta: backend apagado o sin red
                setSaveError("No se pudo conectar con el servidor.");
            } else {
                setSaveError(err.message);
            }
        } finally {
            setSaving(false);
        }
    };

    // Datos de la película para la cabecera: "Director · 2024 · 2h 46m"
    const meta = [movie?.director, movie?.release_year, formatDuration(movie?.duration_minutes)]
        .filter(Boolean)
        .join(" · ");

    const cover = coverSrc(cover_url);

    return (
        <>
            {/* Película a la que pertenece el separador */}
            <div className="bookmark-modal-content">
                {cover ? (
                    <img src={cover} alt={`Portada de ${title}`} />
                ) : (
                    <div className="bookmark-modal-no-cover">Sin portada</div>
                )}
                <div>
                    <h4>{title}</h4>
                    {meta && <p>{meta}</p>}
                    <span>Película</span>
                    {isEdit && <p>Ya tiene un separador: se actualizará.</p>}
                </div>
            </div>

            <form onSubmit={handleSubmit}>

                {/* Dónde se quedó el usuario */}
                <label htmlFor="bookmark-position">¿Dónde te quedaste?</label>
                <input
                    id="bookmark-position"
                    name="position"
                    type="text"
                    placeholder="Ej. 1:12:30, minuto 45, escena 3..."
                    defaultValue={bookmark?.position ?? ""}
                    required
                />
                <p>Puedes usar una marca de tiempo o una descripción.</p>

                {/* Fuente del resumen */}
                <fieldset>
                    <legend>Fuente del resumen</legend>

                    <label className="bookmark-modal-option">
                        <input
                            type="radio"
                            name="recap_source"
                            value="manual"
                            checked={source === "manual"}
                            onChange={() => setSource("manual")}
                        />
                        <span>
                            <strong>Manual</strong>
                            <small>Lo escribes tú</small>
                        </span>
                    </label>

                    <label className="bookmark-modal-option">
                        <input
                            type="radio"
                            name="recap_source"
                            value="ia"
                            checked={source === "ia"}
                            onChange={() => setSource("ia")}
                        />
                        <span>
                            <strong>IA</strong>
                            <small>Generado por inteligencia artificial</small>
                        </span>
                    </label>
                </fieldset>

                {/* Resumen manual: lo escribe el usuario */}
                {source === "manual" && (
                    <>
                        <label htmlFor="bookmark-recap">Resumen (opcional)</label>
                        <textarea
                            id="bookmark-recap"
                            name="recap_text"
                            rows="4"
                            maxLength={500}
                            placeholder="Escribe un breve resumen de lo que viste hasta ahora..."
                            defaultValue={bookmark?.recap_text ?? ""}
                        />
                    </>
                )}

                {/* Resumen con IA: el contexto es opcional, la IA puede generar sin él */}
                {source === "ia" && (
                    <>
                        <label htmlFor="bookmark-ai-context">Contexto para la IA (opcional)</label>
                        <textarea
                            id="bookmark-ai-context"
                            name="ai_context"
                            rows="4"
                            maxLength={500}
                            placeholder="Añade detalles para que el resumen sea más preciso. Si lo dejas vacío, la IA lo genera solo con el título y tu posición."
                        />
                        <button type="button">Generar resumen con IA</button>
                    </>
                )}

                {/* Mensaje de error (solo aparece si saveError tiene texto) */}
                {saveError && <p role="alert">{saveError}</p>}

                {/* Acciones */}
                <div className="bookmark-modal-actions">
                    <button type="button" onClick={onClose}>Cancelar</button>
                    <button type="submit" disabled={saving}>
                        {saving ? "Guardando..." : "Guardar separador"}
                    </button>
                </div>

            </form>
        </>
    );
}

// Caja de búsqueda: al enfocarla despliega la lista de películas y se filtra al escribir
function ContentPicker({ options, selected, onSelect }) {
    const [query, setQuery] = useState("");
    const [open, setOpen] = useState(false);

    const filtered = options.filter((option) =>
        option.title.toLowerCase().includes(query.trim().toLowerCase())
    );

    const choose = (option) => {
        onSelect(option);
        setQuery(option.title);           // la caja muestra la película elegida
        setOpen(false);
    };

    return (
        <div className="bookmark-picker">
            <label htmlFor="bookmark-search">Elige una película</label>
            <input
                id="bookmark-search"
                type="text"
                placeholder="Buscar en tu librería..."
                value={query}
                onChange={(event) => {
                    setQuery(event.target.value);
                    setOpen(true);
                }}
                onFocus={() => setOpen(true)}
                autoComplete="off"
            />

            {open && (
                <ul className="bookmark-picker-list">
                    {filtered.length === 0 ? (
                        <li>No hay películas que coincidan.</li>
                    ) : (
                        filtered.map((option) => (
                            <li key={option.id}>
                                <button
                                    type="button"
                                    onClick={() => choose(option)}
                                    aria-pressed={selected?.id === option.id}
                                >
                                    {option.title}
                                    {option.movie?.release_year ? ` (${option.movie.release_year})` : ""}
                                    {option.bookmark ? " · ya tiene separador" : ""}
                                </button>
                            </li>
                        ))
                    )}
                </ul>
            )}
        </div>
    );
}

// Modal del separador.
// - Con `item`: separador de esa película (botón "Separador" de cada tarjeta).
// - Con `options` y sin `item`: primero muestra la caja de búsqueda; al elegir una película
//   aparece el formulario debajo, y la caja sigue presente para cambiar de película.
function BookmarkModal({ item, options, onClose, onSaved }) {
    const [selected, setSelected] = useState(item ?? null);
    const showPicker = Array.isArray(options);

    return (
        // Clic en el fondo oscuro cierra el modal
        <div className="bookmark-modal-overlay" onClick={onClose}>

            <div
                className="bookmark-modal"
                role="dialog"
                aria-modal="true"
                aria-labelledby="bookmark-title"
                onClick={(event) => event.stopPropagation()}
            >

                {/* Encabezado */}
                <div className="bookmark-modal-header">
                    <div>
                        <h3 id="bookmark-title">
                            {selected?.bookmark ? "Editar separador" : "Agregar separador"}
                        </h3>
                        <p>Guarda tu progreso y añade un resumen (opcional) para recordar qué viste.</p>
                    </div>
                    <button type="button" aria-label="Cerrar" onClick={onClose}>✕</button>
                </div>

                {showPicker && (
                    <ContentPicker options={options} selected={selected} onSelect={setSelected} />
                )}

                {/* key: al cambiar de película el formulario se reinicia con sus datos */}
                {selected && (
                    <BookmarkForm
                        key={selected.id}
                        item={selected}
                        onClose={onClose}
                        onSaved={onSaved}
                    />
                )}

            </div>

        </div>
    );
}

export default BookmarkModal;
