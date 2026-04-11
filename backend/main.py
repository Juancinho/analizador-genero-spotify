"""
Backend del Spotify Gender Analyzer.
Cruza los top artistas de Spotify con MusicBrainz para sacar el género.
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

# Cargar configuración local
load_dotenv()

app = FastAPI(title="Spotify Gender Analysis API")

ALLOWED_ORIGINS = [
    "https://analizador-genero-spotify-frontend.vercel.app",
    "http://localhost:5173",  # dev local
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Credenciales desde .env
SPOTIFY_CLIENT_ID = os.getenv("SPOTIFY_CLIENT_ID")
SPOTIFY_CLIENT_SECRET = os.getenv("SPOTIFY_CLIENT_SECRET")
SPOTIFY_REDIRECT_URI = os.getenv("SPOTIFY_REDIRECT_URI", "http://localhost:8000/callback")
FRONTEND_URL = os.getenv("FRONTEND_URL", "http://localhost:5173")

# Identificación para MusicBrainz (es de buena educación y requerido identificar la app)
mb.set_useragent("SpotifyGenderAnalyzer", "1.0", "https://github.com/yourusername/spotify-gender-analyzer")

gender_detector = Detector()

# tokens en memoria, suficiente para esto
token_storage = {}

def get_spotify_oauth():
    return SpotifyOAuth(
        client_id=SPOTIFY_CLIENT_ID,
        client_secret=SPOTIFY_CLIENT_SECRET,
        redirect_uri=SPOTIFY_REDIRECT_URI,
        scope="user-top-read", # Solo necesitamos ver los tops del usuario
        cache_path=None
    )

# MusicBrainz es lento y tiene rate limit, así que guardo los resultados en JSON local.
# La segunda vez que aparezca un artista, ya lo tenemos sin esperar.

DATASET_FILE = Path(__file__).parent / "artists_gender_dataset.json"
gender_dataset = {}

def load_gender_dataset():
    """Carga el JSON con artistas ya conocidos."""
    global gender_dataset
    try:
        if DATASET_FILE.exists():
            with open(DATASET_FILE, 'r', encoding='utf-8') as f:
                gender_dataset = json.load(f)
            print(f"✅ Dataset cargado: {len(gender_dataset)} artistas conocidos.")
        else:
            gender_dataset = {}
            print("📝 Creando nuevo dataset de artistas desde cero.")
    except Exception as e:
        print(f"⚠️ Hubo un problema leyendo el dataset: {e}")
        gender_dataset = {}

def save_gender_dataset():
    """Guarda el dataset a disco."""
    try:
        with open(DATASET_FILE, 'w', encoding='utf-8') as f:
            json.dump(gender_dataset, f, ensure_ascii=False, indent=2)
    except Exception as e:
        print(f"⚠️ Error guardando dataset: {e}")

load_gender_dataset()

# Cache de sesión (para no repetir consultas repetidas en la misma ejecución)
gender_cache = {}

def get_member_gender(member_id: str) -> str:
    """Busca el género de un integrante específico de una banda."""
    try:
        if member_id in gender_cache:
            return gender_cache[member_id]

        member_info = mb.get_artist_by_id(member_id)
        member_gender = member_info.get("artist", {}).get("gender", "").lower()

        if member_gender in ["female", "woman"]:
            result = "female"
        elif member_gender in ["male", "man"]:
            result = "male"
        else:
            result = "unknown"

        gender_cache[member_id] = result
        return result

    except Exception as e:
        print(f"Error con miembro {member_id}: {str(e)}")
        return "unknown"

def detect_artist_gender(artist_name: str, save_to_dataset: bool = True) -> str:
    """
    Detecta el género de un artista. Prueba en este orden:
    - Dataset local (lo más rápido)
    - Cache en memoria
    - MusicBrainz: si es solista usa su género, si es banda mira los miembros
    - Como último recurso, adivina por el nombre con gender-guesser
    """
    try:
        if artist_name in gender_dataset:
            print(f"✓ {artist_name}: encontrado en dataset local.")
            return gender_dataset[artist_name]

        if artist_name in gender_cache:
            return gender_cache[artist_name]

        print(f"🔍 {artist_name}: consultando MusicBrainz...")
        time.sleep(0.1)  # rate limit

        result = mb.search_artists(artist=artist_name, limit=1)

        if not result.get("artist-list"):
            return "unknown"

        artist_data = result["artist-list"][0]
        artist_id = artist_data["id"]

        info = mb.get_artist_by_id(artist_id, includes=["artist-rels"])
        artist_info = info.get("artist", {})

        detected_gender = "unknown"

        # solista
        if "gender" in artist_info:
            gender = artist_info["gender"].lower()
            if gender in ["female", "woman"]:
                detected_gender = "female"
            elif gender in ["male", "man"]:
                detected_gender = "male"

        # banda
        elif artist_info.get("artist-relation-list"):
            members = artist_info.get("artist-relation-list", [])
            has_female = False
            has_male = False

            for member in members:
                if member.get("type") == "member of band":
                    member_id = member.get("artist", {}).get("id")
                    if member_id:
                        m_gender = get_member_gender(member_id)
                        if m_gender == "female":
                            has_female = True
                        elif m_gender == "male":
                            has_male = True

            # si hay aunque sea una mujer en la banda, cuento como 'female'
            if has_female:
                detected_gender = "female"
            elif has_male:
                detected_gender = "male"

        # si no hay nada, intentamos adivinar por el nombre
        else:
            first_name = artist_name.split()[0]
            gender_guess = gender_detector.get_gender(first_name)
            if gender_guess in ["female", "mostly_female"]:
                detected_gender = "female"
            elif gender_guess in ["male", "mostly_male"]:
                detected_gender = "male"

        gender_cache[artist_name] = detected_gender
        if save_to_dataset:
            gender_dataset[artist_name] = detected_gender

        print(f"✓ {artist_name}: {detected_gender}")
        return detected_gender

    except Exception as e:
        print(f"❌ Fallo al analizar {artist_name}: {str(e)}")
        return "unknown"

@app.get("/")
async def root():
    return {"message": "Spotify Gender Analysis API", "status": "running"}

@app.get("/login")
async def login():
    """Devuelve la URL de login de Spotify."""
    sp_oauth = get_spotify_oauth()
    state = secrets.token_urlsafe(16)
    auth_url = sp_oauth.get_authorize_url(state=state)
    return {"auth_url": auth_url}

@app.get("/callback")
async def callback(code: str = None, error: str = None):
    if error:
        return RedirectResponse(url=f"{FRONTEND_URL}?error={error}")

    if not code:
        return RedirectResponse(url=f"{FRONTEND_URL}?error=no_code")

    try:
        sp_oauth = get_spotify_oauth()
        token_info = sp_oauth.get_access_token(code, as_dict=True, check_cache=False)
        
        session_id = secrets.token_urlsafe(32)
        token_storage[session_id] = token_info

        return RedirectResponse(url=f"{FRONTEND_URL}?session_id={session_id}")

    except Exception as e:
        print(f"Error en callback: {str(e)}")
        return RedirectResponse(url=f"{FRONTEND_URL}?error=auth_failed")

@app.get("/top-artists-gender")
async def get_top_artists_gender(session_id: str, time_range: str = "short_term"):
    # recargo por si toqué el JSON a mano mientras corría el server
    load_gender_dataset()

    if session_id not in token_storage:
        raise HTTPException(status_code=401, detail="Invalid session")

    if time_range not in ["short_term", "medium_term", "long_term"]:
        time_range = "short_term"

    try:
        token_info = token_storage[session_id]
        sp = spotipy.Spotify(auth=token_info["access_token"])

        limit = 50 if time_range == "short_term" else 30
        results = sp.current_user_top_artists(limit=limit, time_range=time_range)

        print(f"\n🎵 Procesando {len(results['items'])} artistas en paralelo ({time_range})...")

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

        artists_with_gender = []

        # uso futures en lista para mantener el orden del ranking de Spotify
        with ThreadPoolExecutor(max_workers=5) as executor:
            futures = [executor.submit(process_artist, artist) for artist in results["items"]]

            for future in futures:
                try:
                    artist_data = future.result()
                    artists_with_gender.append(artist_data)
                except Exception as e:
                    print(f"❌ Error procesando artista: {str(e)}")

        save_gender_dataset()
        print(f"💾 Dataset guardado/actualizado.\n")

        return {
            "artists": artists_with_gender,
            "total": len(artists_with_gender)
        }

    except spotipy.exceptions.SpotifyException as e:
        if e.http_status == 401:
            try:
                sp_oauth = get_spotify_oauth()
                token_info = sp_oauth.refresh_access_token(token_info["refresh_token"])
                token_storage[session_id] = token_info
                return await get_top_artists_gender(session_id, time_range)
            except:
                raise HTTPException(status_code=401, detail="Token expirado")
        else:
            raise HTTPException(status_code=500, detail=f"Error Spotify API: {str(e)}")

    except Exception as e:
        print(f"Error general: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
