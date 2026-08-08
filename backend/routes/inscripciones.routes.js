// ==========================================================================
// RUTAS DE INSCRIPCIONES — routes/inscripciones.routes.js
// Responsable: Kenner Gamboa (SW-16)
// ==========================================================================

const router = require('express').Router();
const { crearInscripcion, cancelarInscripcion, listarInscripciones } = require('../controllers/inscripciones.controller');
const { verificarSesion } = require('../middleware/auth');

// POST /api/inscripciones — público, cualquier visitante puede inscribirse
router.post('/', crearInscripcion);

// DELETE /api/inscripciones/:id — público, el visitante puede cancelar su inscripción
router.delete('/:id', cancelarInscripcion);

// GET /api/inscripciones — SW-30: vista global, solo administradores
router.get('/', verificarSesion, listarInscripciones);

module.exports = router;
