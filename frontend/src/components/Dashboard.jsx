import { useState, useMemo } from 'react'
import { LogOut, Filter, Music2, Users, TrendingUp, Calendar, MessageCircle } from 'lucide-react'
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts'
import ArtistCard from './ArtistCard'
import './Dashboard.css'

function Dashboard({ artists, onLogout, timeRange, onTimeRangeChange }) {
  const [filter, setFilter] = useState('all') // all, male, female, unknown

  const timeRangeLabels = {
    'short_term': 'Últimas 4 semanas',
    'medium_term': 'Últimos 6 meses',
    'long_term': 'Último año'
  }

  // Calcular estadísticas
  const stats = useMemo(() => {
    const total = artists.length
    const male = artists.filter(a => a.gender === 'male').length
    const female = artists.filter(a => a.gender === 'female').length
    const unknown = artists.filter(a => a.gender === 'unknown').length

    return {
      total,
      male,
      female,
      unknown,
      malePercentage: total > 0 ? ((male / total) * 100).toFixed(1) : 0,
      femalePercentage: total > 0 ? ((female / total) * 100).toFixed(1) : 0,
      unknownPercentage: total > 0 ? ((unknown / total) * 100).toFixed(1) : 0
    }
  }, [artists])

  // Mensajes graciosos según porcentaje
  const sassyMessage = useMemo(() => {
    const pct = parseFloat(stats.femalePercentage)
    
    if (pct < 1) return { text: "🚩 ¿Tienes alergia a las mujeres? Literalmente 0%.", type: "bad" }
    if (pct < 10) return { text: "Madre mía... Tu playlist es un campo de nabos. 🌭", type: "bad" }
    if (pct < 20) return { text: "Huele a cerrado aquí. Necesitas ventilar tu Spotify con voces femeninas. 💨", type: "bad" }
    if (pct < 30) return { text: "Flojito, flojito. Hay margen de mejora, eh. 👀", type: "neutral" }
    if (pct < 40) return { text: "Te acercas a la paridad, pero te falta un empujón. 👉", type: "neutral" }
    if (pct < 50) return { text: "Ni tan mal. Casi equilibrado. 🤷‍♂️", type: "good" }
    if (pct < 60) return { text: "¡Equilibrio perfecto! Thanos estaría orgulloso. ⚖️", type: "good" }
    if (pct < 70) return { text: "El gusto se nota. Buena presencia femenina. 👌", type: "good" }
    if (pct < 80) return { text: "Tu Spotify es territorio de reinas. 👑", type: "excellent" }
    return { text: "Devoraste. Puro girl power aquí. 💅", type: "excellent" }
  }, [stats.femalePercentage])

  // Filtrar artistas
  const filteredArtists = useMemo(() => {
    if (filter === 'all') return artists
    return artists.filter(artist => artist.gender === filter)
  }, [artists, filter])

  const chartData = [
    { name: 'Masculino', value: stats.male, color: '#3B82F6', gradient: 'url(#maleGradient)' },
    { name: 'Femenino', value: stats.female, color: '#EC4899', gradient: 'url(#femaleGradient)' },
    { name: 'Desconocido', value: stats.unknown, color: '#6B7280', gradient: 'url(#unknownGradient)' }
  ].filter(item => item.value > 0)

  const renderCustomLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent }) => {
    const RADIAN = Math.PI / 180
    const radius = innerRadius + (outerRadius - innerRadius) * 0.5
    const x = cx + radius * Math.cos(-midAngle * RADIAN)
    const y = cy + radius * Math.sin(-midAngle * RADIAN)

    return (
      <text
        x={x}
        y={y}
        fill="white"
        textAnchor="middle"
        dominantBaseline="central"
        style={{
          fontSize: '16px',
          fontWeight: 'bold',
          textShadow: '0px 0px 4px rgba(0,0,0,0.6)'
        }}
      >
        {`${(percent * 100).toFixed(0)}%`}
      </text>
    )
  }

  return (
    <div className="dashboard">
      <header className="dashboard-header">
        <div className="header-content">
          <div className="header-left">
            <Music2 size={32} className="header-icon" />
            <div>
              <h1>Tu Análisis de Género</h1>
              <p className="subtitle">
                <Calendar size={14} style={{ marginRight: '6px', verticalAlign: 'text-bottom' }} />
                Top {artists.length} artistas · {timeRangeLabels[timeRange]}
              </p>
            </div>
          </div>
          
          <div className="header-controls">
            <div className="time-range-selector">
              <button 
                className={timeRange === 'short_term' ? 'active' : ''}
                onClick={() => onTimeRangeChange('short_term')}
                title="Últimas 4 semanas"
              >
                4 Semanas
              </button>
              <button 
                className={timeRange === 'medium_term' ? 'active' : ''}
                onClick={() => onTimeRangeChange('medium_term')}
                title="Últimos 6 meses"
              >
                6 Meses
              </button>
              <button 
                className={timeRange === 'long_term' ? 'active' : ''}
                onClick={() => onTimeRangeChange('long_term')}
                title="Último año"
              >
                1 Año
              </button>
            </div>

            <button onClick={onLogout} className="logout-btn">
              <LogOut size={20} />
              Cerrar sesión
            </button>
          </div>
        </div>
      </header>

      <div className="dashboard-content">
        <div className="stats-section">
          <div className="stats-cards">
            <div className="stat-card total">
              <div className="stat-icon-wrapper">
                <Users size={24} />
              </div>
              <div>
                <p className="stat-value">{stats.total}</p>
                <p className="stat-label">Total Artistas</p>
              </div>
            </div>

            <div className="stat-card male">
              <div className="stat-icon-wrapper">
                <TrendingUp size={24} />
              </div>
              <div>
                <p className="stat-value">{stats.male}</p>
                <p className="stat-label">Masculino ({stats.malePercentage}%)</p>
              </div>
            </div>

            <div className="stat-card female">
              <div className="stat-icon-wrapper">
                <TrendingUp size={24} />
              </div>
              <div>
                <p className="stat-value">{stats.female}</p>
                <p className="stat-label">Femenino ({stats.femalePercentage}%)</p>
              </div>
            </div>

            <div className="stat-card unknown">
              <div className="stat-icon-wrapper">
                <TrendingUp size={24} />
              </div>
              <div>
                <p className="stat-value">{stats.unknown}</p>
                <p className="stat-label">Desconocido ({stats.unknownPercentage}%)</p>
              </div>
            </div>
          </div>

          <div className={`sassy-message-container ${sassyMessage.type}`}>
            <MessageCircle size={28} className="sassy-icon" />
            <p>{sassyMessage.text}</p>
          </div>

          {chartData.length > 0 && (
            <div className="chart-section">
              <h3>Distribución por Género</h3>
              
              <div className="chart-area">
                <div className="chart-inner-hub">
                  <span className="hub-number">{stats.total}</span>
                  <span className="hub-label">Artistas</span>
                </div>

                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <defs>
                      <filter id="neumorphic-shadow" x="-50%" y="-50%" width="200%" height="200%">
                        <feDropShadow dx="2" dy="3" stdDeviation="3" floodColor="rgba(0,0,0,0.15)" />
                      </filter>
                      <linearGradient id="maleGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#60A5FA" stopOpacity={1}/>
                        <stop offset="100%" stopColor="#3B82F6" stopOpacity={1}/>
                      </linearGradient>
                      <linearGradient id="femaleGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#F472B6" stopOpacity={1}/>
                        <stop offset="100%" stopColor="#EC4899" stopOpacity={1}/>
                      </linearGradient>
                      <linearGradient id="unknownGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#9CA3AF" stopOpacity={1}/>
                        <stop offset="100%" stopColor="#6B7280" stopOpacity={1}/>
                      </linearGradient>
                    </defs>

                    {/* anillo de fondo */}
                    <Pie
                      data={[{ value: 1 }]}
                      cx="50%"
                      cy="50%"
                      innerRadius="60%"
                      outerRadius="85%"
                      dataKey="value"
                      stroke="none"
                      fill="var(--bg-primary)" 
                    />

                    <Pie
                      data={chartData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={renderCustomLabel}
                      outerRadius="85%"
                      innerRadius="60%"
                      dataKey="value"
                      animationBegin={0}
                      animationDuration={1000}
                      animationEasing="ease-out"
                      paddingAngle={6}
                      stroke="none"
                      cornerRadius={10}
                      filter="url(#neumorphic-shadow)"
                    >
                      {chartData.map((entry, index) => (
                        <Cell
                          key={`cell-${index}`}
                          fill={entry.gradient}
                          stroke="none"
                        />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{
                        backgroundColor: 'rgba(255, 255, 255, 0.8)',
                        backdropFilter: 'blur(8px)',
                        border: 'none',
                        borderRadius: '15px',
                        color: '#4a5568',
                        boxShadow: '5px 5px 15px rgba(0,0,0,0.1)',
                        zIndex: 9999
                      }}
                      itemStyle={{ color: '#4a5568', fontWeight: '600' }}
                      cursor={false}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>

              <div className="custom-legend">
                <div className="legend-item">
                  <span className="legend-dot male"></span>
                  <div className="legend-text">
                    <span className="legend-label">Masculino</span>
                    <span className="legend-value">{stats.male} ({stats.malePercentage}%)</span>
                  </div>
                </div>
                <div className="legend-item">
                  <span className="legend-dot female"></span>
                  <div className="legend-text">
                    <span className="legend-label">Femenino</span>
                    <span className="legend-value">{stats.female} ({stats.femalePercentage}%)</span>
                  </div>
                </div>
                <div className="legend-item">
                  <span className="legend-dot unknown"></span>
                  <div className="legend-text">
                    <span className="legend-label">Desconocido</span>
                    <span className="legend-value">{stats.unknown} ({stats.unknownPercentage}%)</span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="filters-section">
          <div className="filters-header">
            <Filter size={20} />
            <h3>Filtrar artistas</h3>
          </div>
          <div className="filter-buttons">
            <button
              className={`filter-btn ${filter === 'all' ? 'active' : ''}`}
              onClick={() => setFilter('all')}
            >
              Todos ({stats.total})
            </button>
            <button
              className={`filter-btn male ${filter === 'male' ? 'active' : ''}`}
              onClick={() => setFilter('male')}
            >
              Masculino ({stats.male})
            </button>
            <button
              className={`filter-btn female ${filter === 'female' ? 'active' : ''}`}
              onClick={() => setFilter('female')}
            >
              Femenino ({stats.female})
            </button>
            <button
              className={`filter-btn unknown ${filter === 'unknown' ? 'active' : ''}`}
              onClick={() => setFilter('unknown')}
            >
              Desconocido ({stats.unknown})
            </button>
          </div>
        </div>

        <div className="artists-section">
          <h3>Artistas ({filteredArtists.length})</h3>
          <div className="artists-grid">
            {filteredArtists.map((artist, index) => (
              <ArtistCard key={artist.id} artist={artist} rank={index + 1} />
            ))}
          </div>

          {filteredArtists.length === 0 && (
            <div className="no-artists">
              <p>No se encontraron artistas con este filtro</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default Dashboard
