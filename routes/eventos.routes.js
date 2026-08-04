// ==========================================================================
// RUTAS DE EVENTOS — routes/eventos.routes.js
// Responsable: Carlos Carballo (SW-9)
// ==========================================================================

const router = require('express').Router();
const { verificarSesion } = require('../middleware/auth');
const { asyncHandler } = require('../utils/respuestas');
const controller = require('../controllers/eventos.controller');
const { obtenerAgenda } = require('../controllers/agenda.controller');

// GET /api/eventos — listar con filtros (público)
router.get('/', asyncHandler(controller.listar));

// GET /api/agenda/:eventoId — agenda agrupada por fecha (público, SW-26)
router.get('/agenda/:eventoId', asyncHandler(obtenerAgenda));

// GET /api/eventos/:id — detalle con actividades, oradores y stands (público)
router.get('/:id', asyncHandler(controller.obtener));

// POST /api/eventos — crear evento (requiere sesión)
router.post('/', verificarSesion, asyncHandler(controller.crear));

// PUT /api/eventos/:id — actualizar evento (requiere sesión)
router.put('/:id', verificarSesion, asyncHandler(controller.actualizar));

// DELETE /api/eventos/:id — eliminar o cancelar evento (requiere sesión)
router.delete('/:id', verificarSesion, asyncHandler(controller.eliminar));

module.exports = router;
