"""
Backend FastAPI para análisis de género de artistas de Spotify
"""
import os
import json
from pathlib import Path
from dotenv import load_dotenv
from fastapi import FastAPI, HTTPException, Request
from fastapi.responses import RedirectResponse, JSONResponse
from fastapi.middleware.cors import CORSMiddleware
import spotipy
from spotipy.oauth2 import SpotifyOAuth
import musicbrainzngs as mb
from gender_guesser.detector import Detector
from typing import List, Dict, Any
import secrets
from urllib.parse import urlencode
from concurrent.futures import ThreadPoolExecutor, as_completed
import time

# Cargar variables de entorno desde .env
load_dotenv()

# Inicializar FastAPI
app = FastAPI(title="Spotify Gender Analysis API")

# Configurar CORS para permitir peticiones desde el frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # En producción, especifica el dominio del frontend
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Configurar variables de entorno
SPOTIFY_CLIENT_ID = os.getenv("SPOTIFY_CLIENT_ID")
SPOTIFY_CLIENT_SECRET = os.getenv("SPOTIFY_CLIENT_SECRET")
SPOTIFY_REDIRECT_URI = os.getenv("SPOTIFY_REDIRECT_URI", "http://localhost:8000/callback")
FRONTEND_URL = os.getenv("FRONTEND_URL", "http://localhost:5173")

# Configurar MusicBrainz
mb.set_useragent("SpotifyGenderAnalyzer", "1.0", "https://github.com/yourusername/spotify-gender-analyzer")

# Inicializar detector de género
gender_detector = Detector()

# Almacenamiento temporal de tokens (en producción, usar Redis o base de datos)
token_storage = {}

def get_spotify_oauth():
    """Crear objeto SpotifyOAuth con la configuración necesaria"""
    return SpotifyOAuth(
        client_id=SPOTIFY_CLIENT_ID,
        client_secret=SPOTIFY_CLIENT_SECRET,
        redirect_uri=SPOTIFY_REDIRECT_URI,
        scope="user-top-read",
        cache_path=None  # No usar cache de archivos
    )

# Archivo para dataset persistente
DATASET_FILE = Path(__file__).parent / "artists_gender_dataset.json"

# Dataset persistente de géneros (se carga al inicio y se guarda al actualizar)
gender_dataset = {}

def load_gender_dataset():
    """Carga el dataset de géneros desde el archivo JSON"""
    global gender_dataset
    try:
        if DATASET_FILE.exists():
            with open(DATASET_FILE, 'r', encoding='utf-8') as f:
                gender_dataset = json.load(f)
            print(f"✅ Dataset cargado: {len(gender_dataset)} artistas")
        else:
            gender_dataset = {}
            print("📝 Creando nuevo dataset de artistas")
    except Exception as e:
        print(f"⚠️ Error cargando dataset: {e}")
        gender_dataset = {}

def save_gender_dataset():
    """Guarda el dataset de géneros en el archivo JSON"""
    try:
        with open(DATASET_FILE, 'w', encoding='utf-8') as f:
            json.dump(gender_dataset, f, ensure_ascii=False, indent=2)
    except Exception as e:
        print(f"⚠️ Error guardando dataset: {e}")

# Cargar dataset al iniciar
load_gender_dataset()

# Cache temporal en memoria (durante la sesión)
gender_cache = {}

def get_member_gender(member_id: str) -> str:
    """
    Obtiene el género de un miembro de banda desde MusicBrainz.

    Args:
        member_id: ID del artista en MusicBrainz

    Returns:
        'male', 'female', o 'unknown'
    """
    try:
        # Verificar cache
        if member_id in gender_cache:
            return gender_cache[member_id]

        # Obtener información del miembro
        member_info = mb.get_artist_by_id(member_id)
        member_gender = member_info.get("artist", {}).get("gender", "").lower()

        # Normalizar el género
        if member_gender in ["female", "woman"]:
            result = "female"
        elif member_gender in ["male", "man"]:
            result = "male"
        else:
            result = "unknown"

        # Guardar en cache
        gender_cache[member_id] = result
        return result

    except Exception as e:
        print(f"Error obteniendo género del miembro {member_id}: {str(e)}")
        return "unknown"

def detect_artist_gender(artist_name: str, save_to_dataset: bool = True) -> str:
    """
    Detecta el género de un artista usando dataset local primero, luego MusicBrainz.

    Prioridad:
    1. Dataset persistente (instantáneo)
    2. Cache en memoria (sesión actual)
    3. MusicBrainz API (consulta externa)

    Para artistas solistas: usa el campo 'gender' directo de MusicBrainz
    Para bandas: verifica el género de cada miembro, guarda solo el género final de la banda

    Args:
        artist_name: Nombre del artista
        save_to_dataset: Si True, guarda el resultado en el dataset persistente

    Returns:
        'male', 'female', o 'unknown'
    """
    try:
        # PRIORIDAD 1: Verificar dataset persistente
        if artist_name in gender_dataset:
            print(f"✓ {artist_name}: encontrado en dataset")
            return gender_dataset[artist_name]

        # PRIORIDAD 2: Verificar cache en memoria
        if artist_name in gender_cache:
            return gender_cache[artist_name]

        # PRIORIDAD 3: Consultar MusicBrainz
        print(f"🔍 {artist_name}: consultando MusicBrainz...")

        # Pequeña pausa para respetar rate limiting de MusicBrainz
        time.sleep(0.1)

        # Buscar artista en MusicBrainz
        result = mb.search_artists(artist=artist_name, limit=1)

        if not result.get("artist-list"):
            return "unknown"

        artist_data = result["artist-list"][0]
        artist_id = artist_data["id"]

        # Obtener información detallada del artista
        info = mb.get_artist_by_id(artist_id, includes=["artist-rels"])
        artist_info = info.get("artist", {})

        detected_gender = "unknown"

        # CASO 1: Artista solista con campo 'gender' directo
        if "gender" in artist_info:
            gender = artist_info["gender"].lower()

            if gender in ["female", "woman"]:
                detected_gender = "female"
            elif gender in ["male", "man"]:
                detected_gender = "male"
            else:
                detected_gender = "unknown"

        # CASO 2: Banda (tiene miembros)
        elif artist_info.get("artist-relation-list"):
            members = artist_info.get("artist-relation-list", [])
            has_female = False
            has_male = False

            for member in members:
                if member.get("type") == "member of band":
                    member_id = member.get("artist", {}).get("id")

                    if member_id:
                        member_gender = get_member_gender(member_id)

                        if member_gender == "female":
                            has_female = True
                        elif member_gender == "male":
                            has_male = True

            # Si hay al menos una mujer, contar como femenino
            if has_female:
                detected_gender = "female"
            elif has_male:
                detected_gender = "male"
            else:
                detected_gender = "unknown"

        # CASO 3: Fallback - usar gender-guesser por nombre
        else:
            first_name = artist_name.split()[0]
            gender_guess = gender_detector.get_gender(first_name)

            if gender_guess in ["female", "mostly_female"]:
                detected_gender = "female"
            elif gender_guess in ["male", "mostly_male"]:
                detected_gender = "male"
            else:
                detected_gender = "unknown"

        # Guardar en cache y dataset
        gender_cache[artist_name] = detected_gender

        if save_to_dataset:
            gender_dataset[artist_name] = detected_gender
            # No guardamos el archivo aquí para no hacerlo 50 veces
            # Se guardará al final del procesamiento batch

        print(f"✓ {artist_name}: {detected_gender}")
        return detected_gender

    except Exception as e:
        print(f"❌ Error detectando género para {artist_name}: {str(e)}")
        return "unknown"

@app.get("/")
async def root():
    """Endpoint raíz"""
    return {"message": "Spotify Gender Analysis API", "status": "running"}

@app.get("/login")
async def login():
    """
    Inicia el proceso de autenticación OAuth con Spotify
    """
    sp_oauth = get_spotify_oauth()

    # Generar state para prevenir CSRF
    state = secrets.token_urlsafe(16)

    # Obtener URL de autorización
    auth_url = sp_oauth.get_authorize_url(state=state)

    return {"auth_url": auth_url}

@app.get("/callback")
async def callback(code: str = None, error: str = None):
    """
    Callback de Spotify OAuth - recibe el código de autorización
    """
    if error:
        return RedirectResponse(url=f"{FRONTEND_URL}?error={error}")

    if not code:
        return RedirectResponse(url=f"{FRONTEND_URL}?error=no_code")

    try:
        sp_oauth = get_spotify_oauth()

        # Intercambiar código por token
        token_info = sp_oauth.get_access_token(code, as_dict=True, check_cache=False)

        # Generar session_id único
        session_id = secrets.token_urlsafe(32)

        # Guardar token (en producción, usar base de datos)
        token_storage[session_id] = token_info

        # Redirigir al frontend con el session_id
        return RedirectResponse(url=f"{FRONTEND_URL}?session_id={session_id}")

    except Exception as e:
        print(f"Error en callback: {str(e)}")
        return RedirectResponse(url=f"{FRONTEND_URL}?error=auth_failed")

@app.get("/top-artists-gender")
async def get_top_artists_gender(session_id: str, time_range: str = "short_term"):
    """
    Obtiene los top 50 artistas del usuario y detecta su género.
    time_range: 'short_term' (4 semanas), 'medium_term' (6 meses), 'long_term' (años)
    """
    if session_id not in token_storage:
        raise HTTPException(status_code=401, detail="Invalid session")

    if time_range not in ["short_term", "medium_term", "long_term"]:
        time_range = "short_term"

    try:
        token_info = token_storage[session_id]

        # Crear cliente de Spotify
        sp = spotipy.Spotify(auth=token_info["access_token"])

        # Obtener top 50 artistas
        results = sp.current_user_top_artists(limit=50, time_range=time_range)

        print(f"\n🎵 Procesando {len(results['items'])} artistas en paralelo ({time_range})...")

        # Función auxiliar para procesar un artista
        def process_artist(artist):
            artist_name = artist["name"]
            gender = detect_artist_gender(artist_name)

            return {
                "id": artist["id"],
                "name": artist_name,
                "gender": gender,
                "images": artist.get("images", []),
                "genres": artist.get("genres", []),
                "popularity": artist.get("popularity", 0),
                "followers": artist.get("followers", {}).get("total", 0),
                "external_url": artist.get("external_urls", {}).get("spotify", "")
            }

        # Procesamiento paralelo con ThreadPoolExecutor
        # Usamos max_workers=5 para no saturar la API de MusicBrainz
        artists_with_gender = []

        with ThreadPoolExecutor(max_workers=5) as executor:
            # Enviar todos los artistas a procesar en paralelo
            # Guardamos los futures en orden para mantener el ranking original
            futures = [executor.submit(process_artist, artist) for artist in results["items"]]

            # Recoger resultados en orden
            for future in futures:
                try:
                    artist_data = future.result()
                    artists_with_gender.append(artist_data)
                except Exception as e:
                    print(f"❌ Error procesando artista: {str(e)}")

        # Guardar dataset al final
        save_gender_dataset()
        print(f"💾 Dataset guardado con {len(gender_dataset)} artistas\n")

        return {
            "artists": artists_with_gender,
            "total": len(artists_with_gender)
        }

    except spotipy.exceptions.SpotifyException as e:
        if e.http_status == 401:
            # Token expirado - intentar refrescar
            try:
                sp_oauth = get_spotify_oauth()
                token_info = sp_oauth.refresh_access_token(token_info["refresh_token"])
                token_storage[session_id] = token_info

                # Reintentar
                return await get_top_artists_gender(session_id)
            except:
                raise HTTPException(status_code=401, detail="Token expired and refresh failed")
        else:
            raise HTTPException(status_code=500, detail=f"Spotify API error: {str(e)}")

    except Exception as e:
        print(f"Error obteniendo artistas: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error: {str(e)}")

@app.get("/health")
async def health():
    """Health check endpoint para Vercel"""
    return {"status": "healthy"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
