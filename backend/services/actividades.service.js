// ==========================================================================
// SERVICE: ACTIVIDADES — backend/services/actividades.service.js
// ==========================================================================

const { ObjectId } = require('mongodb');
const { getDB } = require('../config/db');
const { siguienteCodigo } = require('../utils/codigos');
const { filtroPorId, conAlias, conAliasLista, busquedaTexto, aObjectId } = require('../utils/mongo');
const { aplicarAuditoria, aplicarAuditoriaSet } = require('../utils/auditoria');
const v = require('../utils/validaciones.server');
const { CATEGORIAS_ACTIVIDAD } = require('../utils/catalogos');
const { COLECCION, CAMPOS_PERMITIDOS_EDICION, ESTADO_DEFAULT } = require('../models/actividad.model');

async function listarActividades(filtros = {}) {
    const db = getDB();
    const { eventoId, categoria, estado, q } = filtros;
    const filtro = {};

    if (eventoId) {
        const oid = aObjectId(eventoId);
        filtro.eventoId = oid || eventoId;
    }
    if (categoria) filtro.categoria = { $regex: new RegExp(`^${v.limpiar(categoria)}$`, 'i') };
    if (estado) filtro.estado = { $regex: new RegExp(`^${v.limpiar(estado)}$`, 'i') };

    if (q && q.trim().length >= 3) {
        const regex = busquedaTexto(q);
        filtro.$or = [{ nombre: regex }, { lugar: regex }, { categoria: regex }];
    }

    const actividades = await db.collection(COLECCION).find(filtro).sort({ fecha: 1, horaInicio: 1 }).toArray();
    return conAliasLista(actividades);
}

async function obtenerActividad(id) {
    const db = getDB();
    const actividad = await db.collection(COLECCION).findOne(filtroPorId(id));
    if (!actividad) return null;

    let responsable = null;
    if (actividad.responsableId) {
        responsable = await db.collection('oradores').findOne({ _id: actividad.responsableId });
    }

    return { ...conAlias(actividad), responsable: responsable ? conAlias(responsable) : null };
}

async function crearActividad(datos, req) {
    const db = getDB();

    // Verificar evento padre
    const eventoOid = aObjectId(datos.eventoId);
    const filtroEvento = eventoOid ? { _id: eventoOid } : { codigo: datos.eventoId };
    const eventoPadre = await db.collection('eventos').findOne(filtroEvento);
    if (!eventoPadre) return { error: 'El evento padre no existe.' };

    // Verificar rango de fechas
    if (datos.fecha) {
        const fechaAct = new Date(datos.fecha + 'T00:00:00');
        const fechaIni = new Date(eventoPadre.fechaInicio + 'T00:00:00');
        const fechaFin = new Date(eventoPadre.fechaFin + 'T00:00:00');
        if (fechaAct < fechaIni || fechaAct > fechaFin) {
            return { error: 'La fecha de la actividad debe estar dentro del rango del evento padre.' };
        }
    }

    // RF-26: Conflicto horario del orador
    if (datos.responsableId) {
        const conflicto = await verificarConflictoOrador(db, datos.responsableId, datos.fecha, datos.horaInicio, datos.horaFin);
        if (conflicto) return { error: conflicto };
    }

    const entradaLibre = Boolean(datos.entradaLibre);
    const codigo = await siguienteCodigo('ACT', COLECCION);

    const documento = aplicarAuditoria({
        codigo,
        eventoId: eventoPadre._id,
        nombre: v.limpiar(datos.nombre),
        categoria: v.normalizarCatalogo(datos.categoria, CATEGORIAS_ACTIVIDAD),
        descripcion: v.limpiar(datos.descripcion) || '',
        fecha: datos.fecha,
        horaInicio: datos.horaInicio,
        horaFin: datos.horaFin,
        lugar: v.limpiar(datos.lugar),
        cupoMaximo: entradaLibre ? 0 : (parseInt(datos.cupoMaximo, 10) || 0),
        cupoOcupado: 0,
        responsableId: datos.responsableId ? (aObjectId(datos.responsableId) || datos.responsableId) : null,
        estado: ESTADO_DEFAULT,
        visibilidad: v.limpiar(datos.visibilidad).toLowerCase() || 'publica',
        entradaLibre,
        incluyeRefrigerio: Boolean(datos.incluyeRefrigerio)
    }, req, { esCreacion: true });

    const resultado = await db.collection(COLECCION).insertOne(documento);
    documento._id = resultado.insertedId;
    return { data: conAlias(documento) };
}

async function actualizarActividad(id, datos, req) {
    const db = getDB();
    const filtro = filtroPorId(id);
    const existente = await db.collection(COLECCION).findOne(filtro);
    if (!existente) return null;

    // RF-26: Conflicto horario si cambia responsable
    if (datos.responsableId && datos.responsableId !== String(existente.responsableId)) {
        const fecha = datos.fecha || existente.fecha;
        const horaInicio = datos.horaInicio || existente.horaInicio;
        const horaFin = datos.horaFin || existente.horaFin;
        const conflicto = await verificarConflictoOrador(db, datos.responsableId, fecha, horaInicio, horaFin, existente._id);
        if (conflicto) return { error: conflicto };
    }

    const $set = aplicarAuditoriaSet({}, req);
    CAMPOS_PERMITIDOS_EDICION.forEach(campo => {
        if (datos[campo] !== undefined) {
            if (campo === 'categoria') {
                $set[campo] = v.normalizarCatalogo(datos[campo], CATEGORIAS_ACTIVIDAD) || existente.categoria;
            } else if (campo === 'cupoMaximo') {
                $set[campo] = parseInt(datos[campo], 10);
            } else if (campo === 'entradaLibre' || campo === 'incluyeRefrigerio') {
                $set[campo] = Boolean(datos[campo]);
            } else if (campo === 'responsableId') {
                $set[campo] = aObjectId(datos[campo]) || datos[campo] || null;
            } else if (campo === 'visibilidad') {
                $set[campo] = v.limpiar(datos[campo]).toLowerCase();
            } else if (typeof datos[campo] === 'string') {
                $set[campo] = v.limpiar(datos[campo]);
            } else {
                $set[campo] = datos[campo];
            }
        }
    });

    // RF-08: Recalcular estado
    const cupoMax = $set.cupoMaximo || existente.cupoMaximo;
    const esLibre = $set.entradaLibre !== undefined ? $set.entradaLibre : existente.entradaLibre;
    if (!esLibre && cupoMax > 0 && existente.cupoOcupado >= cupoMax) {
        $set.estado = 'Llena';
    }

    await db.collection(COLECCION).updateOne(filtro, { $set });
    const actualizada = await db.collection(COLECCION).findOne(filtro);
    return { data: conAlias(actualizada) };
}

async function eliminarActividad(id) {
    const db = getDB();
    const filtro = filtroPorId(id);
    const existente = await db.collection(COLECCION).findOne(filtro);
    if (!existente) return { encontrado: false };

    const inscritos = await db.collection('participantes').countDocuments({
        actividades: existente._id, estado: 'Activo'
    });

    if (inscritos > 0) {
        return { encontrado: true, bloqueado: true, inscritos };
    }

    await db.collection(COLECCION).deleteOne(filtro);
    return { encontrado: true, bloqueado: false };
}

// ── HELPER: RF-26 Conflicto horario de orador ───────────────────────────────

async function verificarConflictoOrador(db, responsableId, fecha, horaInicio, horaFin, excluirId = null) {
    const oid = aObjectId(responsableId);
    const filtro = {
        responsableId: oid || responsableId,
        fecha: fecha,
        estado: { $in: ['Disponible', 'Llena'] },
        horaInicio: { $lt: horaFin },
        horaFin: { $gt: horaInicio }
    };
    if (excluirId) filtro._id = { $ne: excluirId };

    const conflicto = await db.collection(COLECCION).findOne(filtro);
    if (conflicto) {
        return `El orador ya está asignado a "${conflicto.nombre}" (${conflicto.horaInicio}-${conflicto.horaFin}) en la misma fecha.`;
    }
    return null;
}

module.exports = { listarActividades, obtenerActividad, crearActividad, actualizarActividad, eliminarActividad };
