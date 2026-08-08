// ==========================================================================
// RUTAS DE AUTENTICACIÓN — routes/auth.routes.js
// Responsable: Kenner Gamboa (SW-10)
// ==========================================================================

const router = require('express').Router();
const { login, logout, obtenerSesion, cambiarContrasena } = require('../controllers/auth.controller');
const { verificarSesion } = require('../middleware/auth');

// POST /api/auth/login — HU-01: Iniciar sesión
router.post('/login', login);

// POST /api/auth/logout — HU-02: Cerrar sesión (requiere sesión activa)
router.post('/logout', verificarSesion, logout);

// GET /api/auth/sesion — Devuelve el usuario autenticado o 401
router.get('/sesion', obtenerSesion);

// PUT /api/auth/contrasena — HU-04: Modificar contraseña
router.put('/contrasena', cambiarContrasena);

module.exports = router;
