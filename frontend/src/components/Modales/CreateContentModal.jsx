import { useState, useRef, useEffect } from "react";
import { API_URL, coverSrc } from "../../api";
import "../../css/create-content-modal.css";

const ACCEPTED_IMAGE_TYPES = ["image/png", "image/jpeg"];

// Si recibe `item`, el modal funciona en modo "actualizar": se llena con los datos
// del elemento y al guardar hace PATCH. Sin `item`, es el modo "agregar" (POST).
function CreateContentModal({ onClose, onSaved, item }){

    const isEdit = Boolean(item);
    const movieData = item?.movie;
    const albumData = item?.album;

    const fileInputRef = useRef(null);          // referencia al <input type="file"> oculto
    const [coverFile, setCoverFile] = useState(null);       // archivo elegido (para enviarlo después)
    const [coverPreview, setCoverPreview] = useState(coverSrc(item?.cover_url)); // portada actual o URL temporal
    const [step, setStep] = useState(0);                    // paso actual: 0, 1 o 2
    const [type, setType] = useState(item?.type ?? "movie"); // define qué campos se piden en el paso 2
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

        // rating llega como texto ("" si el campo está vacío); el backend usa la misma escala de 1 a 10
        const ratingRaw = data.get("rating");

        const payload = {
            title: data.get("title"),
            status: data.get("status") || item?.status || "plan_to_watch",
            synopsis: data.get("synopsis") || null,
            external_id: data.get("external_id") || null,
            external_link: data.get("external_link") || null,
        };

        if (isEdit) {
            // El tipo no se puede cambiar una vez creado, por eso no se envía.
            // La calificación solo se envía si se eligió una, para no borrar la actual.
            if (ratingRaw) payload.rating = Number(ratingRaw);
        } else {
            payload.type = type;
            payload.rating = ratingRaw ? Number(ratingRaw) : null;
        }

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
            // Actualizar: PATCH /content/{id} (el id sale del item). Agregar: POST /content/
            const url = isEdit
                ? `${API_URL}/content/${item.id}`
                : `${API_URL}/content/`;

            const response = await fetch(url, {
                method: isEdit ? "PATCH" : "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload),
            });

            if (!response.ok) {
                throw new Error(`Error HTTP: ${response.status}`);
                
            }

            const created = await response.json();

            // Si se eligió una portada, se sube ahora que el contenido ya existe (tenemos su id).
            // Se usa FormData sin Content-Type: el navegador pone el boundary multipart solo.
            if (coverFile) {
                try {
                    const coverData = new FormData();
                    coverData.append("file", coverFile);

                    const coverResponse = await fetch(`${API_URL}/content/${created.id}/cover`, {
                        method: "POST",
                        body: coverData,
                    });

                    if (!coverResponse.ok) {
                        // Intenta leer el motivo que manda el servidor (campo "detail")
                        const errorBody = await coverResponse.json().catch(() => null);
                        const detail = typeof errorBody?.detail === "string" ? errorBody.detail : null;
                        throw new Error(detail ?? `Error HTTP: ${coverResponse.status}`);
                    }
                } catch (coverErr) {
                    console.error("Error al subir la portada:", coverErr);
                    alert(`El contenido se guardó, pero la portada no se pudo subir: ${coverErr.message}`);
                }
            }

            // onSaved va DESPUÉS de la subida para que la lista refrescada ya traiga la portada nueva
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
                    <h3 id="createContent-title">{isEdit ? "Actualizar contenido" : "Agregar contenido"}</h3>
                    <p>{isEdit ? "Modifica los datos y guarda los cambios." : "Busca y guarda el contenido en tu librería."}</p>
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
                    <input id="content-title" name="title" type="text" defaultValue={item?.title ?? ""} />

                    <label htmlFor="content-type">Tipo</label>
                    <select
                        id="content-type"
                        name="type"
                        value={type}
                        onChange={(event) => setType(event.target.value)}
                        disabled={isEdit}
                    >
                        <option value="movie">Película</option>
                        <option value="music">Música</option>
                    </select>
                    
                </div>

                <hr />

                <fieldset className="status">
                    <legend>Estado</legend>
                    <label><input type="radio" name="status" value="plan_to_watch" defaultChecked={item?.status === "plan_to_watch"} /> Por ver</label>
                    <label><input type="radio" name="status" value="watching" defaultChecked={item?.status === "watching"} /> Viendo</label>
                    <label><input type="radio" name="status" value="completed" defaultChecked={item?.status === "completed"} /> Visto</label>
                    <label><input type="radio" name="status" value="paused" defaultChecked={item?.status === "paused"} /> Pausado</label>
                </fieldset>

                <div className="rating">
                    <label htmlFor="content-rating">Calificación personal, de 1 a 10 (opcional)</label>
                    <input
                        id="content-rating"
                        name="rating"
                        type="number"
                        min="1"
                        max="10"
                        step="1"
                        defaultValue={item?.rating ?? ""}
                    />
                </div>

                </div>

                {/* PASO 2: detalles según el tipo (Movie o Album) */}
                <div hidden={step !== 1}>

                    {type === "movie" && (
                        <div className="fields">
                            <label htmlFor="movie-duration">Duración (minutos)</label>
                            <input id="movie-duration" name="duration_minutes" type="number" defaultValue={movieData?.duration_minutes ?? ""} />

                            <label htmlFor="movie-year">Año de estreno</label>
                            <input id="movie-year" name="release_year" type="number" defaultValue={movieData?.release_year ?? ""} />

                            <label htmlFor="movie-director">Director</label>
                            <input id="movie-director" name="director" type="text" defaultValue={movieData?.director ?? ""} />
                        </div>
                    )}

                    {type === "music" && (
                        <div className="fields">
                            <label htmlFor="album-artist">Artista</label>
                            <input id="album-artist" name="artist" type="text" defaultValue={albumData?.artist ?? ""} />

                            <label htmlFor="album-year">Año de lanzamiento</label>
                            <input id="album-year" name="release_year" type="number" defaultValue={albumData?.release_year ?? ""} />

                            <label htmlFor="album-tracks">Número de pistas</label>
                            <input id="album-tracks" name="total_tracks" type="number" defaultValue={albumData?.total_tracks ?? ""} />
                        </div>
                    )}

                </div>

                {/* PASO 3: sinopsis y detalles avanzados */}
                <div hidden={step !== 2}>
                    <div className="fields">
                        <label htmlFor="content-synopsis">Sinopsis</label>
                        <textarea id="content-synopsis" name="synopsis" rows="4" defaultValue={item?.synopsis ?? ""} />

                        <label htmlFor="content-external-id">ID externo (TMDB o Spotify)</label>
                        <input id="content-external-id" name="external_id" type="text" defaultValue={item?.external_id ?? ""} />

                        <label htmlFor="content-external-link">Enlace externo</label>
                        <input id="content-external-link" name="external_link" type="url" defaultValue={item?.external_link ?? ""} />
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
                            {saving ? "Guardando..." : isEdit ? "Guardar cambios" : "Guardar en mi librería"}
                        </button>
                    )}
                </div>

            </form>

        </div>

        </div>

        </>

    )

}

export default CreateContentModal;
