# 🎵 Analizador de género en Spotify

<div align="center">

</div>

**Descubre el equilibrio de género en tu música favorita con estilo.**

Esta aplicación web analiza tus artistas más escuchados en Spotify y visualiza la distribución de género (Masculino, Femenino, Desconocido) utilizando un diseño moderno.

![Dashboard Preview](https://via.placeholder.com/800x400/e0e5ec/3b82f6?text=Vista+Previa+del+Dashboard)

---

## ✨ Características Principales

* **🎨 Diseño Neumórfico:** Una interfaz limpia y suave ("Soft UI") con sombras realistas, botones elevados y gráficos integrados en la superficie.
* **⏱️ Múltiples Rangos de Tiempo:**
  * **Corto Plazo:** Últimas 4 semanas (Top 50).
  * **Medio Plazo:** Últimos 6 meses (Top 30).
  * **Largo Plazo:** Último año (Top 30).
* **🧠 Detección Inteligente de Género:**
  1. **Dataset Local:** Carga instantánea para artistas ya conocidos.
  2. **MusicBrainz API:** Consulta detallada de metadatos (solistas y bandas).
  3. **Análisis de Miembros:** Si es una banda, analiza el género de sus integrantes.
  4. **Gender Guesser:** Inferencia basada en el nombre de pila como último recurso.
* **💬 Mensajes "Sassy":** El sistema te juzgará (con humor) basándose en tu porcentaje de artistas femeninas. ¡Desde "Campo de nabos" hasta "Territorio de Reinas"!

---

## 🚀 Tecnologías

### Frontend

* **React + Vite:** Velocidad y modularidad.
* **Recharts:** Gráficos SVG personalizados con filtros y gradientes.
* **Lucide React:** Iconografía moderna.
* **CSS3 Variables:** Sistema de temas y sombras complejo para el efecto Neumorphic.

### Backend

* **FastAPI:** API Python de alto rendimiento.
* **Spotipy:** Cliente ligero para la API de Spotify.
* **MusicBrainzNGS:** Conexión con la enciclopedia musical abierta.
* **Concurrent Futures:** Procesamiento paralelo para analizar 50 artistas simultáneamente sin bloquear.

---

## 🛠️ Instalación y Configuración

### Prerrequisitos

1. Tener **Python 3.9+** y **Node.js 16+** instalados.
2. Crear una aplicación en el [Spotify Developer Dashboard](https://developer.spotify.com/dashboard/).
3. Obtener `Client ID` y `Client Secret`.
4. Añadir `http://localhost:8000/callback` como **Redirect URI** en la app de Spotify.

### 1. Configurar el Backend

```bash
cd backend

# Crear entorno virtual (opcional pero recomendado)
python -m venv venv
# En Windows:
.\venv\Scripts\activate
# En Mac/Linux:
source venv/bin/activate

# Instalar dependencias
pip install -r requirements.txt

# Crear archivo .env
cp .env.example .env
```

Edita el archivo `.env` en `backend/` con tus credenciales:

```env
SPOTIFY_CLIENT_ID="tu_client_id"
SPOTIFY_CLIENT_SECRET="tu_client_secret"
SPOTIFY_REDIRECT_URI="http://localhost:8000/callback"
FRONTEND_URL="http://localhost:5173"
```

Arrancar el servidor:

```bash
uvicorn main:app --reload
```

### 2. Configurar el Frontend

```bash
cd frontend

# Instalar dependencias
npm install

# Arrancar el servidor de desarrollo
npm run dev
```

---

## 🧠 Cómo funciona la detección

El sistema utiliza un algoritmo de cascada para determinar el género:

1. **Cache/Dataset:** Primero mira si ya conoce al artista (`artists_gender_dataset.json`).
2. **MusicBrainz Directo:** Busca al artista. Si tiene el campo `gender` (solistas), lo usa.
3. **Análisis de Bandas:** Si es un grupo, busca la relación "member of band".
   * Si hay al menos una mujer en la banda -> Se clasifica como **Femenino** (para promover visibilidad).
   * Si son todos hombres -> **Masculino**.
4. **Inferencia de Nombre:** Si todo falla, usa `gender-guesser` sobre el primer nombre del artista.

---

## 📄 Licencia

Este proyecto está bajo la Licencia MIT - siéntete libre de usarlo y modificarlo.

---

Hecho con 🎧 y mucho ☕por Juan Otero