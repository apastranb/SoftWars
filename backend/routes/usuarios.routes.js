// ==========================================================================
// RUTAS DE USUARIOS — routes/usuarios.routes.js
// ==========================================================================

const router = require('express').Router();
const { verificarSesion } = require('../middleware/auth');
const { asyncHandler } = require('../utils/respuestas');
const controller = require('../controllers/usuarios.controller');

router.get('/', verificarSesion, asyncHandler(controller.listar));
router.post('/', verificarSesion, asyncHandler(controller.crear));
router.put('/:id', verificarSesion, asyncHandler(controller.actualizar));
router.delete('/:id', verificarSesion, asyncHandler(controller.eliminar));

module.exports = router;
