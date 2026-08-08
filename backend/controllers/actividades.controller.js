// ==========================================================================
// CONTROLLER DE ACTIVIDADES — controllers/actividades.controller.js
// Responsable: Carlos Carballo (SW-13)
//
// Requerimientos que implementa:
//   RF-05  Crear subeventos vinculados a un evento padre.
//   RF-07  Categorías restringidas (mismas 6 del evento).
//   RF-08  Estados automáticos: Disponible → Llena al llenarse el cupo,
//          Finalizada al pasar la fecha.
//   RF-09  Métricas de cupo (máximo, ocupado, disponible).
//   RF-10  Entrada libre (no se controla cupo).
//   RF-13  RF-19 — Búsqueda por nombre, lugar, ID.
//   RF-26  Conflicto de horario de oradores al asignar responsable.
//   RF-29  Metadatos de auditoría.
// ==========================================================================

const { ObjectId } = require('mongodb');
const { getDB } = require('../config/db');
const { siguienteCodigo } = require('../utils/codigos');
const { filtroPorId, conAlias, conAliasLista, busquedaTexto, aObjectId } = require('../utils/mongo');
const {
    errorNoEncontrado, errorConflicto, errorValidacion, errorSolicitud
} = require('../utils/respuestas');
const v = require('../utils/validaciones.server');
const { CATEGORIAS_ACTIVIDAD, ESTADOS_EVENTO } = require('../utils/catalogos');
const { aplicarAuditoria, aplicarAuditoriaSet } = require('../utils/auditoria');

const COLECCION = 'actividades';

// ── LISTAR ACTIVIDADES ──────────────────────────────────────────────────────
// GET /api/actividades
// Query params: eventoId, categoria, estado, q (búsqueda texto)

async function listar(req, res, next) {
    const db = getDB();
    const { eventoId, categoria, estado, q } = req.query;
    const filtro = {};

    if (eventoId) {
        const oid = aObjectId(eventoId);
        filtro.eventoId = oid || eventoId;
    }
    if (categoria) filtro.categoria = { $regex: new RegExp(`^${v.limpiar(categoria)}$`, 'i') };
    if (estado) filtro.estado = { $regex: new RegExp(`^${v.limpiar(estado)}$`, 'i') };

    if (q && q.trim().length >= 3) {
        const regex = busquedaTexto(q);
        filtro.$or = [
            { nombre: regex },
            { lugar: regex },
            { categoria: regex }
        ];
    }

    const actividades = await db.collection(COLECCION)
        .find(filtro)
        .sort({ fecha: 1, horaInicio: 1 })
        .toArray();

    res.json({ data: conAliasLista(actividades) });
}

// ── OBTENER UNA ACTIVIDAD ───────────────────────────────────────────────────
// GET /api/actividades/:id

async function obtener(req, res, next) {
    const db = getDB();
    const filtro = filtroPorId(req.params.id);

    const actividad = await db.collection(COLECCION).findOne(filtro);
    if (!actividad) return next(errorNoEncontrado('La actividad solicitada no existe.'));

    // Incluir datos del responsable si existe
    let responsable = null;
    if (actividad.responsableId) {
        responsable = await db.collection('oradores').findOne({ _id: actividad.responsableId });
    }

    res.json({
        data: {
            ...conAlias(actividad),
            responsable: responsable ? conAlias(responsable) : null
        }
    });
}

// ── CREAR ACTIVIDAD ─────────────────────────────────────────────────────────
// POST /api/actividades

async function crear(req, res, next) {
    const db = getDB();
    const body = req.body;

    // Validaciones
    const errores = {};

    if (!v.validarRequerido(body.eventoId)) errores.eventoId = 'El evento padre es requerido.';
    if (!v.validarRequerido(body.nombre)) errores.nombre = 'El nombre es requerido.';
    else if (!v.validarNombre(body.nombre)) errores.nombre = 'El nombre debe tener al menos 3 caracteres.';

    if (!v.validarRequerido(body.categoria)) errores.categoria = 'La categoría es requerida.';
    else if (!v.validarEnCatalogo(body.categoria, CATEGORIAS_ACTIVIDAD)) errores.categoria = 'Categoría no válida.';

    if (!v.validarDescripcion(body.descripcion)) errores.descripcion = 'La descripción no puede superar los 200 caracteres.';

    if (!v.validarRequerido(body.fecha)) errores.fecha = 'La fecha es requerida.';
    if (!v.validarRequerido(body.horaInicio)) errores.horaInicio = 'La hora de inicio es requerida.';
    if (!v.validarRequerido(body.horaFin)) errores.horaFin = 'La hora de fin es requerida.';
    if (body.horaInicio && body.horaFin && !v.validarHorasOrden(body.horaInicio, body.horaFin)) {
        errores.horaFin = 'La hora de fin debe ser posterior a la de inicio.';
    }

    if (!v.validarRequerido(body.lugar)) errores.lugar = 'El lugar es requerido.';

    // Cupo: requerido a menos que sea entrada libre
    const entradaLibre = Boolean(body.entradaLibre);
    if (!entradaLibre && body.cupoMaximo !== undefined && !v.validarCupo(body.cupoMaximo)) {
        errores.cupoMaximo = 'Ingrese un cupo válido (número entero positivo).';
    }

    if (Object.keys(errores).length > 0) return next(errorValidacion(errores));

    // Verificar que el evento padre exista
    const eventoOid = aObjectId(body.eventoId);
    const filtroEvento = eventoOid ? { _id: eventoOid } : { codigo: body.eventoId };
    const eventoPadre = await db.collection('eventos').findOne(filtroEvento);
    if (!eventoPadre) return next(errorSolicitud('El evento padre no existe.'));

    // Verificar que la fecha esté dentro del rango del evento padre
    if (body.fecha) {
        const fechaAct = new Date(body.fecha + 'T00:00:00');
        const fechaIni = new Date(eventoPadre.fechaInicio + 'T00:00:00');
        const fechaFin = new Date(eventoPadre.fechaFin + 'T00:00:00');
        if (fechaAct < fechaIni || fechaAct > fechaFin) {
            return next(errorSolicitud('La fecha de la actividad debe estar dentro del rango del evento padre.'));
        }
    }

    // RF-26: Verificar conflicto de horario del orador si se asigna responsable
    if (body.responsableId) {
        const conflicto = await verificarConflictoOrador(db, body.responsableId, body.fecha, body.horaInicio, body.horaFin);
        if (conflicto) return next(errorConflicto(conflicto));
    }

    // Generar código
    const codigo = await siguienteCodigo('ACT', COLECCION);
    const categoriaNormalizada = v.normalizarCatalogo(body.categoria, CATEGORIAS_ACTIVIDAD);

    const documento = aplicarAuditoria({
        codigo,
        eventoId: eventoPadre._id,
        nombre: v.limpiar(body.nombre),
        categoria: categoriaNormalizada,
        descripcion: v.limpiar(body.descripcion) || '',
        fecha: body.fecha,
        horaInicio: body.horaInicio,
        horaFin: body.horaFin,
        lugar: v.limpiar(body.lugar),
        cupoMaximo: entradaLibre ? 0 : (parseInt(body.cupoMaximo, 10) || 0),
        cupoOcupado: 0,
        responsableId: body.responsableId ? (aObjectId(body.responsableId) || body.responsableId) : null,
        estado: 'Disponible',
        visibilidad: v.limpiar(body.visibilidad).toLowerCase() || 'publica',
        entradaLibre,
        incluyeRefrigerio: Boolean(body.incluyeRefrigerio)
    }, req, { esCreacion: true });

    const resultado = await db.collection(COLECCION).insertOne(documento);
    documento._id = resultado.insertedId;

    res.status(201).json({ data: conAlias(documento), mensaje: 'Actividad creada correctamente.' });
}

// ── ACTUALIZAR ACTIVIDAD ────────────────────────────────────────────────────
// PUT /api/actividades/:id

async function actualizar(req, res, next) {
    const db = getDB();
    const filtro = filtroPorId(req.params.id);
    const body = req.body;

    const existente = await db.collection(COLECCION).findOne(filtro);
    if (!existente) return next(errorNoEncontrado('La actividad solicitada no existe.'));

    // Validaciones parciales
    const errores = {};
    if (body.nombre !== undefined && !v.validarNombre(body.nombre)) errores.nombre = 'El nombre debe tener al menos 3 caracteres.';
    if (body.categoria !== undefined && !v.validarEnCatalogo(body.categoria, CATEGORIAS_ACTIVIDAD)) errores.categoria = 'Categoría no válida.';
    if (body.descripcion !== undefined && !v.validarDescripcion(body.descripcion)) errores.descripcion = 'La descripción no puede superar los 200 caracteres.';
    if (body.horaInicio && body.horaFin && !v.validarHorasOrden(body.horaInicio, body.horaFin)) errores.horaFin = 'La hora de fin debe ser posterior a la de inicio.';

    // RF-09: cupoOcupado no se puede editar manualmente
    if (body.cupoOcupado !== undefined) {
        errores.cupoOcupado = 'El cupo ocupado no se puede modificar directamente.';
    }

    if (Object.keys(errores).length > 0) return next(errorValidacion(errores));

    // RF-26: Si se cambia el responsable, verificar conflicto de horario
    if (body.responsableId && body.responsableId !== String(existente.responsableId)) {
        const fecha = body.fecha || existente.fecha;
        const horaInicio = body.horaInicio || existente.horaInicio;
        const horaFin = body.horaFin || existente.horaFin;
        const conflicto = await verificarConflictoOrador(db, body.responsableId, fecha, horaInicio, horaFin, existente._id);
        if (conflicto) return next(errorConflicto(conflicto));
    }

    // Lista blanca de campos
    const camposPermitidos = [
        'nombre', 'categoria', 'descripcion', 'fecha', 'horaInicio', 'horaFin',
        'lugar', 'cupoMaximo', 'responsableId', 'estado', 'visibilidad',
        'entradaLibre', 'incluyeRefrigerio'
    ];

    const $set = aplicarAuditoriaSet({}, req);
    camposPermitidos.forEach(campo => {
        if (body[campo] !== undefined) {
            if (campo === 'categoria') {
                $set[campo] = v.normalizarCatalogo(body[campo], CATEGORIAS_ACTIVIDAD) || existente.categoria;
            } else if (campo === 'cupoMaximo') {
                $set[campo] = parseInt(body[campo], 10);
            } else if (campo === 'entradaLibre' || campo === 'incluyeRefrigerio') {
                $set[campo] = Boolean(body[campo]);
            } else if (campo === 'responsableId') {
                $set[campo] = aObjectId(body[campo]) || body[campo] || null;
            } else if (campo === 'visibilidad') {
                $set[campo] = v.limpiar(body[campo]).toLowerCase();
            } else if (typeof body[campo] === 'string') {
                $set[campo] = v.limpiar(body[campo]);
            } else {
                $set[campo] = body[campo];
            }
        }
    });

    // RF-08: Recalcular estado si cupo se modifica
    const cupoMax = $set.cupoMaximo || existente.cupoMaximo;
    const esLibre = $set.entradaLibre !== undefined ? $set.entradaLibre : existente.entradaLibre;
    if (!esLibre && cupoMax > 0 && existente.cupoOcupado >= cupoMax) {
        $set.estado = 'Llena';
    }

    await db.collection(COLECCION).updateOne(filtro, { $set });

    const actualizada = await db.collection(COLECCION).findOne(filtro);
    res.json({ data: conAlias(actualizada), mensaje: 'Actividad actualizada correctamente.' });
}

// ── ELIMINAR ACTIVIDAD ──────────────────────────────────────────────────────
// DELETE /api/actividades/:id
// No se puede eliminar si tiene inscripciones activas.

async function eliminar(req, res, next) {
    const db = getDB();
    const filtro = filtroPorId(req.params.id);

    const existente = await db.collection(COLECCION).findOne(filtro);
    if (!existente) return next(errorNoEncontrado('La actividad solicitada no existe.'));

    // Verificar participantes inscritos en esta actividad
    const inscritos = await db.collection('participantes').countDocuments({
        actividades: existente._id,
        estado: 'Activo'
    });

    if (inscritos > 0) {
        return next(errorConflicto(
            `No se puede eliminar: hay ${inscritos} participante(s) inscrito(s) en esta actividad.`
        ));
    }

    await db.collection(COLECCION).deleteOne(filtro);
    res.json({ mensaje: 'Actividad eliminada correctamente.' });
}

// ── HELPERS INTERNOS ────────────────────────────────────────────────────────

/**
 * RF-26: Verifica que un orador no esté asignado a otra actividad en el mismo
 * horario y fecha. Retorna un mensaje de error si hay conflicto, o null si no.
 *
 * @param {object} db - Instancia de la BD
 * @param {string} responsableId - ID del orador a verificar
 * @param {string} fecha - Fecha de la actividad
 * @param {string} horaInicio - Hora de inicio
 * @param {string} horaFin - Hora de fin
 * @param {ObjectId} [excluirId] - ID de actividad a excluir (para edición)
 * @returns {string|null} Mensaje de conflicto o null
 */
async function verificarConflictoOrador(db, responsableId, fecha, horaInicio, horaFin, excluirId = null) {
    const oid = aObjectId(responsableId);
    const filtro = {
        responsableId: oid || responsableId,
        fecha: fecha,
        estado: { $in: ['Disponible', 'Llena'] },
        // Superposición de horario: A empieza antes de que B termine Y A termina después de que B empiece
        horaInicio: { $lt: horaFin },
        horaFin: { $gt: horaInicio }
    };

    if (excluirId) {
        filtro._id = { $ne: excluirId };
    }

    const conflicto = await db.collection(COLECCION).findOne(filtro);
    if (conflicto) {
        return `El orador ya está asignado a "${conflicto.nombre}" (${conflicto.horaInicio}-${conflicto.horaFin}) en la misma fecha.`;
    }
    return null;
}

module.exports = { listar, obtener, crear, actualizar, eliminar };
