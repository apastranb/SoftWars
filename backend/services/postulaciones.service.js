// ==========================================================================
// SERVICE: POSTULACIONES — backend/services/postulaciones.service.js
// Operaciones de MongoDB para la colección postulaciones.
// Responsable original: Josué Arroyo (SW-17)
// ==========================================================================

const { getDB } = require('../config/db');
const { siguienteCodigo } = require('../utils/codigos');
const { filtroPorId, conAlias, conAliasLista, busquedaTexto, aObjectId } = require('../utils/mongo');
const { sellarAuditoria, sellarActualizacion } = require('../utils/auditoria');
const { errorConflicto, errorValidacion } = require('../utils/respuestas');
const v = require('../utils/validaciones.server');
const { ESTADOS_POSTULACION } = require('../utils/catalogos');
const { COLECCION, ESTADOS_QUE_BLOQUEAN, ESTADO_DEFAULT } = require('../models/postulacion.model');
const { ESTADOS: ESTADOS_ORADOR } = require('../models/orador.model');

// ==========================================================================
// OPERACIONES CRUD
// ==========================================================================

/**
 * GET — Listar postulaciones con filtros (bandeja administrativa).
 */
async function listarPostulaciones(filtros = {}) {
    const { q, estado, actividadId, eventoId } = filtros;
    const filtro = {};

    if (q && q.trim()) {
        const texto = busquedaTexto(q);
        filtro.$or = [
            { nombre: texto }, { correo: texto },
            { especialidad: texto }, { organizacion: texto }, { codigo: texto }
        ];
    }
    if (estado) filtro.estado = v.normalizarCatalogo(estado, ESTADOS_POSTULACION, estado);
    if (actividadId) filtro.actividadId = aObjectId(actividadId) || actividadId;
    if (eventoId) filtro.eventoId = aObjectId(eventoId) || eventoId;

    const postulaciones = await getDB().collection(COLECCION)
        .find(filtro)
        .sort({ fechaPostulacion: -1 })
        .toArray();

    return conAliasLista(postulaciones);
}

/**
 * GET — Obtener una postulación por _id o código legible.
 */
async function obtenerPostulacion(id) {
    const postulacion = await getDB().collection(COLECCION).findOne(filtroPorId(id));
    if (!postulacion) return null;
    return conAlias(postulacion);
}

/**
 * POST — Crear postulación pública (RF-24, RF-25).
 */
async function crearPostulacion(datos) {
    const db = getDB();
    const coleccion = db.collection(COLECCION);

    // La actividad debe existir
    const actividadIdRecibido = datos.actividadId;
    const objectId = aObjectId(actividadIdRecibido);
    const actividad = await db.collection('actividades').findOne(
        objectId ? { _id: objectId } : { codigo: String(actividadIdRecibido) }
    );
    if (!actividad) {
        throw errorValidacion({ actividad: 'La actividad seleccionada no existe.' });
    }

    const correo = v.normalizarCorreo(datos.correo);

    // RF-25 — prevención de duplicados
    const duplicada = await coleccion.findOne({
        correo,
        actividadId: actividad._id,
        estado: { $in: ESTADOS_QUE_BLOQUEAN }
    });
    if (duplicada) {
        throw errorConflicto(
            `El correo ${correo} ya tiene una postulación registrada para la actividad "${actividad.nombre}". ` +
            'Puede postularse a otra actividad con el mismo correo.'
        );
    }

    const telefonos = v.extraerTelefonos(datos);
    const organizacion = datos.organizacion !== undefined ? datos.organizacion : datos.empresa;

    const documento = {
        codigo: await siguienteCodigo('PT', COLECCION),
        nombre: v.limpiar(datos.nombre),
        correo,
        telefonos,
        telefono: telefonos[0],
        especialidad: v.limpiar(datos.especialidad),
        organizacion: v.limpiar(organizacion),
        empresa: v.limpiar(organizacion),
        biografia: v.limpiar(datos.biografia),
        foto: datos.foto || null,
        actividadId: actividad._id,
        eventoId: actividad.eventoId || null,
        estado: ESTADO_DEFAULT,
        fechaPostulacion: new Date()
    };

    const resultado = await coleccion.insertOne(documento);
    return conAlias({ _id: resultado.insertedId, ...documento });
}

/**
 * PATCH — Aprobar postulación (HU-10). Crea orador si no existe.
 */
async function aprobarPostulacion(id, req) {
    const db = getDB();
    const coleccion = db.collection(COLECCION);
    const postulacion = await coleccion.findOne(filtroPorId(id));
    if (!postulacion) return { encontrado: false };

    if (postulacion.estado !== 'Pendiente') {
        throw errorConflicto(
            `Esta postulación ya fue procesada (estado actual: ${postulacion.estado}). ` +
            'Solo se pueden aprobar postulaciones pendientes.'
        );
    }

    const oradores = db.collection('oradores');
    let orador = await oradores.findOne({ correo: postulacion.correo });
    let creado = false;

    if (!orador) {
        const documento = {
            codigo: await siguienteCodigo('OR', 'oradores'),
            nombre: postulacion.nombre,
            correo: postulacion.correo,
            telefonos: postulacion.telefonos || [],
            telefono: postulacion.telefono || '',
            especialidad: postulacion.especialidad,
            empresa: postulacion.organizacion,
            biografia: postulacion.biografia,
            foto: postulacion.foto || null,
            eventoId: postulacion.eventoId || null,
            estado: ESTADOS_ORADOR[0], // 'Activo'
            fechaRegistro: new Date(),
            origenPostulacionId: postulacion._id,
            ...sellarAuditoria(req)
        };
        const resultado = await oradores.insertOne(documento);
        orador = { _id: resultado.insertedId, ...documento };
        creado = true;
    }

    await coleccion.updateOne(
        { _id: postulacion._id },
        {
            $set: {
                estado: 'Aprobada',
                fechaResolucion: new Date(),
                oradorId: orador._id,
                resueltaPor: (req.session && req.session.usuario && req.session.usuario.email) || null
            }
        }
    );

    return {
        encontrado: true,
        postulacion: conAlias({ ...postulacion, estado: 'Aprobada', oradorId: orador._id }),
        orador: conAlias(orador),
        oradorCreado: creado
    };
}

/**
 * PATCH — Rechazar postulación (HU-10).
 */
async function rechazarPostulacion(id, motivo, req) {
    const coleccion = getDB().collection(COLECCION);
    const postulacion = await coleccion.findOne(filtroPorId(id));
    if (!postulacion) return { encontrado: false };

    if (postulacion.estado !== 'Pendiente') {
        throw errorConflicto(
            `Esta postulación ya fue procesada (estado actual: ${postulacion.estado}). ` +
            'Solo se pueden rechazar postulaciones pendientes.'
        );
    }

    await coleccion.updateOne(
        { _id: postulacion._id },
        {
            $set: {
                estado: 'Rechazada',
                motivoRechazo: motivo || null,
                fechaResolucion: new Date(),
                resueltaPor: (req.session && req.session.usuario && req.session.usuario.email) || null
            }
        }
    );

    return {
        encontrado: true,
        postulacion: conAlias({ ...postulacion, estado: 'Rechazada', motivoRechazo: motivo || null })
    };
}

/**
 * DELETE — Eliminar postulación.
 */
async function eliminarPostulacion(id) {
    const coleccion = getDB().collection(COLECCION);
    const postulacion = await coleccion.findOne(filtroPorId(id));
    if (!postulacion) return { encontrado: false };

    await coleccion.deleteOne({ _id: postulacion._id });
    return { encontrado: true, nombre: postulacion.nombre, codigo: postulacion.codigo };
}

module.exports = {
    listarPostulaciones,
    obtenerPostulacion,
    crearPostulacion,
    aprobarPostulacion,
    rechazarPostulacion,
    eliminarPostulacion
};
