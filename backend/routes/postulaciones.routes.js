// ==========================================================================
// RUTAS DE POSTULACIONES — routes/postulaciones.routes.js
// Responsable: Josué Arroyo (SW-17)
//
// Endpoints:
//   POST   /api/postulaciones               Envío público del formulario (RF-24, RF-25)
//   GET    /api/postulaciones               Bandeja de solicitudes (admin)
//   GET    /api/postulaciones/:id           Detalle (admin)
//   PATCH  /api/postulaciones/:id/aprobar   Aprobar y crear el orador (HU-10)
//   PATCH  /api/postulaciones/:id/rechazar  Rechazar con motivo (HU-10)
//   DELETE /api/postulaciones/:id           Descartar la solicitud (admin)
//
// A diferencia de oradores y stands, aquí el POST es el endpoint público y
// las LECTURAS son privadas: los datos de contacto de los postulantes no
// deben quedar expuestos en el portal.
// ==========================================================================

const router = require('express').Router();
const { verificarSesion } = require('../middleware/auth');
const { uploadFoto } = require('../middleware/upload');
const { asyncHandler } = require('../utils/respuestas');
const controller = require('../controllers/postulaciones.controller');

// --- Formulario público (RF-24): sin autenticación, acepta foto ---
router.post('/', uploadFoto('postulaciones'), asyncHandler(controller.crear));

// --- Bandeja administrativa: requiere sesión ---
router.get('/', verificarSesion, asyncHandler(controller.listar));
router.get('/:id', verificarSesion, asyncHandler(controller.obtener));
router.patch('/:id/aprobar', verificarSesion, asyncHandler(controller.aprobar));
router.patch('/:id/rechazar', verificarSesion, asyncHandler(controller.rechazar));
router.delete('/:id', verificarSesion, asyncHandler(controller.eliminar));

module.exports = router;
