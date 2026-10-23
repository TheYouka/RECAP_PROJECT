import { coverSrc } from "../api";
import "../css/content-card.css";

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

function ContentCard({ item, onBookmarkClick, selected = false, onSelectChange }) {
    const { title, type, status, synopsis, cover_url, rating, external_link, movie, album, bookmark } = item;

    // Datos específicos según el tipo
    const creator = type === "movie" ? movie?.director : album?.artist;
    const year = type === "movie" ? movie?.release_year : album?.release_year;

    return (
        <>
            <article className="content-card">
                <div className="content-card__cover">
                    {cover_url ? (
                        <img src={coverSrc(cover_url)} alt={`Portada de ${title}`} loading="lazy" />
                    ) : (
                        <div className="content-card__no-cover">Sin portada</div>
                    )}
                    <input
                        type="checkbox"
                        className="content-card__select"
                        checked={selected}
                        onChange={() => onSelectChange?.(item.id)}
                        aria-label={`Seleccionar ${title}`}
                    />
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

                    {type === "movie" && bookmark && (
                        <p className="content-card__meta">Separador: {bookmark.position}</p>
                    )}

                    {type === "movie" && (
                        <button
                            type="button"
                            className="content-card__bookmark-btn"
                            onClick={() => onBookmarkClick?.(item)}
                        >
                            {bookmark ? "Editar separador" : "Separador"}
                        </button>
                    )}

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

        </>
    );
}

export default ContentCard;
