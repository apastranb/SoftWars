// ==========================================================================
// RUTAS DE ORADORES — routes/oradores.routes.js
// Responsable: Josué Arroyo (SW-12)
//
// Endpoints:
//   GET    /api/oradores              Listado con búsqueda y filtros (RF-20)
//   GET    /api/oradores/:id          Detalle por _id o por código (OR-001)
//   POST   /api/oradores              Registro de responsable (RF-12)
//   PUT    /api/oradores/:id          Edición condicional (RF-13)
//   PATCH  /api/oradores/:id/estado   Activar / desactivar
//   DELETE /api/oradores/:id          Eliminación condicional (RF-13)
//
// El listado y el detalle quedan públicos porque detalle-evento.html muestra
// los presentadores del evento sin exigir autenticación. Todo lo que escribe
// pasa por verificarSesion (Kenner, SW-11), que hoy es un passthrough y
// empezará a bloquear en cuanto SW-11 esté terminado, sin tocar este archivo.
// ==========================================================================

const router = require('express').Router();
const { verificarSesion } = require('../middleware/auth');
const { uploadFoto } = require('../middleware/upload');
const { asyncHandler } = require('../utils/respuestas');
const controller = require('../controllers/oradores.controller');

// --- Lectura pública ---
router.get('/', asyncHandler(controller.listar));
router.get('/:id', asyncHandler(controller.obtener));

// --- Escritura: solo administradores autenticados ---
router.post('/', verificarSesion, uploadFoto('oradores'), asyncHandler(controller.crear));
router.put('/:id', verificarSesion, uploadFoto('oradores'), asyncHandler(controller.actualizar));
router.patch('/:id/estado', verificarSesion, asyncHandler(controller.cambiarEstado));
router.delete('/:id', verificarSesion, asyncHandler(controller.eliminar));

module.exports = router;
