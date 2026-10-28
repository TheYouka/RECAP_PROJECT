import { useState } from "react";
import { API_URL } from "../../api";
import "../../css/update-tag-modal.css";

// Colores predefinidos (hexadecimal de 6 dígitos, como pide el backend)
const PRESET_COLORS = [
    "#ef4444", "#f97316", "#facc15", "#22c55e", "#2dd4bf",
    "#06b6d4", "#3b82f6", "#a78bfa", "#f472b6", "#64748b",
];

// Mismo formato que valida el backend: "#" + 6 dígitos hexadecimales
const isValidHex = (value) => /^#[0-9a-fA-F]{6}$/.test(value);

// Modal para editar un tag: guarda con PATCH /tags/{id}
function UpdateTagModal({ item, onClose, onSaved }) {
    // El color vive en un estado porque lo cambian tres controles a la vez:
    // los predefinidos, el selector y el campo de texto hexadecimal
    const [color, setColor] = useState(item?.color ?? "#9ca3af");
    const [saving, setSaving] = useState(false);
    const [saveError, setSaveError] = useState(null);

    const handleSubmit = async (event) => {
        event.preventDefault();               // evita que la página se recargue
        setSaveError(null);

        const data = new FormData(event.target);
        const name = data.get("name").trim();

        if (!name) {
            setSaveError("El nombre del tag no puede estar vacío.");
            return;
        }
        if (!isValidHex(color)) {
            setSaveError("El color debe tener el formato #RRGGBB.");
            return;
        }

        try {
            setSaving(true);

            const response = await fetch(`${API_URL}/tags/${item.id}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ name, color: color.toLowerCase() }),
            });

            if (!response.ok) {
                // El backend explica el motivo en "detail" (ej. "Ya existe un tag con ese nombre")
                const errorBody = await response.json().catch(() => null);
                const detail = typeof errorBody?.detail === "string" ? errorBody.detail : null;
                throw new Error(detail ?? `Error HTTP: ${response.status}`);
            }

            await onSaved?.();                // el padre recarga la lista de tags
            onClose();
        } catch (err) {
            console.error("Error al actualizar el tag:", err);

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

    return (
        // Clic en el fondo oscuro cierra el modal
        <div className="tag-modal-overlay" onClick={onClose}>

            <div
                className="tag-modal"
                role="dialog"
                aria-modal="true"
                aria-labelledby="updateTag-title"
                onClick={(event) => event.stopPropagation()}
            >

                {/* Encabezado */}
                <div className="tag-modal-header">
                    <span className="tag-modal-icon" aria-hidden="true"></span>
                    <div>
                        <h3 id="updateTag-title">Editar tag</h3>
                        <p>Modifica el nombre y el color de tu tag.</p>
                    </div>
                    <button type="button" aria-label="Cerrar" onClick={onClose}>✕</button>
                </div>

                <form onSubmit={handleSubmit}>
                    {/* ID: solo lectura */}
                    <label htmlFor="tag-id">ID del tag</label>
                    <div>
                        <input id="tag-id" type="text" value={item?.id ?? ""} readOnly />
                        <button type="button" aria-label="Copiar ID">⧉</button>
                    </div>

                    {/* Nombre */}
                    <label htmlFor="tag-edit-name">Nombre</label>
                    <input
                        id="tag-edit-name"
                        name="name"
                        type="text"
                        maxLength={50}
                        required
                        defaultValue={item?.name ?? ""}
                    />

                    {/* Color */}
                    <fieldset>
                        <legend>Color</legend>

                        <p>Colores predefinidos</p>
                        <div className="tag-modal-presets">
                            {PRESET_COLORS.map((preset) => (
                                <label key={preset}>
                                    <input
                                        type="radio"
                                        name="preset_color"
                                        value={preset}
                                        checked={color.toLowerCase() === preset}
                                        onChange={() => setColor(preset)}
                                        aria-label={preset}
                                    />
                                    <span
                                        className="tag-modal-swatch"
                                        style={{ backgroundColor: preset }}
                                    ></span>
                                </label>
                            ))}
                        </div>

                        <p>O elegir un color personalizado</p>
                        <input
                            type="color"
                            // El selector solo acepta "#rrggbb"; mientras se escribe un hex incompleto se muestra negro
                            value={isValidHex(color) ? color.toLowerCase() : "#000000"}
                            onChange={(event) => setColor(event.target.value)}
                            aria-label="Color personalizado"
                        />
                        <input
                            type="text"
                            value={color.toUpperCase()}
                            onChange={(event) => setColor(event.target.value)}
                            maxLength={7}
                            aria-label="Código hexadecimal del color"
                        />
                    </fieldset>

                    {/* Aviso */}
                    <div className="tag-modal-note">
                        <p><strong>El ID del tag no se puede modificar.</strong></p>
                        <p>Se muestra solo como referencia.</p>
                    </div>

                    {/* Mensaje de error (solo aparece si saveError tiene texto) */}
                    {saveError && <p role="alert">{saveError}</p>}

                    {/* Acciones */}
                    <div className="tag-modal-actions">
                        {/* Cancelar cierra sin guardar: lo escrito se descarta al desmontarse el modal */}
                        <button type="button" onClick={onClose}>Cancelar</button>
                        <button type="submit" disabled={saving}>
                            {saving ? "Guardando..." : "Guardar cambios"}
                        </button>
                    </div>
                </form>

            </div>

        </div>
    );
}

export default UpdateTagModal;
