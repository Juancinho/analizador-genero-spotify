import { ExternalLink, User, Users } from 'lucide-react'
import './ArtistCard.css'

function ArtistCard({ artist, rank }) {
  const defaultImage = 'https://via.placeholder.com/300x300/667eea/ffffff?text=No+Image'
  const imageUrl = artist.images?.[0]?.url || defaultImage

  const getGenderIcon = (gender) => {
    switch (gender) {
      case 'male':
        return <User size={18} />
      case 'female':
        return <User size={18} />
      default:
        return <Users size={18} />
    }
  }

  const getGenderLabel = (gender) => {
    switch (gender) {
      case 'male':
        return 'Masculino'
      case 'female':
        return 'Femenino'
      default:
        return 'Desconocido'
    }
  }

  const getGenderClass = (gender) => {
    return gender || 'unknown'
  }

  return (
    <div className="artist-card">
      <div className="artist-rank">#{rank}</div>

      <div className="artist-image-container">
        <img
          src={imageUrl}
          alt={artist.name}
          className="artist-image"
          loading="lazy"
        />
      </div>

      <div className="artist-info">
        <h3 className="artist-name" title={artist.name}>
          {artist.name}
        </h3>

        <div className={`artist-gender ${getGenderClass(artist.gender)}`}>
          {getGenderIcon(artist.gender)}
          <span>{getGenderLabel(artist.gender)}</span>
        </div>

        {artist.genres && artist.genres.length > 0 && (
          <div className="artist-genres">
            {artist.genres.slice(0, 2).map((genre, index) => (
              <span key={index} className="genre-tag">
                {genre}
              </span>
            ))}
          </div>
        )}

        {artist.external_url && (
          <a
            href={artist.external_url}
            target="_blank"
            rel="noopener noreferrer"
            className="spotify-link"
          >
            <ExternalLink size={16} />
            Ver en Spotify
          </a>
        )}
      </div>
    </div>
  )
}

export default ArtistCard
