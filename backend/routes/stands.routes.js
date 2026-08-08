// ==========================================================================
// RUTAS DE STANDS — routes/stands.routes.js
// Responsable: Josué Arroyo (SW-14)
//
// Endpoints:
//   GET    /api/stands              Listado con búsqueda y filtros (RF-22)
//   GET    /api/stands/:id          Detalle por _id o por código (S-2026-001)
//   POST   /api/stands              Registro con numeración anual (RF-14, RF-15)
//   PUT    /api/stands/:id          Edición limitada (RF-16)
//   PATCH  /api/stands/:id/estado   Aprobado / Cerrado (RF-15)
//   DELETE /api/stands/:id          Eliminación (RF-37)
//
// La lectura queda pública porque detalle-evento.html muestra los stands del
// evento a cualquier visitante. La escritura exige sesión de administrador.
// ==========================================================================

const router = require('express').Router();
const { verificarSesion } = require('../middleware/auth');
const { asyncHandler } = require('../utils/respuestas');
const controller = require('../controllers/stands.controller');

// --- Lectura pública ---
router.get('/', asyncHandler(controller.listar));
router.get('/:id', asyncHandler(controller.obtener));

// --- Escritura: solo administradores autenticados ---
router.post('/', verificarSesion, asyncHandler(controller.crear));
router.put('/:id', verificarSesion, asyncHandler(controller.actualizar));
router.patch('/:id/estado', verificarSesion, asyncHandler(controller.cambiarEstado));
router.delete('/:id', verificarSesion, asyncHandler(controller.eliminar));

module.exports = router;
