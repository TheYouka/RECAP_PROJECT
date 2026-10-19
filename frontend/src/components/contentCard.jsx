
function ContentCard(props) {
    return (
        <div className="content-card">
            <h3>{props.title}</h3>
            <p>{props.content}</p>
            <style>{`
                .content-card {
                    background: white;
                    border-radius: 8px;
                    padding: 16px;
                    box-shadow: 0 2px 8px rgba(0,0,0,0.1);
                    transition: transform 0.2s, box-shadow 0.2s;
                    border: 1px solid #e0e0e0;
                    height: 150px;
                    overflow: hidden;
                    display: flex;
                    flex-direction: column;
                }
                .content-card:hover {
                    transform: translateY(-4px);
                    box-shadow: 0 4px 12px rgba(0,0,0,0.15);
                }
                .content-card h3 {
                    margin: 0 0 8px 0;
                    font-size: 16px;
                    color: #333;
                    overflow: hidden;
                    text-overflow: ellipsis;
                    white-space: nowrap;
                }
                .content-card p {
                    margin: 0;
                    font-size: 14px;
                    color: #666;
                    flex-grow: 1;
                    display: -webkit-box;
                    -webkit-line-clamp: 3;
                    -webkit-box-orient: vertical;
                    overflow: hidden;
                }
            `}</style>
        </div>
    );
};

export default ContentCard;