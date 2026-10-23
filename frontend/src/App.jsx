import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import Home from './pages/Home'
import Library from './pages/Library'
import Playlists from './pages/Playlists'
import PlaylistView from './pages/PlaylistView'
import Tags from './pages/tags'

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/library" element={<Library />} />
        <Route path="/playlists" element={<Playlists />} />
        <Route path="/playlist/:slug" element={<PlaylistView />} />
        <Route path="/tags" element={<Tags/>} />
      </Routes>
    </Router>
  )
}

export default App
