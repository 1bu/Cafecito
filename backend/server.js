// Importar dependencias
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const fetch = require('node-fetch');

const app = express();

// Middleware
app.use(cors()); // Permite que React hable con el backend
app.use(express.json()); // Para leer JSON en las peticiones

// ===== CONFIGURACIÓN DESDE .env =====
const CLIENT_ID = process.env.CLIENT_ID;
const CLIENT_SECRET = process.env.CLIENT_SECRET;
const PLAYLIST_ID = process.env.PLAYLIST_ID;
const PORT = process.env.PORT || 3001;

// Variables para manejar tokens
let accessToken = '';
let refreshToken = process.env.REFRESH_TOKEN || '';
let tokenExpiration = 0;

// ===== FUNCIONES PARA MANEJAR TOKENS =====

// Verifica si el token ha expirado
function isTokenExpired() {
  return Date.now() >= tokenExpiration;
}

// Refresca el access token usando el refresh token
async function refreshAccessToken() {
  console.log('🔄 Refrescando access token...');
  
  const authString = Buffer.from(`${CLIENT_ID}:${CLIENT_SECRET}`).toString('base64');
  
  try {
    const response = await fetch('https://accounts.spotify.com/api/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Authorization': `Basic ${authString}`
      },
      body: new URLSearchParams({
        grant_type: 'refresh_token',
        refresh_token: refreshToken
      })
    });

    const data = await response.json();
    
    if (data.access_token) {
      accessToken = data.access_token;
      // Los tokens expiran en 3600 segundos (1 hora)
      tokenExpiration = Date.now() + (data.expires_in * 1000);
      console.log('✅ Token refrescado exitosamente');
      return accessToken;
    } else {
      console.error('❌ Error al refrescar token:', data);
      throw new Error('No se pudo refrescar el token');
    }
  } catch (error) {
    console.error('❌ Error en refreshAccessToken:', error);
    throw error;
  }
}

// Obtiene un token válido (refresca si es necesario)
async function getValidToken() {
  if (!accessToken || isTokenExpired()) {
    return await refreshAccessToken();
  }
  return accessToken;
}

// ===== ENDPOINTS DE LA API =====

// Endpoint para buscar canciones
app.get('/api/search', async (req, res) => {
  try {
    const query = req.query.q;
    
    if (!query) {
      return res.status(400).json({ error: 'Falta el parámetro de búsqueda' });
    }

    const token = await getValidToken();

    const response = await fetch(
      `https://api.spotify.com/v1/search?q=${encodeURIComponent(query)}&type=track&limit=20`,
      {
        headers: { 'Authorization': `Bearer ${token}` }
      }
    );

    const data = await response.json();
        console.log(data)
    
    if (response.ok) {
      res.json(data);
    } else {
      res.status(response.status).json({ error: data });
    }
  } catch (error) {
    console.error('❌ Error en búsqueda:', error);
    res.status(500).json({ error: 'Error al buscar canciones' });
  }
});

// Endpoint para agregar canción a la playlist
app.post('/api/add-track', async (req, res) => {
  try {
    const { trackId } = req.body;
    
    if (!trackId) {
      return res.status(400).json({ error: 'Falta el ID de la canción' });
    }

    const token = await getValidToken();

    const response = await fetch(
      `https://api.spotify.com/v1/playlists/${PLAYLIST_ID}/tracks`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ 
          uris: [`spotify:track:${trackId}`] 
        })
      }
    );

    const data = await response.json();

    if (response.ok) {
      console.log('✅ Canción agregada:', trackId);
      res.json({ success: true, message: 'Canción agregada a la playlist', data });
    } else {
      console.error('❌ Error al agregar canción:', data);
      res.status(response.status).json({ error: data });
    }
  } catch (error) {
    console.error('❌ Error al agregar canción:', error);
    res.status(500).json({ error: 'Error al agregar canción' });
  }
});

// Endpoint para agregar canción a la cola (siguiente en reproducción)
app.post('/api/queue', async (req, res) => {
  try {
    const { trackId } = req.body;

    console.log('1️⃣ Body recibido:', req.body);
    console.log('2️⃣ Track ID:', trackId);

    if (!trackId) {
      return res.status(400).json({ error: 'Falta el ID de la canción' });
    }

    const token = await getValidToken();
    const trackUri = `spotify:track:${trackId}`;

    console.log('3️⃣ Track URI:', trackUri);
    console.log(
      '4️⃣ URL:',
      `https://api.spotify.com/v1/me/player/queue?uri=${encodeURIComponent(trackUri)}`
    );

    const response = await fetch(
      `https://api.spotify.com/v1/me/player/queue?uri=${encodeURIComponent(trackUri)}`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`
          // ❌ NO Content-Type
        }
      }
    );

    // ✅ Spotify responde 204 cuando todo sale bien
    if (response.ok) {
      console.log('✅ Canción agregada a la cola');
      return res.json({
        success: true,
        message: 'Canción agregada a la cola de reproducción'
      });
    }

    // ❌ Errores (Spotify devuelve texto o JSON, no siempre JSON)
    const errorText = await response.text();
    console.error('❌ Error Spotify:', errorText);

    return res.status(response.status).json({
      error: errorText
    });

  } catch (error) {
    console.error('❌ Error en /api/queue:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});
// ===== ENDPOINTS PARA AUTENTICACIÓN INICIAL (úsalos una sola vez) =====

// Redirige a Spotify para autorizar
app.get('/auth/login', (req, res) => {
  const scopes = 'playlist-modify-public playlist-modify-private user-modify-playback-state user-read-playback-state';
  //const redirectUri = `http://localhost:${PORT}/auth/callback`;
  const redirectUri = 'https://example.com/callback';

  const authUrl = `https://accounts.spotify.com/authorize?${new URLSearchParams({
    response_type: 'code',
    client_id: CLIENT_ID,
    scope: scopes,
    redirect_uri: redirectUri
  })}`;
  
  console.log('🔐 Redirigiendo a Spotify para autorización...');
  res.redirect(authUrl);
});

// Callback después de autorizar en Spotify
app.get('/auth/callback', async (req, res) => {
  const code = req.query.code;
  
  if (!code) {
    return res.send('<h1>❌ Error: No se recibió el código de autorización</h1>');
  }

  const authString = Buffer.from(`${CLIENT_ID}:${CLIENT_SECRET}`).toString('base64');

  try {
    const response = await fetch('https://accounts.spotify.com/api/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Authorization': `Basic ${authString}`
      },
      body: new URLSearchParams({
        grant_type: 'authorization_code',
        code: code,
        redirect_uri: 'https://example.com/callback'      
      })
    });

    const data = await response.json();
  } catch (error) {
    console.error('❌ Error en callback:', error);
    res.send(`<h1>❌ Error en el servidor</h1><p>${error.message}</p>`);
  }
});

// Endpoint de prueba
app.get('/', (req, res) => {
  res.send(`
    <h1>🎵 Servidor de Spotify Backend</h1>
    <p>El servidor está funcionando correctamente.</p>
    <ul>
      <li><a href="/auth/login">Obtener Refresh Token (solo una vez)</a></li>
    </ul>
  `);
});

// ===== INICIAR SERVIDOR =====
app.listen(PORT, () => {
  console.log('='.repeat(50));
  console.log('🚀 Servidor corriendo en http://localhost:' + PORT);
  console.log('='.repeat(50));
  
  if (!refreshToken) {
    console.log('⚠️  No tienes REFRESH_TOKEN configurado');
    console.log('📝 Visita: http://localhost:' + PORT + '/auth/login');
    console.log('   Para obtener tu refresh token');
  } else {
    console.log('✅ Refresh Token configurado');
    console.log('🎵 Listo para buscar y agregar canciones');
  }
  
  console.log('='.repeat(50));
});