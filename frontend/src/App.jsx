import { useState, useEffect } from 'react'
import axios from 'axios'
import LoginPage from './components/LoginPage'
import Dashboard from './components/Dashboard'
import './App.css'

// URL del backend - cambiar en producción
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000'

function App() {
  const [sessionId, setSessionId] = useState(null)
  
  // guardo los datos por período para no repetir peticiones al cambiar de pestaña
  const [artistsCache, setArtistsCache] = useState({
    short_term: null,
    medium_term: null,
    long_term: null
  })
  
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [timeRange, setTimeRange] = useState('short_term')

  useEffect(() => {
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
      window.history.replaceState({}, '', '/')
      loadArtists(sessionIdFromUrl, 'short_term')
    }
  }, [])

  // una vez cargado lo inicial, voy trayendo el resto en segundo plano
  useEffect(() => {
    if (sessionId && artistsCache.short_term) {
      const fetchBackground = async () => {
        setTimeout(async () => {
          if (!artistsCache.medium_term) await loadArtists(sessionId, 'medium_term', true)
          if (!artistsCache.long_term) await loadArtists(sessionId, 'long_term', true)
        }, 1000)
      }
      fetchBackground()
    }
  }, [artistsCache.short_term, sessionId])

  const handleLogin = async () => {
    try {
      setError(null)
      const response = await axios.get(`${API_URL}/login`)
      window.location.href = response.data.auth_url
    } catch (err) {
      console.error('Error al iniciar sesión:', err)
      setError('Error al iniciar sesión. Por favor, intenta de nuevo.')
    }
  }

  const loadArtists = async (session, range, isBackground = false) => {
    if (artistsCache[range]) return

    if (!isBackground) setLoading(true)
    
    setError(null)

    try {
      const response = await axios.get(`${API_URL}/top-artists-gender`, {
        params: { 
          session_id: session,
          time_range: range
        }
      })

      setArtistsCache(prev => ({
        ...prev,
        [range]: response.data.artists
      }))

    } catch (err) {
      console.error(`Error al cargar artistas (${range}):`, err)
      if (!isBackground) {
        setError('Error al cargar tus artistas. Por favor, intenta de nuevo.')
      }
    } finally {
      if (!isBackground) setLoading(false)
    }
  }

  const handleTimeRangeChange = (newRange) => {
    setTimeRange(newRange)
    // por si el usuario cambia antes de que acabe el background fetch
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
