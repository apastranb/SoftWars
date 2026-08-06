// ==========================================================================
// AUDITORÍA DE REGISTROS — utils/auditoria.js
// Responsable: Adonis Pastrana (SW-19)
//
// RF-29: Cada documento creado o modificado debe almacenar automáticamente:
//   createdAt  → fecha/hora de creación (solo se asigna en INSERT)
//   updatedAt  → fecha/hora de la última modificación (se actualiza siempre)
//   createdBy  → ObjectId del administrador que originó el registro,
//                o null si el origen es público (inscripción / postulación)
//
// Uso en controllers:
//
//   const { sellarAuditoria, sellarActualizacion } = require('../utils/auditoria');
//
//   // Al crear:
//   const documento = { nombre: '...', ...sellarAuditoria(req) };
//
//   // Al actualizar (dentro del $set):
//   await col.updateOne(filtro, { $set: { ...campos, ...sellarActualizacion() } });
//
// El middleware `auditoriaMiddleware` (exportado al final) puede usarse en
// server.js para inyectar req.auditoriaTs una sola vez por petición, de modo
// que todos los documentos creados en la misma solicitud compartan el mismo
// timestamp exacto.
// ==========================================================================

const { ObjectId } = require('mongodb');

/**
 * Construye los tres campos de auditoría para un INSERT.
 *
 * @param {object} [req] - Objeto de petición de Express (opcional).
 *   Si se proporciona, extrae el ID del administrador desde req.session.usuario.
 * @returns {{ createdAt: Date, updatedAt: Date, createdBy: ObjectId|null }}
 */
function sellarAuditoria(req) {
    const ahora = (req && req.auditoriaTs) ? req.auditoriaTs : new Date();
    let createdBy = null;

    if (req && req.session && req.session.usuario && req.session.usuario._id) {
        try {
            createdBy = new ObjectId(req.session.usuario._id);
        } catch {
            createdBy = req.session.usuario._id; // si ya es string o tipo desconocido
        }
    }

    return {
        createdAt: ahora,
        updatedAt: ahora,
        createdBy
    };
}

/**
 * Construye el campo de auditoría para un UPDATE.
 * Solo actualiza updatedAt; createdAt y createdBy permanecen intactos.
 *
 * @param {object} [req] - Objeto de petición de Express (opcional).
 * @returns {{ updatedAt: Date }}
 */
function sellarActualizacion(req) {
    const ahora = (req && req.auditoriaTs) ? req.auditoriaTs : new Date();
    return { updatedAt: ahora };
}

/**
 * Middleware de Express que captura el timestamp al inicio de cada petición.
 * Esto garantiza que todos los documentos creados en la misma solicitud HTTP
 * usen exactamente el mismo instante (útil en operaciones que crean varios
 * documentos a la vez, como una inscripción con múltiples actividades).
 *
 * Registro en server.js (antes de las rutas):
 *   const { auditoriaMiddleware } = require('./utils/auditoria');
 *   app.use(auditoriaMiddleware);
 */
function auditoriaMiddleware(req, res, next) {
    req.auditoriaTs = new Date();
    next();
}

// ==========================================================================
// ADAPTADORES PARA LOS CONTROLLERS DE EVENTOS Y ACTIVIDADES
//
// eventos.controller.js y actividades.controller.js (Carlos, SW-9 y SW-13)
// llaman a `aplicarAuditoria(documento, req, opciones)` y
// `aplicarAuditoriaSet(campos, req)`, que devuelven el documento YA fusionado
// con los campos de auditoría, en vez de solo los campos sueltos.
//
// Esos nombres nunca existieron en este archivo, así que las cuatro
// operaciones que los usaban (crear y editar evento, crear y editar
// actividad) respondían HTTP 500 con "aplicarAuditoria is not a function".
// Se agregan aquí como envoltorios de las funciones originales para no tener
// que modificar los dos controllers.
// ==========================================================================

/**
 * Devuelve el documento con los campos de auditoría de creación incorporados.
 * @param {object} documento - Campos del documento a insertar.
 * @param {object} [req] - Petición de Express, para extraer el administrador.
 * @returns {object} El documento con createdAt, updatedAt y createdBy.
 */
function aplicarAuditoria(documento, req) {
    return { ...documento, ...sellarAuditoria(req) };
}

/**
 * Devuelve el objeto de campos con `updatedAt` incorporado, listo para usarse
 * dentro de un `$set`. No toca createdAt ni createdBy.
 * @param {object} campos - Campos que se van a actualizar.
 * @param {object} [req] - Petición de Express.
 * @returns {object} Los campos más updatedAt.
 */
function aplicarAuditoriaSet(campos, req) {
    return { ...campos, ...sellarActualizacion(req) };
}

module.exports = {
    sellarAuditoria,
    sellarActualizacion,
    auditoriaMiddleware,
    aplicarAuditoria,
    aplicarAuditoriaSet
};
