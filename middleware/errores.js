// ==========================================================================
// MANEJO CENTRALIZADO DE ERRORES — middleware/errores.js
// Responsable: Carlos Carballo (SW-6)
//
// Este middleware captura errores lanzados por los controllers o por
// middleware anteriores y devuelve una respuesta JSON uniforme.
// ==========================================================================

/**
 * Middleware de manejo de errores de Express.
 * Se registra como último app.use() en server.js.
 */
function manejarError(err, req, res, next) {
    const status = err.status || 500;
    const mensaje = err.mensaje || err.message || 'Error interno del servidor';

    // Log en consola para depuración (no se expone al cliente)
    console.error(`[ERROR ${status}] ${req.method} ${req.originalUrl} — ${mensaje}`);

    res.status(status).json({
        error: true,
        mensaje: mensaje,
        codigo: status
    });
}

module.exports = { manejarError };
