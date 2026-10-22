// URL base de la API (backend FastAPI). Se cambia aquí, en un solo lugar.
// Para usar otra, define VITE_API_URL en frontend/.env (ej. VITE_API_URL=https://mi-api.com)
export const API_URL = import.meta.env.VITE_API_URL ?? "http://localhost:8000";

// Devuelve la URL lista para un <img src>:
// - vacía -> null (no hay portada)
// - "http..." (portadas antiguas externas) -> se deja igual
// - "/uploads/..." (portadas subidas al backend) -> se le antepone la URL de la API
export function coverSrc(cover_url) {
    if (!cover_url) return null;
    if (cover_url.startsWith("http")) return cover_url;
    if (cover_url.startsWith("/uploads")) return `${API_URL}${cover_url}`;
    return cover_url;
}
