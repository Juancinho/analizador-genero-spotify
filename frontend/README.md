# Frontend - Spotify Gender Analyzer

Aplicación web React + Vite para visualizar el análisis de género de artistas de Spotify.

## Instalación

```bash
# Instalar dependencias
npm install
# o
yarn install
```

## Configuración

Crea un archivo `.env` basado en `.env.example`:

```env
VITE_API_URL=http://localhost:8000
```

## Ejecución Local

```bash
# Modo desarrollo
npm run dev
# o
yarn dev

# Build para producción
npm run build
# o
yarn build

# Preview del build
npm run preview
# o
yarn preview
```

## Estructura de Componentes

```
src/
├── App.jsx              # Componente principal
├── App.css             # Estilos globales de App
├── main.jsx            # Punto de entrada
├── index.css           # Estilos globales
└── components/
    ├── LoginPage.jsx       # Página de login
    ├── LoginPage.css
    ├── Dashboard.jsx       # Dashboard principal
    ├── Dashboard.css
    ├── ArtistCard.jsx      # Tarjeta de artista
    └── ArtistCard.css
```

## Características

- Login con Spotify OAuth
- Visualización de Top 50 artistas
- Filtros por género
- Estadísticas y gráficos
- Diseño responsivo
- Modo claro moderno

## Despliegue en Vercel

1. Sube el código a un repositorio Git
2. Importa el proyecto en Vercel
3. Configura Root Directory como `frontend`
4. Configura Build Settings:
   - Framework: Vite
   - Build Command: `npm run build`
   - Output Directory: `dist`
5. Agrega variable de entorno `VITE_API_URL`
6. Deploy

## Tecnologías

- React 18
- Vite
- Recharts (gráficos)
- Lucide React (iconos)
- Axios (HTTP client)
