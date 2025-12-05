import { useState, useEffect } from 'react'
import axios from 'axios'
import LoginPage from './components/LoginPage'
import Dashboard from './components/Dashboard'
import './App.css'

// URL del backend - cambiar en producción
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000'

function App() {
  const [sessionId, setSessionId] = useState(null)
  const [artists, setArtists] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  useEffect(() => {
    // Verificar si hay un session_id en la URL (después del callback)
    const params = new URLSearchParams(window.location.search)
    const sessionIdFromUrl = params.get('session_id')
    const errorFromUrl = params.get('error')

    if (errorFromUrl) {
      setError(`Error de autenticación: ${errorFromUrl}`)
      window.history.replaceState({}, '', '/')
      return
    }

    if (sessionIdFromUrl) {
      setSessionId(sessionIdFromUrl)
      // Limpiar la URL
      window.history.replaceState({}, '', '/')
      // Cargar artistas
      loadArtists(sessionIdFromUrl)
    }
  }, [])

  const handleLogin = async () => {
    try {
      setError(null)
      const response = await axios.get(`${API_URL}/login`)
      // Redirigir a la URL de autorización de Spotify
      window.location.href = response.data.auth_url
    } catch (err) {
      console.error('Error al iniciar sesión:', err)
      setError('Error al iniciar sesión. Por favor, intenta de nuevo.')
    }
  }

  const loadArtists = async (session) => {
    setLoading(true)
    setError(null)

    try {
      const response = await axios.get(`${API_URL}/top-artists-gender`, {
        params: { session_id: session }
      })

      setArtists(response.data.artists)
    } catch (err) {
      console.error('Error al cargar artistas:', err)
      setError('Error al cargar tus artistas. Por favor, intenta de nuevo.')
      setSessionId(null)
    } finally {
      setLoading(false)
    }
  }

  const handleLogout = () => {
    setSessionId(null)
    setArtists([])
    setError(null)
  }

  if (loading) {
    return (
      <div className="loading-container">
        <div className="spinner"></div>
        <p>Analizando tus artistas favoritos...</p>
      </div>
    )
  }

  if (!sessionId) {
    return <LoginPage onLogin={handleLogin} error={error} />
  }

  return <Dashboard artists={artists} onLogout={handleLogout} />
}

export default App
