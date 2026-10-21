import { useState, useRef, useEffect } from "react";

const ACCEPTED_IMAGE_TYPES = ["image/png", "image/jpeg"];

function CreateContentModal({ onClose, onSaved }){

    const fileInputRef = useRef(null);          // referencia al <input type="file"> oculto
    const [coverFile, setCoverFile] = useState(null);       // archivo elegido (para enviarlo después)
    const [coverPreview, setCoverPreview] = useState(null); // URL temporal para mostrar la imagen
    const [step, setStep] = useState(0);                    // paso actual: 0, 1 o 2
    const [type, setType] = useState("movie");              // define qué campos se piden en el paso 2
    const [saving, setSaving] = useState(false);
    const [saveError, setSaveError] = useState(null);

    const LAST_STEP = 2;
    const nextStep = () => setStep((s) => Math.min(s + 1, LAST_STEP));
    const prevStep = () => setStep((s) => Math.max(s - 1, 0));

    // Libera la URL temporal cuando cambia la imagen o se cierra el modal
    useEffect(() => {
        return () => {
            if (coverPreview) URL.revokeObjectURL(coverPreview);
        };
    }, [coverPreview]);

    const openFilePicker = () => fileInputRef.current?.click();

    const handleFileChange = (event) => {
        const file = event.target.files[0];
        if (!file) return;

        if (!ACCEPTED_IMAGE_TYPES.includes(file.type)) {
            alert("Solo se permiten imágenes PNG o JPG.");
            event.target.value = ""; // permite volver a elegir el mismo archivo
            return;
        }

        setCoverFile(file);
        setCoverPreview(URL.createObjectURL(file));
    };

    const handleSubmit = async (event) => {
        event.preventDefault();
        setSaveError(null);

        const form = event.target;
        const data = new FormData(form);

        // rating llega como texto o null si no se marcó ninguna estrella
        const ratingRaw = data.get("rating");

        const payload = {
            title: data.get("title"),
            type,
            status: data.get("status") || "plan_to_watch",
            synopsis: data.get("synopsis") || null,
            external_id: data.get("external_id") || null,
            rating: ratingRaw ? Number(ratingRaw) : null,
            external_link: data.get("external_link") || null,
        };

        if (type === "movie") {
            payload.movie = {
                duration_minutes: Number(data.get("duration_minutes")),
                release_year: data.get("release_year") ? Number(data.get("release_year")) : null,
                director: data.get("director") || null,
            };
        } else {
            payload.album = {
                artist: data.get("artist"),
                release_year: data.get("release_year") ? Number(data.get("release_year")) : null,
                total_tracks: data.get("total_tracks") ? Number(data.get("total_tracks")) : null,
            };
        }
        try {
            setSaving(true);
            const response = await fetch("http://localhost:8000/content/", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload),
            });

            if (!response.ok) {
                throw new Error(`Error HTTP: ${response.status}`);
                
            }

            const created = await response.json();
            onSaved?.(created);
            onClose();
        } catch (err) {
            console.error("Error al guardar el contenido:", err);

            setSaveError("No se pudo guardar el contenido.");
        } finally {
            setSaving(false);
        }
    };

    return(

        <>
        {/* Clic en el fondo oscuro cierra el modal */}
        <div className="modal-overlay" onClick={onClose}>

        <div
            className="modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="createContent-title"
            onClick={(event) => event.stopPropagation()}
        >

            {/* Encabezado */}
            <div className="modal-header">
                <div>
                    <h3 id="createContent-title">Agregar contenido</h3>
                    <p>Busca y guarda el contenido en tu librería.</p>
                </div>
                <button type="button" aria-label="Cerrar" onClick={onClose}>✕</button>
            </div>


            {/* Columna izquierda: pasos + portada */}
            <div className="leftSide">

                <ol className="steps">
                    <li className={step === 0 ? "active" : ""} aria-current={step === 0 ? "step" : undefined}>
                        <h3>Selecciona el contenido</h3>
                        <p>Llena la configuracion basica de tu contenido</p>
                    </li>

                    <li className={step === 1 ? "active" : ""} aria-current={step === 1 ? "step" : undefined}>
                        <h3>Configura y guarda</h3>
                        <p>Añade detalles en base al tipo de contenido</p>
                    </li>

                    <li className={step === 2 ? "active" : ""} aria-current={step === 2 ? "step" : undefined}>
                        <h3>Sinopsis y detalles</h3>
                        <p>Selecciona informacion adicional</p>
                    </li>
                </ol>

                <div className="coverDropzone">
                    <h3>Sube la portada</h3>
                    <p>Arrastra un archivo o haz clic para seleccionar PNG o JPG</p>

                    {/* Input real, oculto: el botón de abajo lo abre */}
                    <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/png, image/jpeg"
                        onChange={handleFileChange}
                        hidden
                    />
                    <button type="button" onClick={openFilePicker}>Seleccionar archivo</button>
                </div>

            </div>


            {/* Columna derecha: formulario */}
            <form className="detallesContenido-Container" onSubmit={handleSubmit}>
                <h3>Detalles del contenido</h3>

                {/* Los pasos se ocultan con "hidden" (no se desmontan) para conservar lo escrito */}

                {/* PASO 1: información básica */}
                <div hidden={step !== 0}>

                <div className="coverPreview">
                    {coverPreview ? (
                        <img src={coverPreview} alt="Vista previa de la portada" />
                    ) : (
                        <p>Vista previa</p>
                    )}
                    <button type="button" aria-label="Cambiar portada" onClick={openFilePicker}>✎</button>
                </div>

                <div className="fields">
                    <label htmlFor="content-title">Título</label>
                    <input id="content-title" name="title" type="text" />

                    <label htmlFor="content-type">Tipo</label>
                    <select
                        id="content-type"
                        name="type"
                        value={type}
                        onChange={(event) => setType(event.target.value)}
                    >
                        <option value="movie">Película</option>
                        <option value="music">Música</option>
                    </select>
                    
                </div>

                <hr />

                <fieldset className="status">
                    <legend>Estado</legend>
                    <label><input type="radio" name="status" value="plan_to_watch" /> Por ver</label>
                    <label><input type="radio" name="status" value="watching" /> Viendo</label>
                    <label><input type="radio" name="status" value="completed" /> Visto</label>
                    <label><input type="radio" name="status" value="paused" /> Pausado</label>
                </fieldset>

                <fieldset className="rating">
                    <legend>Calificación personal (opcional)</legend>
                    <label><input type="radio" name="rating" value="1" /> ★</label>
                    <label><input type="radio" name="rating" value="2" /> ★</label>
                    <label><input type="radio" name="rating" value="3" /> ★</label>
                    <label><input type="radio" name="rating" value="4" /> ★</label>
                    <label><input type="radio" name="rating" value="5" /> ★</label>
                </fieldset>

                </div>

                {/* PASO 2: detalles según el tipo (Movie o Album) */}
                <div hidden={step !== 1}>

                    {type === "movie" && (
                        <div className="fields">
                            <label htmlFor="movie-duration">Duración (minutos)</label>
                            <input id="movie-duration" name="duration_minutes" type="number" />

                            <label htmlFor="movie-year">Año de estreno</label>
                            <input id="movie-year" name="release_year" type="number" />

                            <label htmlFor="movie-director">Director</label>
                            <input id="movie-director" name="director" type="text" />
                        </div>
                    )}

                    {type === "music" && (
                        <div className="fields">
                            <label htmlFor="album-artist">Artista</label>
                            <input id="album-artist" name="artist" type="text" />

                            <label htmlFor="album-year">Año de lanzamiento</label>
                            <input id="album-year" name="release_year" type="number" />

                            <label htmlFor="album-tracks">Número de pistas</label>
                            <input id="album-tracks" name="total_tracks" type="number" />
                        </div>
                    )}

                </div>

                {/* PASO 3: sinopsis y detalles avanzados */}
                <div hidden={step !== 2}>
                    <div className="fields">
                        <label htmlFor="content-synopsis">Sinopsis</label>
                        <textarea id="content-synopsis" name="synopsis" rows="4" />

                        <label htmlFor="content-external-id">ID externo (TMDB o Spotify)</label>
                        <input id="content-external-id" name="external_id" type="text" />

                        <label htmlFor="content-external-link">Enlace externo</label>
                        <input id="content-external-link" name="external_link" type="url" />
                    </div>
                </div>

                <hr />

                {saveError && <p className="error">{saveError}</p>}

                <div className="modal-actions">
                    <button type="button" onClick={onClose}>Cancelar</button>
                    {step > 0 && <button type="button" onClick={prevStep}>Anterior</button>}
                    {step < LAST_STEP && <button type="button" onClick={nextStep}>Siguiente</button>}
                    {step === LAST_STEP && (
                        <button type="submit" disabled={saving}>
                            {saving ? "Guardando..." : "Guardar en mi librería"}
                        </button>
                    )}
                </div>

            </form>

        </div>

        </div>

        {/* CSS mínimo: solo lo necesario para que el modal flote sobre la página */}
        <style>{`
            .modal-overlay {
                position: fixed;
                inset: 0;
                display: flex;
                align-items: center;
                justify-content: center;
                background: rgba(0, 0, 0, 0.5);
                z-index: 1000;
            }
            .modal {
                display: grid;
                grid-template-columns: 280px 1fr;
                width: min(900px, 95vw);
                max-height: 90vh;
                overflow-y: auto;
                background: #fff;
                color: #222;
                text-align: left;
            }
            .modal .coverPreview img {
                width: 160px;
                aspect-ratio: 2 / 3;
                object-fit: cover;
                display: block;
            }
            .modal .steps li.active h3 {
                text-decoration: underline;
            }
            .modal .modal-header {
                grid-column: 1 / -1;
                display: flex;
                justify-content: space-between;
            }
        `}</style>
        </>

    )

}

export default CreateContentModal;
