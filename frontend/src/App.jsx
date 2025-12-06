import { useState, useEffect } from 'react'
import axios from 'axios'
import LoginPage from './components/LoginPage'
import Dashboard from './components/Dashboard'
import './App.css'

// URL del backend - cambiar en producción
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000'

function App() {
  const [sessionId, setSessionId] = useState(null)
  const [artistsCache, setArtistsCache] = useState({
    short_term: null,
    medium_term: null,
    long_term: null
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [timeRange, setTimeRange] = useState('short_term')

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
      // Cargar artistas iniciales (short_term)
      loadArtists(sessionIdFromUrl, 'short_term')
    }
  }, [])

  // Efecto para cargar en segundo plano eliminado a petición del usuario

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

  const loadArtists = async (session, range) => {
    // Si ya tenemos datos en caché, no hacemos nada
    if (artistsCache[range]) {
      console.log(`[Cache] Using cached data for ${range}`)
      return
    }

    console.log(`[API] Fetching data for ${range}...`)
    setLoading(true)
    setError(null)

    try {
      const response = await axios.get(`${API_URL}/top-artists-gender`, {
        params: { 
          session_id: session,
          time_range: range
        }
      })

      console.log(`[API] Success: ${response.data.artists.length} artists loaded for ${range}`)
      
      setArtistsCache(prev => ({
        ...prev,
        [range]: response.data.artists
      }))

    } catch (err) {
      console.error(`Error al cargar artistas (${range}):`, err)
      setError('Error al cargar tus artistas. Por favor, intenta de nuevo.')
    } finally {
      setLoading(false)
    }
  }

  const handleTimeRangeChange = (newRange) => {
    setTimeRange(newRange)
    // Si no está en caché, cargamos. Si está, el cambio de estado timeRange actualizará la vista instantáneamente
    if (!artistsCache[newRange]) {
      loadArtists(sessionId, newRange)
    }
  }

  const handleLogout = () => {
    setSessionId(null)
    setArtistsCache({
      short_term: null,
      medium_term: null,
      long_term: null
    })
    setError(null)
    setTimeRange('short_term')
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

  // Obtenemos los artistas del caché según el rango seleccionado
  // Si aún no están cargados (background fetch en proceso), mostramos array vacío o loading local
  const currentArtists = artistsCache[timeRange] || []

  return (
    <Dashboard 
      artists={currentArtists} 
      onLogout={handleLogout}
      timeRange={timeRange}
      onTimeRangeChange={handleTimeRangeChange}
    />
  )
}

export default App
