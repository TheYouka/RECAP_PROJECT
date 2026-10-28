
function TagCard({item, selected = false, onSelectChange}){
    const {name, color} = item;


    return(

        <div className="tag-card">
            {/* Casilla para seleccionar el tag (esquina superior derecha) */}
            <input
                type="checkbox"
                className="tag-select"
                aria-label={`Seleccionar ${name}`}
                checked={selected}
                onChange={() => onSelectChange?.(item.id)}
            />

            {/* Círculo con el color del tag; si no tiene color (null) se usa un gris */}
            <span
                className="tag-dot"
                style={{ backgroundColor: color ?? "#9ca3af" }}
                aria-hidden="true"
            >
                {/* Icono de etiqueta */}
                <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M20.6 13.4 13.4 20.6a2 2 0 0 1-2.8 0L3 13V3h10l7.6 7.6a2 2 0 0 1 0 2.8Z" />
                    <circle cx="7.5" cy="7.5" r="1" fill="currentColor" />
                </svg>
            </span>

            <div className="tag-info">
                <h3>{name}</h3>
            </div>

            

        </div>

    );

};

export default TagCard;
