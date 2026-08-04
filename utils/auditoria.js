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

module.exports = { sellarAuditoria, sellarActualizacion, auditoriaMiddleware };
