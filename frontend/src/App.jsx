/**
 * Componente Principal de la Aplicación.
 * 
 * Aquí gestionamos el estado global: autenticación y datos de artistas.
 * Implemento una estrategia de "Waterfall Loading" para mejorar la UX:
 * 1. Cargamos rápido lo esencial (últimas 4 semanas).
 * 2. Una vez el usuario ya está interactuando, cargamos en segundo plano 
 *    los datos históricos (6 meses y 1 año) para que la navegación sea instantánea.
 */
import { useState, useEffect } from 'react'
import axios from 'axios'
import LoginPage from './components/LoginPage'
import Dashboard from './components/Dashboard'
import './App.css'

// URL del backend - cambiar en producción
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000'

function App() {
  const [sessionId, setSessionId] = useState(null)
  
  // Cache local para evitar llamadas innecesarias a la API.
  // Si ya bajamos "medium_term", no lo volvemos a pedir aunque el usuario cambie de pestaña.
  const [artistsCache, setArtistsCache] = useState({
    short_term: null,
    medium_term: null,
    long_term: null
  })
  
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [timeRange, setTimeRange] = useState('short_term')

  useEffect(() => {
    // Lógica de recuperación de sesión post-OAuth.
    // Buscamos el session_id que nos devuelve el backend en la URL.
    const params = new URLSearchParams(window.location.search)
    const sessionIdFromUrl = params.get('session_id')
    const errorFromUrl = params.get('error')

    if (errorFromUrl) {
      setError(`Error de autenticación: ${errorFromUrl}`)
      window.history.replaceState({}, '', '/') // Limpiamos URL por seguridad
      return
    }

    if (sessionIdFromUrl) {
      setSessionId(sessionIdFromUrl)
      window.history.replaceState({}, '', '/')
      // Carga inicial crítica: Solo lo que el usuario va a ver inmediatamente.
      loadArtists(sessionIdFromUrl, 'short_term')
    }
  }, [])

  // Estrategia de carga en segundo plano (Background Fetching)
  // En cuanto tenemos los datos iniciales, empezamos a traer silenciosamente el resto.
  useEffect(() => {
    if (sessionId && artistsCache.short_term) {
      const fetchBackground = async () => {
        // Pequeño delay para no saturar la red/CPU durante el renderizado inicial del Dashboard
        setTimeout(async () => {
          if (!artistsCache.medium_term) {
            console.log('[Background] Anticipando carga de medium_term...')
            await loadArtists(sessionId, 'medium_term', true)
          }
          if (!artistsCache.long_term) {
            console.log('[Background] Anticipando carga de long_term...')
            await loadArtists(sessionId, 'long_term', true)
          }
        }, 1000)
      }
      fetchBackground()
    }
  }, [artistsCache.short_term, sessionId])

  const handleLogin = async () => {
    try {
      setError(null)
      // Iniciamos el flujo OAuth pidiendo la URL al backend
      const response = await axios.get(`${API_URL}/login`)
      window.location.href = response.data.auth_url
    } catch (err) {
      console.error('Error al iniciar sesión:', err)
      setError('Error al iniciar sesión. Por favor, intenta de nuevo.')
    }
  }

  const loadArtists = async (session, range, isBackground = false) => {
    // Si ya lo tenemos en memoria, ahorramos la petición. Eficiencia pura.
    if (artistsCache[range]) {
      console.log(`[Cache] Usando datos cacheados para ${range}`)
      return
    }

    // Si es background, no mostramos spinner para no interrumpir al usuario.
    if (!isBackground) {
      console.log(`[API] Solicitando datos para ${range}...`)
      setLoading(true)
    }
    
    setError(null)

    try {
      const response = await axios.get(`${API_URL}/top-artists-gender`, {
        params: { 
          session_id: session,
          time_range: range
        }
      })

      console.log(`[API] Éxito: ${response.data.artists.length} artistas recibidos (${range})`)
      
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
    // Fallback: Si el usuario es muy rápido y el background fetch no acabó,
    // forzamos la carga con loading indicator aquí.
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

  // Renderizamos el dashboard con los datos del caché actual.
  // Si no hay datos (ej. fallo raro), pasamos array vacío.
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
