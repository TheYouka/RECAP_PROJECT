import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import './App.css'
import Home from './pages/Home'
import Library from './pages/Library'
import Playlists from './pages/Playlists'
import PlaylistView from './pages/PlaylistView'

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/library" element={<Library />} />
        <Route path="/playlists" element={<Playlists />} />
        <Route path="/playlist/:slug" element={<PlaylistView />} />
      </Routes>
    </Router>
  )
}

export default App
