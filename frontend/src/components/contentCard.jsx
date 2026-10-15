
function ContentCard(props) {
    return (
        <div className="content-card">
            <h3>{props.title}</h3>
            <p>{props.content}</p>
        </div>
    );
}