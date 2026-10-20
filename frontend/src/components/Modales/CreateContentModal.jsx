import { useState, useRef, useEffect } from "react";

const ACCEPTED_IMAGE_TYPES = ["image/png", "image/jpeg"];

function CreateContentModal({ onClose }){

    const fileInputRef = useRef(null);          // referencia al <input type="file"> oculto
    const [coverFile, setCoverFile] = useState(null);       // archivo elegido (para enviarlo después)
    const [coverPreview, setCoverPreview] = useState(null); // URL temporal para mostrar la imagen

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
                    <li>
                        <h3>Selecciona el contenido</h3>
                        <p>Elige un álbum de tu dispositivo.</p>
                    </li>
                    <li>
                        <h3>Configura y guarda</h3>
                        <p>Añade detalles y elige en qué playlist(s) guardarlo.</p>
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
            <form className="detallesContenido-Container">
                <h3>Detalles del contenido</h3>

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
                    <select id="content-type" name="type">
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

                <hr />


                <div className="modal-actions">
                    <button type="button" onClick={onClose}>Cancelar</button>
                    <button type="submit">Guardar en mi librería</button>
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
