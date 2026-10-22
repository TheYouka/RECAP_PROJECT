import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import Navbar from "../components/navbar";
import Sidebar from "../components/sidebar";
import ContentCard from "../components/contentCard";
import { API_URL } from "../api";

const SEVEN_DAYS_IN_MILLISECONDS = 7 * 24 * 60 * 60 * 1000;

function parseCreatedAt(value) {
    const timestamp = /(?:Z|[+-]\d{2}:?\d{2})$/.test(value) ? value : `${value}Z`;
    return new Date(timestamp).getTime();
}

function PlaylistView() {
    const { slug } = useParams();
    const [recentContent, setRecentContent] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    useEffect(() => {
        if (slug !== "recien-añadidas") {
            return;
        }

        async function fetchRecentContent() {
            setLoading(true);
            setError(null);

            try {
                const response = await fetch(`${API_URL}/content`);
                if (!response.ok) {
                    throw new Error("No se pudo cargar el contenido");
                }

                const content = await response.json();
                const now = Date.now();
                const cutoff = now - SEVEN_DAYS_IN_MILLISECONDS;
                setRecentContent(
                    content.filter((item) => {
                        const createdAt = parseCreatedAt(item.created_at);
                        return createdAt > cutoff && createdAt <= now;
                    }),
                );
            } catch (fetchError) {
                setError(fetchError.message);
            } finally {
                setLoading(false);
            }
        }

        fetchRecentContent();
    }, [slug]);

    return (
        <>
            <Navbar />
            <Sidebar />

            {slug === "recien-añadidas" ? (
                <>
                    <h2>{slug}</h2>
                    {loading && <p>Cargando contenido...</p>}
                    {error && <p>{error}</p>}
                    {!loading && !error && (
                        <div className="content-container">
                            {recentContent.length > 0 ? (
                                recentContent.map((item) => (
                                    <ContentCard key={item.id} item={item} />
                                ))
                            ) : (
                                <p>No hay contenido añadido recientemente.</p>
                            )}
                        </div>
                    )}
                </>
            ) : (
                <h2>{slug}</h2>
            )}
        </>
    );
}

export default PlaylistView;
