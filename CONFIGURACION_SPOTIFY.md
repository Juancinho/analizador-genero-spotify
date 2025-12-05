# Configuración Final de Spotify

## ⚠️ IMPORTANTE: Configurar Redirect URI en Spotify

Antes de ejecutar la aplicación, debes agregar la Redirect URI en tu aplicación de Spotify:

### Pasos:

1. **Ve a Spotify Developer Dashboard**
   - https://developer.spotify.com/dashboard

2. **Selecciona tu aplicación**
   - Click en la aplicación que creaste

3. **Editar Settings**
   - Click en "Edit Settings" (botón verde)

4. **Agregar Redirect URIs**
   En la sección "Redirect URIs", agrega:

   **Para desarrollo local:**
   ```
   http://localhost:8000/callback
   ```

   **Para producción (cuando despliegues en Vercel):**
   ```
   https://tu-backend-url.vercel.app/callback
   ```

5. **Guardar**
   - Scroll hasta abajo y click en "Save"

## ✅ Tus Credenciales (Ya Configuradas)

- **Client ID:** `7949784e396b435cb7fedef12e04da14`
- **Client Secret:** `c8682fd4942243d897c5b78a7c72c346`
- **Redirect URI:** `http://localhost:8000/callback` (local)

## 🚀 Ejecutar el Proyecto

Una vez configurada la Redirect URI en Spotify:

### Terminal 1 - Backend:
```bash
cd backend
pip install -r requirements.txt
python main.py
```

### Terminal 2 - Frontend:
```bash
cd frontend
npm install
npm run dev
```

### Abrir en el navegador:
```
http://localhost:5173
```

## 🔒 Seguridad

⚠️ **IMPORTANTE:** No compartas tus credenciales públicamente. Los archivos `.env` están en `.gitignore` para protegerlos.

## Problemas Comunes

**Error: "Invalid redirect URI"**
- Verifica que agregaste exactamente `http://localhost:8000/callback` en Spotify Dashboard
- Sin espacios extra ni caracteres adicionales

**Error: "Invalid client"**
- Verifica que copiaste correctamente el Client ID y Secret
- Ya están configurados en `backend/.env`
