// ==========================================================================
// RUTAS DEL ASISTENTE DE IA — routes/asistente.routes.js
// Responsable: Josué Arroyo (SW-25)
//
// Endpoints:
//   POST /api/asistente/descripcion   Mejora la descripción de un evento
//
// Va detrás de verificarSesion: es una función del panel administrativo y
// cada llamada consume cuota de la cuenta de Gemini del equipo, así que no
// puede quedar abierta a cualquier visitante.
// ==========================================================================

const router = require('express').Router();
const { verificarSesion } = require('../middleware/auth');
const { asyncHandler } = require('../utils/respuestas');
const controller = require('../controllers/asistente.controller');

router.post('/descripcion', verificarSesion, asyncHandler(controller.mejorarDescripcion));

module.exports = router;
