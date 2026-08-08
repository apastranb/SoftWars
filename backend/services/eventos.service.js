// ==========================================================================
// SERVICE: EVENTOS — backend/services/eventos.service.js
// Operaciones de MongoDB para la colección eventos.
// ==========================================================================

const { getDB } = require('../config/db');
const { siguienteCodigo } = require('../utils/codigos');
const { filtroPorId, conAlias, conAliasLista, busquedaTexto } = require('../utils/mongo');
const { aplicarAuditoria, aplicarAuditoriaSet } = require('../utils/auditoria');
const v = require('../utils/validaciones.server');
const { CATEGORIAS_ACTIVIDAD } = require('../utils/catalogos');
const { COLECCION, CAMPOS_PERMITIDOS_EDICION, ESTADO_DEFAULT, VISIBILIDAD_DEFAULT, TIPO_ENTRADA_DEFAULT } = require('../models/evento.model');

// ── LISTAR ──────────────────────────────────────────────────────────────────

async function listarEventos(filtros = {}) {
    const db = getDB();
    const { categoria, estado, visibilidad, q } = filtros;
    const filtro = {};

    if (categoria) filtro.categoria = { $regex: new RegExp(`^${v.limpiar(categoria)}$`, 'i') };
    if (estado) filtro.estado = { $regex: new RegExp(`^${v.limpiar(estado)}$`, 'i') };
    if (visibilidad) filtro.visibilidad = v.limpiar(visibilidad).toLowerCase();

    if (q && q.trim().length >= 3) {
        const regex = busquedaTexto(q);
        filtro.$or = [
            { nombre: regex },
            { lugar: regex },
            { categoria: regex },
            { descripcion: regex }
        ];
    }

    const eventos = await db.collection(COLECCION)
        .find(filtro)
        .sort({ fechaInicio: -1 })
        .toArray();

    return conAliasLista(eventos);
}

// ── OBTENER UNO ─────────────────────────────────────────────────────────────

async function obtenerEvento(id) {
    const db = getDB();
    const filtro = filtroPorId(id);

    const evento = await db.collection(COLECCION).findOne(filtro);
    if (!evento) return null;

    const actividades = await db.collection('actividades')
        .find({ eventoId: evento._id })
        .sort({ fecha: 1, horaInicio: 1 })
        .toArray();

    const oradores = await db.collection('oradores')
        .find({ eventoId: evento._id })
        .toArray();

    const stands = await db.collection('stands')
        .find({ eventoId: evento._id })
        .toArray();

    return {
        ...conAlias(evento),
        actividades: conAliasLista(actividades),
        oradores: conAliasLista(oradores),
        stands: conAliasLista(stands)
    };
}

// ── CREAR ───────────────────────────────────────────────────────────────────

async function crearEvento(datos, req) {
    const db = getDB();
    const codigo = await siguienteCodigo('EV', COLECCION);
    const tipoEntrada = v.limpiar(datos.tipoEntrada).toLowerCase() || TIPO_ENTRADA_DEFAULT;

    const documento = aplicarAuditoria({
        codigo,
        nombre: v.limpiar(datos.nombre),
        categoria: v.normalizarCatalogo(datos.categoria, CATEGORIAS_ACTIVIDAD),
        descripcion: v.limpiar(datos.descripcion) || '',
        fechaInicio: datos.fechaInicio,
        fechaFin: datos.fechaFin,
        horaInicio: datos.horaInicio,
        horaFin: datos.horaFin,
        enUniversidad: Boolean(datos.enUniversidad),
        lugar: v.limpiar(datos.lugar),
        cupoMax: parseInt(datos.cupoMax, 10) || 0,
        cupoActual: 0,
        responsable: v.limpiar(datos.responsable) || '',
        tipoEntrada,
        entradaLibre: tipoEntrada === 'libre' || Boolean(datos.entradaLibre),
        visibilidad: v.limpiar(datos.visibilidad).toLowerCase() || VISIBILIDAD_DEFAULT,
        estado: ESTADO_DEFAULT,
        imagen: v.limpiar(datos.imagen) || ''
    }, req, { esCreacion: true });

    const resultado = await db.collection(COLECCION).insertOne(documento);
    documento._id = resultado.insertedId;
    return conAlias(documento);
}

// ── ACTUALIZAR ──────────────────────────────────────────────────────────────

async function actualizarEvento(id, datos, req) {
    const db = getDB();
    const filtro = filtroPorId(id);

    const existente = await db.collection(COLECCION).findOne(filtro);
    if (!existente) return null;

    const $set = aplicarAuditoriaSet({}, req);
    CAMPOS_PERMITIDOS_EDICION.forEach(campo => {
        if (datos[campo] !== undefined) {
            if (campo === 'categoria') {
                $set[campo] = v.normalizarCatalogo(datos[campo], CATEGORIAS_ACTIVIDAD) || existente.categoria;
            } else if (campo === 'visibilidad') {
                $set[campo] = v.limpiar(datos[campo]).toLowerCase();
            } else if (campo === 'cupoMax') {
                $set[campo] = parseInt(datos[campo], 10);
            } else if (campo === 'enUniversidad' || campo === 'entradaLibre') {
                $set[campo] = Boolean(datos[campo]);
            } else if (typeof datos[campo] === 'string') {
                $set[campo] = v.limpiar(datos[campo]);
            } else {
                $set[campo] = datos[campo];
            }
        }
    });

    // RF-08: Recalcular estado
    const cupoMax = $set.cupoMax || existente.cupoMax;
    if (existente.cupoActual >= cupoMax && cupoMax > 0 && !existente.entradaLibre) {
        $set.estado = 'Llena';
    }

    await db.collection(COLECCION).updateOne(filtro, { $set });
    const actualizado = await db.collection(COLECCION).findOne(filtro);
    return conAlias(actualizado);
}

// ── ELIMINAR ────────────────────────────────────────────────────────────────

async function eliminarEvento(id, req) {
    const db = getDB();
    const filtro = filtroPorId(id);

    const existente = await db.collection(COLECCION).findOne(filtro);
    if (!existente) return { encontrado: false };

    const actividades = await db.collection('actividades').countDocuments({ eventoId: existente._id });
    const stands = await db.collection('stands').countDocuments({ eventoId: existente._id });
    const oradores = await db.collection('oradores').countDocuments({ eventoId: existente._id });

    if (actividades > 0 || stands > 0 || oradores > 0) {
        await db.collection(COLECCION).updateOne(filtro, {
            $set: aplicarAuditoriaSet({ estado: 'Cancelada' }, req)
        });
        if (stands > 0) {
            await db.collection('stands').updateMany(
                { eventoId: existente._id },
                { $set: aplicarAuditoriaSet({ estado: 'Cerrado' }, req) }
            );
        }
        return { encontrado: true, cancelado: true };
    }

    await db.collection(COLECCION).deleteOne(filtro);
    return { encontrado: true, cancelado: false };
}

module.exports = { listarEventos, obtenerEvento, crearEvento, actualizarEvento, eliminarEvento };
