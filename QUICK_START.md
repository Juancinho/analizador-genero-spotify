# Guía Rápida de Inicio

## Configuración Inicial (5 minutos)

### 1. Obtener Credenciales de Spotify

1. Ve a https://developer.spotify.com/dashboard
2. Haz clic en "Create an App"
3. Rellena el nombre y descripción
4. Copia el **Client ID** y **Client Secret**
5. Haz clic en "Edit Settings"
6. En "Redirect URIs", agrega: `http://localhost:8000/callback`
7. Guarda los cambios

### 2. Configurar Backend

```bash
cd backend

# Crear archivo .env
echo "SPOTIFY_CLIENT_ID=tu_client_id_aqui" > .env
echo "SPOTIFY_CLIENT_SECRET=tu_client_secret_aqui" >> .env
echo "SPOTIFY_REDIRECT_URI=http://localhost:8000/callback" >> .env
echo "FRONTEND_URL=http://localhost:5173" >> .env

# Instalar dependencias
pip install -r requirements.txt

# Ejecutar
python main.py
```

### 3. Configurar Frontend

```bash
cd frontend

# Crear archivo .env
echo "VITE_API_URL=http://localhost:8000" > .env

# Instalar dependencias
npm install

# Ejecutar
npm run dev
```

### 4. Probar

Abre tu navegador en `http://localhost:5173`

## Despliegue Rápido en Vercel

### Backend

```bash
# Instalar Vercel CLI
npm i -g vercel

# Desplegar backend
cd backend
vercel

# Configurar variables de entorno en Vercel Dashboard
# SPOTIFY_CLIENT_ID
# SPOTIFY_CLIENT_SECRET
# SPOTIFY_REDIRECT_URI (usa la URL de tu backend)
# FRONTEND_URL (usa la URL de tu frontend)
```

### Frontend

```bash
# Desplegar frontend
cd frontend
vercel

# Configurar variable de entorno en Vercel Dashboard
# VITE_API_URL (usa la URL de tu backend)
```

### Actualizar Spotify

1. Ve a Spotify Developer Dashboard
2. Edita tu aplicación
3. Agrega la Redirect URI de producción: `https://tu-backend.vercel.app/callback`

## ¡Listo!

Tu aplicación debería estar funcionando tanto local como en producción.

## Problemas Comunes

**Error: "Invalid client"**
- Verifica que tus credenciales de Spotify sean correctas

**Error: "Redirect URI mismatch"**
- Asegúrate de que la Redirect URI en Spotify coincida exactamente con la configurada

**Frontend no se conecta al backend**
- Verifica que `VITE_API_URL` esté correctamente configurado
- Verifica que el backend esté corriendo

**MusicBrainz lento**
- Es normal, la API de MusicBrainz puede ser lenta
- Considera implementar cache en el futuro
