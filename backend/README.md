# Backend - Spotify Gender Analyzer API

API Backend en Python con FastAPI para analizar el género de artistas de Spotify.

## Instalación

```bash
# Crear entorno virtual
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate

# Instalar dependencias
pip install -r requirements.txt
```

## Configuración

Crea un archivo `.env` basado en `.env.example`:

```env
SPOTIFY_CLIENT_ID=tu_client_id
SPOTIFY_CLIENT_SECRET=tu_client_secret
SPOTIFY_REDIRECT_URI=http://localhost:8000/callback
FRONTEND_URL=http://localhost:5173
```

## Ejecución Local

```bash
python main.py
```

O con uvicorn:

```bash
uvicorn main:app --reload --port 8000
```

## API Endpoints

- `GET /` - Health check
- `GET /login` - Iniciar OAuth flow
- `GET /callback` - Callback OAuth de Spotify
- `GET /top-artists-gender?session_id={id}` - Obtener artistas con género

## Despliegue en Vercel

1. Sube el código a un repositorio Git
2. Importa el proyecto en Vercel
3. Configura Root Directory como `backend`
4. Agrega las variables de entorno
5. Deploy

## Dependencias Principales

- `fastapi` - Framework web
- `spotipy` - Cliente de Spotify API
- `musicbrainzngs` - Cliente de MusicBrainz
- `gender-guesser` - Detector de género por nombre
