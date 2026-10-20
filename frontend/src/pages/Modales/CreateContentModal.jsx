
function CreateContentModal(){

    return(

        <div className="modal" role="dialog" aria-modal="true" aria-labelledby="createContent-title">

            {/* Encabezado */}
            <div className="modal-header">
                <div>
                    <h3 id="createContent-title">Agregar contenido</h3>
                    <p>Busca y guarda el contenido en tu librería.</p>
                </div>
                <button type="button" aria-label="Cerrar">✕</button>
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
                    <img alt="" />
                    <h3>Sube la portada</h3>
                    <p>Arrastra un archivo o haz clic para seleccionar PNG o JPG</p>
                    <button type="button">Seleccionar archivo</button>
                </div>

            </div>


            {/* Columna derecha: formulario */}
            <form className="detallesContenido-Container">
                <h3>Detalles del contenido</h3>

                <div className="coverPreview">
                    <img alt="Vista previa de la portada" />
                    <button type="button" aria-label="Cambiar portada">✎</button>
                </div>

                <div className="fields">
                    <label htmlFor="content-title">Título</label>
                    <input id="content-title" name="title" type="text" />

                    <label htmlFor="content-type">Tipo</label>
                    <select id="content-type" name="type">
                        <option value="movie">Película</option>
                        <option value="music">Música</option>
                    </select>

                    <label htmlFor="content-creator">Artista / Director</label>
                    <input id="content-creator" name="creator" type="text" />

                    <label htmlFor="content-year">Año de lanzamiento</label>
                    <input id="content-year" name="release_year" type="number" />

                    <label htmlFor="content-genre">Género</label>
                    <select id="content-genre" name="genre">
                        <option value="">Selecciona un género</option>
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

                <div className="tags">
                    <label htmlFor="content-tags">Etiquetas</label>
                    <input id="content-tags" name="tags" type="text" placeholder="Agregar etiqueta..." />
                    <ul className="tagList">
                        {/* Etiquetas seleccionadas */}
                    </ul>
                </div>

                <div className="playlists">
                    <label htmlFor="content-playlists">Agregar a playlist(s)</label>
                    <select id="content-playlists" name="playlists" multiple>
                        {/* Playlists disponibles */}
                    </select>
                    <p>
                        Puedes agregar este contenido a una o varias playlists.
                        También se guardará en tu librería.
                    </p>
                </div>

                <div className="modal-actions">
                    <button type="button">Cancelar</button>
                    <button type="submit">Guardar en mi librería</button>
                </div>

            </form>

        </div>


    )

}

export default CreateContentModal;
