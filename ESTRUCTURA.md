# Estructura del Proyecto

```
spoti_genero_artista/
│
├── README.md                      # Documentación principal
├── QUICK_START.md                 # Guía rápida de inicio
├── ESTRUCTURA.md                  # Este archivo
├── .gitignore                     # Archivos ignorados por Git
│
├── backend/                       # Backend Python (FastAPI)
│   ├── main.py                    # Aplicación principal FastAPI
│   ├── requirements.txt           # Dependencias Python
│   ├── runtime.txt                # Versión de Python
│   ├── vercel.json                # Configuración para Vercel
│   ├── .env.example               # Ejemplo de variables de entorno
│   └── README.md                  # Documentación del backend
│
└── frontend/                      # Frontend React + Vite
    ├── public/
    │   └── spotify-icon.svg       # Icono de la app
    │
    ├── src/
    │   ├── components/
    │   │   ├── LoginPage.jsx      # Página de login
    │   │   ├── LoginPage.css      # Estilos de login
    │   │   ├── Dashboard.jsx      # Dashboard principal
    │   │   ├── Dashboard.css      # Estilos del dashboard
    │   │   ├── ArtistCard.jsx     # Componente tarjeta de artista
    │   │   └── ArtistCard.css     # Estilos de tarjeta
    │   │
    │   ├── App.jsx                # Componente principal
    │   ├── App.css                # Estilos de App
    │   ├── main.jsx               # Punto de entrada
    │   └── index.css              # Estilos globales
    │
    ├── index.html                 # HTML principal
    ├── package.json               # Dependencias Node
    ├── vite.config.js             # Configuración de Vite
    ├── vercel.json                # Configuración para Vercel
    ├── .env.example               # Ejemplo de variables de entorno
    └── README.md                  # Documentación del frontend
```

## Archivos Clave

### Backend

- **main.py**: Contiene toda la lógica del backend
  - OAuth con Spotify
  - Endpoints de API
  - Detección de género con MusicBrainz
  - Manejo de tokens y sesiones

- **requirements.txt**: Dependencias necesarias
  - fastapi, uvicorn
  - spotipy
  - musicbrainzngs
  - gender-guesser

- **vercel.json**: Configuración para desplegar en Vercel

### Frontend

- **App.jsx**: Componente raíz que maneja:
  - Estado de autenticación
  - Carga de datos
  - Navegación entre Login y Dashboard

- **LoginPage.jsx**: Interfaz de inicio de sesión

- **Dashboard.jsx**: Vista principal con:
  - Estadísticas
  - Gráficos
  - Filtros
  - Lista de artistas

- **ArtistCard.jsx**: Tarjeta individual de artista

## Flujo de la Aplicación

1. Usuario accede al frontend
2. Click en "Iniciar sesión con Spotify"
3. Redirigido a Spotify OAuth
4. Spotify redirige a `/callback` del backend
5. Backend genera session_id y redirige al frontend
6. Frontend obtiene artistas con género desde `/top-artists-gender`
7. Dashboard muestra artistas con filtros y estadísticas

## Variables de Entorno

### Backend (.env)
```
SPOTIFY_CLIENT_ID=...
SPOTIFY_CLIENT_SECRET=...
SPOTIFY_REDIRECT_URI=...
FRONTEND_URL=...
```

### Frontend (.env)
```
VITE_API_URL=...
```
