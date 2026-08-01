// ==========================================================================
// VERIFICACIÓN DE SESIÓN — middleware/auth.js
// Responsable: Kenner Gamboa (SW-11)
//
// Este middleware protege las rutas del panel administrativo.
// Debe verificar que exista una sesión activa antes de permitir el acceso.
//
// Uso en routes:
//   const { verificarSesion } = require('../middleware/auth');
//   router.post('/', verificarSesion, controller.crear);
// ==========================================================================

/**
 * Middleware que verifica si el usuario tiene sesión activa.
 * Si no la tiene, responde 401.
 */
function verificarSesion(req, res, next) {
    // TODO (Kenner - SW-11): implementar verificación de sesión
    // Por ahora permite todo para no bloquear desarrollo
    next();
}

module.exports = { verificarSesion };
