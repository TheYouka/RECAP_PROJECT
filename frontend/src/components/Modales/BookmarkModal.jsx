import { useState } from "react";
import { coverSrc } from "../../api";
import "../../css/bookmark-modal.css";

// Convierte minutos en "2h 46m"
const formatDuration = (minutes) => {
    if (!minutes) return null;
    const hours = Math.floor(minutes / 60);
    const rest = minutes % 60;
    return hours > 0 ? `${hours}h ${rest}m` : `${rest}m`;
};

// Modal para agregar o editar el separador de una película.
// Por ahora solo es visual: únicamente cerrar y cancelar funcionan.
function BookmarkModal({ item, onClose }) {
    const { title, cover_url, movie, bookmark } = item;
    const isEdit = Boolean(bookmark);

    // Fuente del resumen: "manual" (lo escribe el usuario) o "ia" (lo genera la IA)
    const [source, setSource] = useState(bookmark?.recap_source ?? "manual");

    // Datos de la película para la cabecera: "Director · 2024 · 2h 46m"
    const meta = [movie?.director, movie?.release_year, formatDuration(movie?.duration_minutes)]
        .filter(Boolean)
        .join(" · ");

    const cover = coverSrc(cover_url);

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
                        <h3 id="bookmark-title">{isEdit ? "Editar separador" : "Agregar separador"}</h3>
                        <p>Guarda tu progreso y añade un resumen (opcional) para recordar qué viste.</p>
                    </div>
                    <button type="button" aria-label="Cerrar" onClick={onClose}>✕</button>
                </div>

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
                    </div>
                </div>

                <form onSubmit={(event) => event.preventDefault()}>

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

                    {/* Acciones */}
                    <div className="bookmark-modal-actions">
                        <button type="button" onClick={onClose}>Cancelar</button>
                        <button type="submit">Guardar separador</button>
                    </div>

                </form>

            </div>

        </div>
    );
}

export default BookmarkModal;
