# Spotify Gender Analyzer

Una aplicación web que analiza el género de tus artistas favoritos de Spotify utilizando OAuth, MusicBrainz y análisis de género basado en nombres.

## Características

- Autenticación con Spotify OAuth
- Análisis de Top 50 artistas (último mes)
- Detección de género usando MusicBrainz y gender-guesser
- Visualización moderna y responsiva con React + Vite
- Estadísticas y gráficos interactivos
- Filtros por género
- Listo para desplegar en Vercel

## Estructura del Proyecto

```
spoti_genero_artista/
├── backend/               # API Python (FastAPI)
│   ├── main.py           # Aplicación principal
│   ├── requirements.txt  # Dependencias Python
│   ├── vercel.json      # Configuración Vercel
│   └── .env.example     # Variables de entorno
└── frontend/             # Aplicación React
    ├── src/
    │   ├── components/  # Componentes React
    │   ├── App.jsx      # Componente principal
    │   └── main.jsx     # Punto de entrada
    ├── package.json     # Dependencias Node
    ├── vite.config.js   # Configuración Vite
    ├── vercel.json      # Configuración Vercel
    └── .env.example     # Variables de entorno
```

## Instalación Local

### Requisitos Previos

- Node.js 18+ y npm/yarn
- Python 3.9+
- Cuenta de Spotify Developer

### 1. Configurar Credenciales de Spotify

1. Ve a [Spotify Developer Dashboard](https://developer.spotify.com/dashboard)
2. Crea una nueva aplicación
3. Anota tu **Client ID** y **Client Secret**
4. En "Edit Settings", agrega las siguientes Redirect URIs:
   - `http://localhost:8000/callback` (desarrollo)
   - `https://tu-backend.vercel.app/callback` (producción)

### 2. Backend

```bash
cd backend

# Crear entorno virtual (opcional pero recomendado)
python -m venv venv
source venv/bin/activate  # En Windows: venv\Scripts\activate

# Instalar dependencias
pip install -r requirements.txt

# Configurar variables de entorno
cp .env.example .env
# Edita .env y agrega tus credenciales de Spotify
```

Contenido del archivo `.env`:

```env
SPOTIFY_CLIENT_ID=tu_client_id
SPOTIFY_CLIENT_SECRET=tu_client_secret
SPOTIFY_REDIRECT_URI=http://localhost:8000/callback
FRONTEND_URL=http://localhost:5173
```

Ejecutar backend:

```bash
python main.py
# O con uvicorn:
uvicorn main:app --reload --port 8000
```

El backend estará disponible en `http://localhost:8000`

### 3. Frontend

```bash
cd frontend

# Instalar dependencias
npm install
# o con yarn:
yarn install

# Configurar variables de entorno
cp .env.example .env
# Edita .env si es necesario
```

Contenido del archivo `.env`:

```env
VITE_API_URL=http://localhost:8000
```

Ejecutar frontend:

```bash
npm run dev
# o con yarn:
yarn dev
```

El frontend estará disponible en `http://localhost:5173`

## Despliegue en Vercel

### Desplegar Backend

1. **Crear nuevo proyecto en Vercel**
   - Ve a [Vercel](https://vercel.com)
   - Haz clic en "Add New Project"
   - Importa tu repositorio
   - Selecciona la carpeta `backend` como Root Directory

2. **Configurar Variables de Entorno**

   En la sección "Environment Variables" de Vercel, agrega:

   ```
   SPOTIFY_CLIENT_ID=tu_client_id
   SPOTIFY_CLIENT_SECRET=tu_client_secret
   SPOTIFY_REDIRECT_URI=https://tu-backend.vercel.app/callback
   FRONTEND_URL=https://tu-frontend.vercel.app
   ```

3. **Deploy**
   - Haz clic en "Deploy"
   - Anota la URL del backend (ej: `https://tu-backend.vercel.app`)

4. **Actualizar Spotify Redirect URI**
   - Ve a Spotify Developer Dashboard
   - Agrega `https://tu-backend.vercel.app/callback` a las Redirect URIs

### Desplegar Frontend

1. **Crear nuevo proyecto en Vercel**
   - Haz clic en "Add New Project"
   - Importa tu repositorio
   - Selecciona la carpeta `frontend` como Root Directory

2. **Configurar Variables de Entorno**

   En la sección "Environment Variables" de Vercel, agrega:

   ```
   VITE_API_URL=https://tu-backend.vercel.app
   ```

3. **Configurar Build Settings**
   - Framework Preset: Vite
   - Build Command: `npm run build` (debería detectarse automáticamente)
   - Output Directory: `dist` (debería detectarse automáticamente)

4. **Deploy**
   - Haz clic en "Deploy"
   - Anota la URL del frontend (ej: `https://tu-frontend.vercel.app`)

5. **Actualizar Backend**
   - Actualiza la variable `FRONTEND_URL` en el backend de Vercel con la URL del frontend

### Despliegue Alternativo (Monorepo)

Si prefieres desplegar todo desde un solo repositorio:

1. **Backend**: Crea un proyecto en Vercel apuntando a `/backend`
2. **Frontend**: Crea otro proyecto en Vercel apuntando a `/frontend`

## Cómo Funciona

### Backend (FastAPI)

1. **OAuth Flow**:
   - `/login` → Genera URL de autorización de Spotify
   - `/callback` → Recibe el código OAuth y lo intercambia por token
   - Almacena el token con un session_id único

2. **Análisis de Género**:
   - Obtiene top 50 artistas del usuario desde Spotify API
   - Para cada artista, busca información en MusicBrainz
   - Si es solista: usa `gender-guesser` con el primer nombre
   - Si es banda: detecta género de cada miembro, cuenta como femenino si hay al menos una mujer
   - Devuelve JSON con artistas y su género detectado

3. **API Endpoints**:
   - `GET /login` - Inicia OAuth
   - `GET /callback` - Callback OAuth
   - `GET /top-artists-gender?session_id={id}` - Obtiene artistas con género
   - `GET /health` - Health check

### Frontend (React + Vite)

1. **LoginPage**: Botón para iniciar sesión con Spotify
2. **Dashboard**: Muestra artistas con:
   - Tarjetas visuales con imagen y nombre
   - Badge de género (masculino/femenino/desconocido)
   - Estadísticas agregadas
   - Gráfico de distribución (Recharts)
   - Filtros por género
   - Links a Spotify

## Tecnologías Utilizadas

### Backend
- **FastAPI**: Framework web moderno para Python
- **Spotipy**: Cliente de Spotify API
- **MusicBrainz**: Base de datos de música
- **gender-guesser**: Detector de género por nombre

### Frontend
- **React 18**: Biblioteca UI
- **Vite**: Build tool y dev server
- **Recharts**: Librería de gráficos
- **Lucide React**: Iconos
- **Axios**: Cliente HTTP

## Limitaciones y Consideraciones

1. **MusicBrainz Rate Limiting**: La API de MusicBrainz tiene límites de tasa. En caso de muchos artistas, puede tardar.

2. **Detección de Género**:
   - No es 100% precisa, especialmente para nombres de escenario
   - Depende de la información disponible en MusicBrainz
   - Algunos artistas pueden no estar en MusicBrainz

3. **Almacenamiento de Tokens**:
   - En desarrollo, los tokens se guardan en memoria
   - En producción, considera usar Redis o una base de datos

4. **CORS**:
   - Configurado para permitir todos los orígenes en desarrollo
   - En producción, especifica el dominio del frontend

## Mejoras Futuras

- Cache de resultados de MusicBrainz
- Base de datos para almacenar tokens y resultados
- Análisis de más períodos (medium_term, long_term)
- Exportar resultados a PDF/CSV
- Comparar con otros usuarios
- Análisis de playlists

## Troubleshooting

### Error: "Invalid session"
- El token expiró o el session_id es inválido
- Cierra sesión y vuelve a iniciar sesión

### Error: "MusicBrainz API error"
- Posible rate limiting de MusicBrainz
- Espera unos minutos e intenta de nuevo

### El frontend no se conecta al backend
- Verifica que `VITE_API_URL` esté configurado correctamente
- Verifica CORS en el backend

### OAuth redirect no funciona
- Verifica que la Redirect URI en Spotify coincida exactamente con la configurada
- Asegúrate de que `SPOTIFY_REDIRECT_URI` en el backend sea correcta

## Licencia

MIT License

## Autor

Creado con Claude Code

## Contribuciones

¡Las contribuciones son bienvenidas! Por favor, abre un issue o pull request.
