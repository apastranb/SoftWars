// ==========================================================================
// MIDDLEWARE DE SESIÓN — middleware/auth.js
// Responsable: Kenner Gamboa (SW-11)
//
// verificarSesion protege todas las rutas del panel administrativo.
// Se usa como middleware en cualquier ruta que requiera autenticación.
// Si no hay sesión activa responde 401 y no llama next().
// ==========================================================================

/**
 * Middleware que verifica que el usuario tenga una sesión activa.
 * Si no la tiene, responde con 401 Unauthorized.
 * Si la tiene, agrega req.usuario y llama next().
 */
function verificarSesion(req, res, next) {
    if (!req.session || !req.session.usuario) {
        return res.status(401).json({
            error:   true,
            mensaje: 'Acceso no autorizado. Inicia sesión para continuar.',
            codigo:  401
        });
    }

    // Poner el usuario en req para que los controllers lo usen sin leer la sesión
    req.usuario = req.session.usuario;
    next();
}

module.exports = { verificarSesion };
