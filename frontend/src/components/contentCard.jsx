const STATUS_LABELS = {
    watching: "Viendo / Escuchando",
    completed: "Completado",
    paused: "En pausa",
    plan_to_watch: "Pendiente",
};

const TYPE_LABELS = {
    movie: "🎬 Película",
    music: "🎵 Música",
};

function ContentCard({ item }) {
    const { title, type, status, synopsis, cover_url, rating, external_link, movie, album } = item;

    // Datos específicos según el tipo
    const creator = type === "movie" ? movie?.director : album?.artist;
    const year = type === "movie" ? movie?.release_year : album?.release_year;

    return (
        <>
            <article className="content-card">
                <div className="content-card__cover">
                    {cover_url ? (
                        <img src={cover_url} alt={`Portada de ${title}`} loading="lazy" />
                    ) : (
                        <div className="content-card__no-cover">Sin portada</div>
                    )}
                    {rating != null && (
                        <span className="content-card__rating">★ {rating}/10</span>
                    )}
                </div>

                <div className="content-card__body">
                    <span className="content-card__type">{TYPE_LABELS[type] ?? type}</span>
                    <h3 className="content-card__title">{title}</h3>

                    {creator && <p className="content-card__meta">{creator}</p>}

                    <p className="content-card__meta">
                        {[
                            year,
                            type === "movie" && movie?.duration_minutes
                                ? `${movie.duration_minutes} min`
                                : null,
                            type === "music" && album?.total_tracks
                                ? `${album.total_tracks} pistas`
                                : null,
                        ]
                            .filter(Boolean)
                            .join(" · ")}
                    </p>

                    <span className="content-card__status">
                        {STATUS_LABELS[status] ?? status}
                    </span>

                    {synopsis && <p className="content-card__synopsis">{synopsis}</p>}

                    {external_link && (
                        <a
                            className="content-card__link"
                            href={external_link}
                            target="_blank"
                            rel="noopener noreferrer"
                        >
                            Ver más
                        </a>
                    )}
                </div>
            </article>

            {/* Estilos provisionales, se reemplazarán con el diseño final */}
            <style>{`
                .content-card {
                    display: flex;
                    flex-direction: column;
                    width: 220px;
                    min-height: 480px;
                    border: 1px solid #ccc;
                    border-radius: 6px;
                    overflow: hidden;
                    text-align: left;
                    background: #fff;
                    color: #222;
                }
                .content-card__cover {
                    position: relative;
                    width: 100%;
                    aspect-ratio: 2 / 3;
                    background: #eee;
                }
                .content-card__cover img {
                    width: 100%;
                    height: 100%;
                    object-fit: cover;
                    display: block;
                }
                .content-card__no-cover {
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    height: 100%;
                    color: #777;
                    font-size: 14px;
                }
                .content-card__rating {
                    position: absolute;
                    top: 6px;
                    right: 6px;
                    padding: 2px 6px;
                    border-radius: 4px;
                    background: rgba(0, 0, 0, 0.75);
                    color: #fff;
                    font-size: 13px;
                }
                .content-card__body {
                    display: flex;
                    flex-direction: column;
                    gap: 4px;
                    padding: 10px;
                }
                .content-card__type {
                    font-size: 12px;
                    color: #666;
                }
                .content-card__title {
                    margin: 0;
                    font-size: 16px;
                    line-height: 1.2;
                    color: #111;
                }
                .content-card__meta {
                    margin: 0;
                    font-size: 13px;
                    color: #555;
                }
                .content-card__status {
                    align-self: flex-start;
                    padding: 1px 6px;
                    border: 1px solid #999;
                    border-radius: 4px;
                    font-size: 12px;
                }
                .content-card__synopsis {
                    margin: 4px 0 0;
                    font-size: 12px;
                    line-height: 1.3;
                    color: #444;
                    display: -webkit-box;
                    -webkit-line-clamp: 4;
                    -webkit-box-orient: vertical;
                    overflow: hidden;
                }
                .content-card__link {
                    font-size: 12px;
                }
            `}</style>
        </>
    );
}

export default ContentCard;
