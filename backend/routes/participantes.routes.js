// ==========================================================================
// RUTAS DE PARTICIPANTES — routes/participantes.routes.js
// Responsable: Kenner Gamboa (SW-16)
// ==========================================================================

const router = require('express').Router();
const { listarParticipantes, editarParticipante, eliminarParticipante } = require('../controllers/participantes.controller');
const { verificarSesion } = require('../middleware/auth');

// Todas las rutas de participantes requieren sesión de administrador
router.get('/',     verificarSesion, listarParticipantes);
router.put('/:id',  verificarSesion, editarParticipante);
router.delete('/:id', verificarSesion, eliminarParticipante);

module.exports = router;
