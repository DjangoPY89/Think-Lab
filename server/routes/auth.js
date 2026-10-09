/**
 * Think Lab. - Authentication & Admin Security Router
 * Manages admin login, token generation, verification and session management
 */

const express = require('express');
const router = express.Router();
const crypto = require('crypto');

// Configuration
const DEFAULT_USERNAME = process.env.ADMIN_USERNAME || 'Juan Solalinde';
const DEFAULT_PASSWORD = process.env.ADMIN_PASSWORD || 'Millonario777';
const SESSION_SECRET = process.env.ADMIN_SESSION_SECRET || 'thinklab_admin_secret_key_session_2026_jwt';

/**
 * Sign payload into secure token (Payload + Expiration + HMAC Signature)
 */
function signToken(payload, expiresInMs = 7 * 24 * 60 * 60 * 1000) {
  const header = { alg: 'HS256', typ: 'JWT' };
  const exp = Date.now() + expiresInMs;
  const data = { ...payload, exp };

  const encodedHeader = Buffer.from(JSON.stringify(header)).toString('base64url');
  const encodedPayload = Buffer.from(JSON.stringify(data)).toString('base64url');
  const signature = crypto
    .createHmac('sha256', SESSION_SECRET)
    .update(`${encodedHeader}.${encodedPayload}`)
    .digest('base64url');

  return `${encodedHeader}.${encodedPayload}.${signature}`;
}

/**
 * Verify and decode token
 */
function verifyToken(token) {
  if (!token || typeof token !== 'string') return null;
  const parts = token.split('.');
  if (parts.length !== 3) return null;

  const [encodedHeader, encodedPayload, signature] = parts;
  const expectedSignature = crypto
    .createHmac('sha256', SESSION_SECRET)
    .update(`${encodedHeader}.${encodedPayload}`)
    .digest('base64url');

  if (signature !== expectedSignature) return null;

  try {
    const payload = JSON.parse(Buffer.from(encodedPayload, 'base64url').toString('utf8'));
    if (payload.exp && Date.now() > payload.exp) {
      return null; // Expired
    }
    return payload;
  } catch {
    return null;
  }
}

/**
 * Normalizes string for friendly comparison
 */
function normalize(str) {
  return String(str || '').trim().toLowerCase();
}

/**
 * Validates user credentials
 */
function isValidCredentials(inputUser, inputPass) {
  const validUser = process.env.ADMIN_USERNAME || 'Juan Solalinde';
  const validPass = process.env.ADMIN_PASSWORD || 'Millonario777';

  const userMatches =
    normalize(inputUser) === normalize(validUser) ||
    normalize(inputUser) === 'juanas89@gmail.com' ||
    normalize(inputUser) === 'admin';

  const passMatches = String(inputPass) === String(validPass);

  return userMatches && passMatches;
}

/**
 * POST /api/auth/login
 * Authenticate admin user
 */
router.post('/login', (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({
        success: false,
        error: 'Debes ingresar el usuario y la contraseña.'
      });
    }

    if (!isValidCredentials(username, password)) {
      // Log attempt
      console.warn(`🔒 [AUTH FAILED] Intento de acceso no autorizado con usuario: "${username}"`);
      return res.status(401).json({
        success: false,
        error: 'Usuario o contraseña incorrectos.'
      });
    }

    const token = signToken({
      username: 'Juan Solalinde',
      email: 'juanas89@gmail.com',
      role: 'admin'
    });

    console.log(`🔑 [AUTH SUCCESS] Sesión iniciada correctamente por: Juan Solalinde`);

    return res.json({
      success: true,
      token,
      user: {
        username: 'Juan Solalinde',
        email: 'juanas89@gmail.com',
        role: 'Super Admin'
      },
      message: 'Bienvenido a Think Lab. Control Center'
    });
  } catch (error) {
    console.error('❌ Error in login:', error);
    return res.status(500).json({ success: false, error: 'Error interno en la autenticación.' });
  }
});

/**
 * GET /api/auth/me
 * Validate current active session token
 */
router.get('/me', (req, res) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.startsWith('Bearer ') ? authHeader.slice(7) : req.query.token;

    const payload = verifyToken(token);
    if (!payload) {
      return res.status(401).json({ success: false, authenticated: false, error: 'Sesión no válida o expirada.' });
    }

    return res.json({
      success: true,
      authenticated: true,
      user: {
        username: payload.username,
        email: payload.email,
        role: payload.role
      }
    });
  } catch (error) {
    return res.status(500).json({ success: false, error: 'Error al verificar sesión.' });
  }
});

/**
 * POST /api/auth/logout
 */
router.post('/logout', (req, res) => {
  return res.json({ success: true, message: 'Sesión cerrada exitosamente.' });
});

/**
 * Middleware to protect API routes
 */
function requireAdminAuth(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.startsWith('Bearer ') ? authHeader.slice(7) : req.query.token;

  const payload = verifyToken(token);
  if (!payload) {
    return res.status(401).json({ success: false, error: 'Acceso no autorizado. Inicia sesión en /admin.' });
  }

  req.adminUser = payload;
  next();
}

module.exports = {
  router,
  requireAdminAuth,
  verifyToken,
  isValidCredentials
};
