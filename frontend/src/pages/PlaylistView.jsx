import { useParams } from "react-router-dom";
import Navbar from "../components/navbar";
import Sidebar from "../components/sidebar";

function PlaylistView() {
    const { slug } = useParams();

    return (
        <>
            <Navbar />
            <Sidebar />
            
            <h2>{slug}</h2>
        </>
    );
}

export default PlaylistView;