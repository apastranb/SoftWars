// ==========================================================================
// HELPERS DE RESPUESTA Y ERROR — utils/respuestas.js
// Responsable: Josué Arroyo (SW-12)
//
// Complementa a middleware/errores.js (Carlos, SW-6). Ese middleware ya
// define el formato de la respuesta de error:
//     { error: true, mensaje: "...", codigo: 400 }
//
// Este módulo solo construye los objetos Error con .status y .mensaje para
// que los controllers hagan `next(errorSolicitud('...'))` en vez de armar
// la respuesta a mano. Las respuestas exitosas se envían tal cual (array u
// objeto), que es el contrato que espera public/js/api.js (Carlos, SW-18).
// ==========================================================================

/**
 * Construye un Error con código HTTP y mensaje para el middleware de errores.
 * @param {number} status - Código HTTP.
 * @param {string} mensaje - Mensaje legible para el usuario final.
 * @param {object} [extra] - Datos adicionales (ej. { campos: {...} }).
 * @returns {Error}
 */
function crearError(status, mensaje, extra = {}) {
    const error = new Error(mensaje);
    error.status = status;
    error.mensaje = mensaje;
    Object.assign(error, extra);
    return error;
}

/** 400 — El cliente envió datos inválidos. */
const errorSolicitud = (mensaje, extra) => crearError(400, mensaje, extra);

/** 401 — No hay sesión activa o las credenciales son incorrectas. */
const errorNoAutorizado = (mensaje = 'No tiene autorización. Inicie sesión.') =>
    crearError(401, mensaje);

/** 404 — El documento solicitado no existe. */
const errorNoEncontrado = (mensaje = 'El recurso solicitado no existe.') =>
    crearError(404, mensaje);

/** 409 — Conflicto: duplicado o regla de negocio que impide la operación. */
const errorConflicto = (mensaje, extra) => crearError(409, mensaje, extra);

/** 503 — Dependencia no disponible (por ejemplo, MongoDB caído). */
const errorNoDisponible = (mensaje = 'El servicio no está disponible en este momento.') =>
    crearError(503, mensaje);

/**
 * Construye el error 400 de validación con el detalle campo por campo,
 * usando los mismos textos que muestra el cliente en validaciones.js.
 * @param {object} campos - { nombreCampo: 'mensaje de error' }
 * @returns {Error} Error 400 con la propiedad `campos`.
 */
function errorValidacion(campos) {
    const primero = Object.values(campos)[0];
    return errorSolicitud(primero || 'Los datos enviados no son válidos.', { campos });
}

/**
 * Envuelve un controller asíncrono para que cualquier excepción llegue al
 * middleware de errores sin necesidad de try/catch en cada endpoint.
 *
 * Uso:  router.get('/', asyncHandler(controller.listar));
 *
 * @param {Function} fn - Controller async (req, res, next).
 * @returns {Function} Middleware de Express.
 */
function asyncHandler(fn) {
    return function (req, res, next) {
        Promise.resolve(fn(req, res, next)).catch(next);
    };
}

module.exports = {
    crearError,
    errorSolicitud,
    errorNoAutorizado,
    errorNoEncontrado,
    errorConflicto,
    errorNoDisponible,
    errorValidacion,
    asyncHandler
};
