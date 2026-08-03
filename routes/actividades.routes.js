// ==========================================================================
// RUTAS DE ACTIVIDADES — routes/actividades.routes.js
// Responsable: Carlos Carballo (SW-13)
// ==========================================================================

const router = require('express').Router();
const { verificarSesion } = require('../middleware/auth');
const { asyncHandler } = require('../utils/respuestas');
const controller = require('../controllers/actividades.controller');

// GET /api/actividades — listar con filtros (público)
router.get('/', asyncHandler(controller.listar));

// GET /api/actividades/:id — detalle con responsable (público)
router.get('/:id', asyncHandler(controller.obtener));

// POST /api/actividades — crear actividad (requiere sesión)
router.post('/', verificarSesion, asyncHandler(controller.crear));

// PUT /api/actividades/:id — actualizar actividad (requiere sesión)
router.put('/:id', verificarSesion, asyncHandler(controller.actualizar));

// DELETE /api/actividades/:id — eliminar actividad sin inscripciones (requiere sesión)
router.delete('/:id', verificarSesion, asyncHandler(controller.eliminar));

module.exports = router;
