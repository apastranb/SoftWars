// ==========================================================================
// UTILIDADES DE AUDITORÍA — utils/auditoria.js
// Centraliza los metadatos que se escriben en cada registro nuevo o edición.
// ==========================================================================

function obtenerIdentidad(req) {
    const usuario = req && req.session && req.session.usuario ? req.session.usuario : null;
    if (!usuario) return null;

    return usuario._id || usuario.id || usuario.correo || null;
}

function aplicarAuditoria(documento, req, opciones = {}) {
    const copia = { ...(documento || {}) };
    const esCreacion = opciones.esCreacion !== false;

    if (esCreacion) {
        const ahora = copia.createdAt || new Date();
        copia.createdAt = ahora;
        copia.updatedAt = copia.updatedAt || ahora;
        copia.createdBy = copia.createdBy ?? obtenerIdentidad(req);
    } else {
        copia.updatedAt = copia.updatedAt || new Date();
    }

    return copia;
}

function aplicarAuditoriaSet($set = {}, req) {
    const actualizacion = { ...$set, updatedAt: new Date() };
    const actor = obtenerIdentidad(req);
    if (actor) {
        actualizacion.updatedBy = actor;
    }
    return actualizacion;
}

module.exports = {
    aplicarAuditoria,
    aplicarAuditoriaSet,
    obtenerIdentidad
};
