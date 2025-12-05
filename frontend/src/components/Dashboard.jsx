import { useState, useMemo } from 'react'
import { LogOut, Filter, Music2, Users, TrendingUp } from 'lucide-react'
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts'
import ArtistCard from './ArtistCard'
import './Dashboard.css'

function Dashboard({ artists, onLogout }) {
  const [filter, setFilter] = useState('all') // all, male, female, unknown

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

  // Filtrar artistas
  const filteredArtists = useMemo(() => {
    if (filter === 'all') return artists
    return artists.filter(artist => artist.gender === filter)
  }, [artists, filter])

  // Datos para el gráfico circular con colores vibrantes
  const chartData = [
    { name: 'Masculino', value: stats.male, color: '#3B82F6', gradient: 'url(#maleGradient)' },
    { name: 'Femenino', value: stats.female, color: '#EC4899', gradient: 'url(#femaleGradient)' },
    { name: 'Desconocido', value: stats.unknown, color: '#6B7280', gradient: 'url(#unknownGradient)' }
  ].filter(item => item.value > 0)

  // Label personalizado para el gráfico
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
        textAnchor={x > cx ? 'start' : 'end'}
        dominantBaseline="central"
        style={{
          fontSize: '24px',
          fontWeight: 'bold',
          textShadow: '2px 2px 6px rgba(0,0,0,0.9)'
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
              <p>Top 50 artistas más escuchados (último mes)</p>
            </div>
          </div>
          <button onClick={onLogout} className="logout-btn">
            <LogOut size={20} />
            Cerrar sesión
          </button>
        </div>
      </header>

      <div className="dashboard-content">
        {/* Sección de estadísticas */}
        <div className="stats-section">
          <div className="stats-cards">
            <div className="stat-card total">
              <Users size={24} />
              <div>
                <p className="stat-value">{stats.total}</p>
                <p className="stat-label">Total Artistas</p>
              </div>
            </div>

            <div className="stat-card male">
              <TrendingUp size={24} />
              <div>
                <p className="stat-value">{stats.male}</p>
                <p className="stat-label">Masculino ({stats.malePercentage}%)</p>
              </div>
            </div>

            <div className="stat-card female">
              <TrendingUp size={24} />
              <div>
                <p className="stat-value">{stats.female}</p>
                <p className="stat-label">Femenino ({stats.femalePercentage}%)</p>
              </div>
            </div>

            <div className="stat-card unknown">
              <TrendingUp size={24} />
              <div>
                <p className="stat-value">{stats.unknown}</p>
                <p className="stat-label">Desconocido ({stats.unknownPercentage}%)</p>
              </div>
            </div>
          </div>

          {/* Gráfico circular */}
          {chartData.length > 0 && (
            <div className="chart-container">
              <h3>Distribución por Género</h3>
              <div className="chart-wrapper">
                <ResponsiveContainer width="100%" height={500}>
                  <PieChart>
                    <defs>
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
                    <Pie
                      data={chartData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={renderCustomLabel}
                      outerRadius={180}
                      innerRadius={90}
                      fill="#8884d8"
                      dataKey="value"
                      animationBegin={0}
                      animationDuration={800}
                      animationEasing="ease-out"
                      paddingAngle={2}
                    >
                      {chartData.map((entry, index) => (
                        <Cell
                          key={`cell-${index}`}
                          fill={entry.gradient}
                          stroke="#1a1a1a"
                          strokeWidth={4}
                        />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#2a2a2a',
                        border: '1px solid #3a3a3a',
                        borderRadius: '8px',
                        color: '#ffffff'
                      }}
                      itemStyle={{ color: '#ffffff' }}
                    />
                    <Legend
                      verticalAlign="bottom"
                      height={40}
                      iconType="circle"
                      iconSize={12}
                      wrapperStyle={{
                        paddingTop: '30px'
                      }}
                      formatter={(value, entry) => (
                        <span style={{ color: '#b3b3b3', fontSize: '16px', fontWeight: '500' }}>
                          {value} ({entry.payload.value} artistas)
                        </span>
                      )}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}
        </div>

        {/* Filtros */}
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

        {/* Lista de artistas */}
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
