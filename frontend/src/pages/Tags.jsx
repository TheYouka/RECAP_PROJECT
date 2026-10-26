import { useState } from "react";
import Navbar from "../components/navbar";
import Sidebar from "../components/sidebar";
import { API_URL } from "../api";

function Tags(){

    const [saving, setSaving] = useState(false);
    const [saveError, setSaveError] = useState(null);

    // async porque dentro usamos await (esperar la respuesta del servidor)
    const onHandleSubmit = async (event) => {
        event.preventDefault();               // evita que la página se recargue
        setSaveError(null);                   // limpia el error del intento anterior

        const form = event.target;            // event.target es el <form>
        const data = new FormData(form);

        const name = data.get("name");        // busca el input con name="name"
        const color = data.get("color");      // busca el input con name="color"

        const payload = {
            name : name,
            color : color
        };
        
        try{
            setSaving(true);
            const url = `${API_URL}/tags/`;
            
            const response = await fetch(url, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload),
            });

            if(!response.ok){
                // El backend explica el motivo en "detail" (ej. "Ya existe un tag con ese nombre")
                const errorBody = await response.json().catch(() => null);
                const detail = typeof errorBody?.detail === "string" ? errorBody.detail : null;
                throw new Error(detail ?? `Error HTTP: ${response.status}`);
            };

            const created = await response.json();   // el tag recién creado (id, name, color)
            console.log("Tag creado:", created);

            form.reset();                             // limpia el formulario
            // más adelante: mostrar el aviso "Tag creado" y refrescar la lista

        }
        catch(err){
            console.error("Error al crear el tag:", err);

            if (err instanceof TypeError) {
                // fetch falló antes de recibir respuesta: backend apagado o sin red
                setSaveError("No se pudo conectar con el servidor.");
            } else {
                setSaveError(err.message);            // ej. "Ya existe un tag con ese nombre"
            }
        }
        finally{
            setSaving(false);                         // siempre se ejecuta, salga bien o mal
        }


    };



    return (
        <>
        <Navbar/>
        <Sidebar/>

        {/* ---------- Parte de arriba: título + crear tag + ejemplos ---------- */}
        <div className="top-Container">

            <h1>Tags</h1>
            <p>Organiza tu contenido con etiquetas. Crea, edita y gestiona tus tags</p>
            
            {/* Formulario para crear un tag nuevo */}
            <div className="creator-Container">

                {/* Cuadro del icono (por ahora vacío, el icono va después) */}
                <span className="creator-icon" aria-hidden="true"></span>

                <div className="creator-body">
                    <h2>Crear nuevo tag</h2>
                    <p>Dale un nombre a tu etiqueta y empieza a organizar tu contenido.</p>

                    <form className="creator-form" onSubmit={onHandleSubmit}>
                        <label htmlFor="tag-name">Nombre del tag</label>
                        <input
                            id="tag-name"
                            type="text"
                            name="name"
                            placeholder="Nombre del tag..."
                            maxLength={50}
                            required
                        />

                        <label htmlFor="tag-color">Color</label>
                        <input id="tag-color" type="color" name="color" />

                        {/* disabled mientras se guarda, para no enviar dos veces */}
                        <button type="submit" disabled={saving}>
                            {saving ? "Creando..." : "+ Crear tag"}
                        </button>

                        {/* Mensaje de error (solo aparece si saveError tiene texto) */}
                        {saveError && <p role="alert">{saveError}</p>}
                    </form>
                </div>

            </div>

            {/* Tags de ejemplo para empezar rápido */}
            <div className="tagsTemplates">

                <h3>Ejemplos</h3>
                <p>Puedes usar estos tags o crear los tuyos propios.</p>

                <ul className="templates-list">
                    <li><button type="button">Drama</button></li>
                    <li><button type="button">Comedia</button></li>
                    <li><button type="button">Acción</button></li>
                    <li><button type="button">Terror</button></li>
                    <li><button type="button">Ciencia ficción</button></li>
                    <li><button type="button">Romance</button></li>
                    <li><button type="button">Musical</button></li>
                    <li><button type="button">Documental</button></li>
                </ul>

            </div>


        </div>


        {/* ---------- Parte de abajo: lista de tags ---------- */}
        <div className="content-Container">

            <h2>Mis tags</h2>

            {/* Barra de herramientas: filtros, orden y tipo de vista */}
            <div className="tags-toolbar">


                <div className="tags-sort">
                    <label htmlFor="tags-sort-select">Ordenar por:</label>
                    <select id="tags-sort-select" name="sort">
                        <option value="name-asc">Nombre (A → Z)</option>
                        <option value="name-desc">Nombre (Z → A)</option>
                        <option value="count-desc">Más usados</option>
                    </select>
                </div>

                <div className="tags-view" role="group" aria-label="Tipo de vista">
                    <button type="button" aria-pressed="true">Cuadrícula</button>
                    <button type="button" aria-pressed="false">Lista</button>
                </div>

                <div className="tags-Container">
                    
                </div>


            </div>


                

        </div>


        </>
    )

};


export default Tags;
