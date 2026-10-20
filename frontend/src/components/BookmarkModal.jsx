import { useState, useEffect, useRef } from "react";

const API_URL = "http://localhost:8000";

// Extrae el mensaje de error de la API (`detail` puede ser string o lista de FastAPI)
const getErrorMessage = async (response) => {
    try {
        const data = await response.json();
        if (typeof data.detail === "string") return data.detail;
        if (Array.isArray(data.detail)) return data.detail.map((d) => d.msg).join(", ");
    } catch {
        // la respuesta no tenía JSON
    }
    return `Error HTTP: ${response.status}`;
};

function BookmarkModal({ item, onClose, onSaved }) {
    const existing = item.bookmark;
    const [position, setPosition] = useState(existing?.position ?? "");
    const [recapText, setRecapText] = useState(existing?.recap_text ?? "");
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState(null);
    const positionRef = useRef(null);

    useEffect(() => {
        positionRef.current?.focus();
    }, []);

    useEffect(() => {
        const handleKeyDown = (event) => {
            if (event.key === "Escape" && !saving) onClose();
        };
        document.addEventListener("keydown", handleKeyDown);
        return () => document.removeEventListener("keydown", handleKeyDown);
    }, [onClose, saving]);

    const request = async (method, body) => {
        setSaving(true);
        setError(null);
        try {
            const response = await fetch(`${API_URL}/content/${item.id}/bookmark`, {
                method,
                headers: body ? { "Content-Type": "application/json" } : undefined,
                body: body ? JSON.stringify(body) : undefined,
            });
            if (!response.ok) {
                setError(await getErrorMessage(response));
                setSaving(false);
                return;
            }
            onSaved();
        } catch {
            setError("No se pudo conectar con el servidor");
            setSaving(false);
        }
    };

    const handleSubmit = (event) => {
        event.preventDefault();
        request(existing ? "PATCH" : "POST", {
            position: position.trim(),
            recap_text: recapText,
            recap_source: "manual",
        });
    };

    const handleDelete = () => {
        if (window.confirm("¿Eliminar el separador de este contenido?")) {
            request("DELETE");
        }
    };

    return (
        <>
            <div
                className="bookmark-modal__backdrop"
                onMouseDown={(event) => {
                    if (event.target === event.currentTarget && !saving) onClose();
                }}
            >
                <div
                    className="bookmark-modal"
                    role="dialog"
                    aria-modal="true"
                    aria-labelledby="bookmark-modal-title"
                >
                    <h2 id="bookmark-modal-title" className="bookmark-modal__title">
                        {existing ? "Editar separador" : "Nuevo separador"}
                    </h2>
                    <p className="bookmark-modal__subtitle">{item.title}</p>

                    <form onSubmit={handleSubmit}>
                        <label className="bookmark-modal__field">
                            Posición
                            <input
                                ref={positionRef}
                                type="text"
                                value={position}
                                onChange={(e) => setPosition(e.target.value)}
                                placeholder="Ej: 1:12:30 o minuto 45"
                                required
                            />
                        </label>

                        <label className="bookmark-modal__field">
                            Resumen (opcional)
                            <textarea
                                rows={5}
                                value={recapText}
                                onChange={(e) => setRecapText(e.target.value)}
                            />
                        </label>

                        {error && (
                            <p className="bookmark-modal__error" role="alert">
                                {error}
                            </p>
                        )}

                        <div className="bookmark-modal__actions">
                            {existing && (
                                <button
                                    type="button"
                                    onClick={handleDelete}
                                    disabled={saving}
                                    className="bookmark-modal__delete"
                                >
                                    Eliminar separador
                                </button>
                            )}
                            <button type="button" onClick={onClose} disabled={saving}>
                                Cancelar
                            </button>
                            <button type="submit" disabled={saving}>
                                {saving ? "Guardando..." : "Guardar"}
                            </button>
                        </div>
                    </form>
                </div>
            </div>

            {/* Estilos provisionales, se reemplazarán con el diseño final */}
            <style>{`
                .bookmark-modal__backdrop {
                    position: fixed;
                    inset: 0;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    background: rgba(0, 0, 0, 0.6);
                    z-index: 1000;
                }
                .bookmark-modal {
                    width: 420px;
                    max-width: 90vw;
                    padding: 16px;
                    border-radius: 6px;
                    background: #fff;
                    color: #222;
                    text-align: left;
                }
                .bookmark-modal__title {
                    margin: 0;
                    font-size: 20px;
                }
                .bookmark-modal__subtitle {
                    margin: 4px 0 12px;
                    color: #555;
                }
                .bookmark-modal__field {
                    display: flex;
                    flex-direction: column;
                    gap: 4px;
                    margin-bottom: 12px;
                    font-size: 14px;
                }
                .bookmark-modal__error {
                    margin: 0 0 12px;
                    color: #b00020;
                    font-size: 14px;
                }
                .bookmark-modal__actions {
                    display: flex;
                    justify-content: flex-end;
                    gap: 8px;
                }
                .bookmark-modal__delete {
                    margin-right: auto;
                    color: #b00020;
                }
            `}</style>
        </>
    );
}

export default BookmarkModal;
