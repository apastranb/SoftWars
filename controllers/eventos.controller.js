// ==========================================================================
// CONTROLLER DE EVENTOS — controllers/eventos.controller.js
// Responsable: Carlos Carballo (SW-9)
//
// Requerimientos que implementa:
//   RF-05  Crear eventos con campos obligatorios, genera código único.
//   RF-06  Control manual de locación y cupo máximo.
//   RF-07  Categorías restringidas (6 valores).
//   RF-08  Estados automáticos (Disponible, Llena, Cancelada, Finalizada).
//   RF-09  Tabla de gestión con métricas de cupo.
//   RF-10  Entrada libre (no muestra cupo).
//   RF-19  Búsqueda por nombre, lugar, categoría (índice de texto).
//   RF-29  Metadatos de auditoría (createdAt, updatedAt, createdBy).
//   RF-33  Solo eventos con visibilidad "publico" aparecen en el portal.
// ==========================================================================

const { getDB } = require('../config/db');
const { siguienteCodigo } = require('../utils/codigos');
const { filtroPorId, conAlias, conAliasLista, busquedaTexto } = require('../utils/mongo');
const {
    errorNoEncontrado, errorConflicto, errorValidacion, errorSolicitud
} = require('../utils/respuestas');
const v = require('../utils/validaciones.server');
const { CATEGORIAS_ACTIVIDAD, ESTADOS_EVENTO, VISIBILIDAD_EVENTO, TIPO_ENTRADA } = require('../utils/catalogos');

const COLECCION = 'eventos';

// ── LISTAR EVENTOS ──────────────────────────────────────────────────────────
// GET /api/eventos
// Query params: categoria, estado, visibilidad, q (búsqueda texto)

async function listar(req, res, next) {
    const db = getDB();
    const { categoria, estado, visibilidad, q } = req.query;
    const filtro = {};

    if (categoria) filtro.categoria = { $regex: new RegExp(`^${v.limpiar(categoria)}$`, 'i') };
    if (estado) filtro.estado = { $regex: new RegExp(`^${v.limpiar(estado)}$`, 'i') };
    if (visibilidad) filtro.visibilidad = v.limpiar(visibilidad).toLowerCase();

    // Búsqueda por texto libre (nombre, lugar)
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

    res.json({ data: conAliasLista(eventos) });
}

// ── OBTENER UN EVENTO ───────────────────────────────────────────────────────
// GET /api/eventos/:id
// Devuelve el evento con sus actividades, oradores y stands asociados.

async function obtener(req, res, next) {
    const db = getDB();
    const filtro = filtroPorId(req.params.id);

    const evento = await db.collection(COLECCION).findOne(filtro);
    if (!evento) return next(errorNoEncontrado('El evento solicitado no existe.'));

    // Cargar datos asociados
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

    res.json({
        data: {
            ...conAlias(evento),
            actividades: conAliasLista(actividades),
            oradores: conAliasLista(oradores),
            stands: conAliasLista(stands)
        }
    });
}

// ── CREAR EVENTO ────────────────────────────────────────────────────────────
// POST /api/eventos

async function crear(req, res, next) {
    const db = getDB();
    const body = req.body;

    // Validaciones
    const errores = {};
    if (!v.validarRequerido(body.nombre)) errores.nombre = 'El nombre es requerido.';
    else if (!v.validarNombre(body.nombre)) errores.nombre = 'El nombre debe tener al menos 3 caracteres.';

    if (!v.validarRequerido(body.categoria)) errores.categoria = 'La categoría es requerida.';
    else if (!v.validarEnCatalogo(body.categoria, CATEGORIAS_ACTIVIDAD)) errores.categoria = 'Categoría no válida.';

    if (!v.validarDescripcion(body.descripcion)) errores.descripcion = 'La descripción no puede superar los 200 caracteres.';

    if (!v.validarRequerido(body.fechaInicio)) errores.fechaInicio = 'La fecha de inicio es requerida.';
    if (!v.validarRequerido(body.fechaFin)) errores.fechaFin = 'La fecha de fin es requerida.';
    if (body.fechaInicio && body.fechaFin && !v.validarFechasOrden(body.fechaInicio, body.fechaFin)) {
        errores.fechaFin = 'La fecha de fin no puede ser anterior a la de inicio.';
    }

    if (!v.validarRequerido(body.horaInicio)) errores.horaInicio = 'La hora de inicio es requerida.';
    if (!v.validarRequerido(body.horaFin)) errores.horaFin = 'La hora de fin es requerida.';
    if (body.horaInicio && body.horaFin && !v.validarHorasOrden(body.horaInicio, body.horaFin)) {
        errores.horaFin = 'La hora de fin debe ser posterior a la de inicio.';
    }

    if (!v.validarRequerido(body.lugar)) errores.lugar = 'El lugar es requerido.';

    const tipoEntrada = v.limpiar(body.tipoEntrada).toLowerCase() || 'libre';
    if (tipoEntrada !== 'libre' && tipoEntrada !== 'pago') errores.tipoEntrada = 'Tipo de entrada no válido.';

    // Cupo solo requerido si no es entrada libre
    if (tipoEntrada !== 'libre' && !body.entradaLibre) {
        if (!v.validarCupo(body.cupoMax)) errores.cupoMax = 'Ingrese un cupo válido (número entero positivo).';
    }

    if (Object.keys(errores).length > 0) return next(errorValidacion(errores));

    // Generar código
    const codigo = await siguienteCodigo('EV', COLECCION);

    // Normalizar categoría
    const categoriaNormalizada = v.normalizarCatalogo(body.categoria, CATEGORIAS_ACTIVIDAD);
    const visibilidad = v.limpiar(body.visibilidad).toLowerCase() || 'publico';

    const documento = {
        codigo,
        nombre: v.limpiar(body.nombre),
        categoria: categoriaNormalizada,
        descripcion: v.limpiar(body.descripcion) || '',
        fechaInicio: body.fechaInicio,
        fechaFin: body.fechaFin,
        horaInicio: body.horaInicio,
        horaFin: body.horaFin,
        enUniversidad: Boolean(body.enUniversidad),
        lugar: v.limpiar(body.lugar),
        cupoMax: parseInt(body.cupoMax, 10) || 0,
        cupoActual: 0,
        responsable: v.limpiar(body.responsable) || '',
        tipoEntrada,
        entradaLibre: tipoEntrada === 'libre' || Boolean(body.entradaLibre),
        visibilidad,
        estado: 'Disponible',
        imagen: v.limpiar(body.imagen) || '',
        // RF-29: Auditoría
        createdAt: new Date(),
        updatedAt: new Date(),
        createdBy: req.session?.usuario?._id || null
    };

    const resultado = await db.collection(COLECCION).insertOne(documento);
    documento._id = resultado.insertedId;

    res.status(201).json({ data: conAlias(documento), mensaje: 'Evento creado correctamente.' });
}

// ── ACTUALIZAR EVENTO ───────────────────────────────────────────────────────
// PUT /api/eventos/:id

async function actualizar(req, res, next) {
    const db = getDB();
    const filtro = filtroPorId(req.params.id);
    const body = req.body;

    const existente = await db.collection(COLECCION).findOne(filtro);
    if (!existente) return next(errorNoEncontrado('El evento solicitado no existe.'));

    // Validaciones (solo campos enviados)
    const errores = {};
    if (body.nombre !== undefined && !v.validarNombre(body.nombre)) errores.nombre = 'El nombre debe tener al menos 3 caracteres.';
    if (body.categoria !== undefined && !v.validarEnCatalogo(body.categoria, CATEGORIAS_ACTIVIDAD)) errores.categoria = 'Categoría no válida.';
    if (body.descripcion !== undefined && !v.validarDescripcion(body.descripcion)) errores.descripcion = 'La descripción no puede superar los 200 caracteres.';
    if (body.fechaInicio && body.fechaFin && !v.validarFechasOrden(body.fechaInicio, body.fechaFin)) errores.fechaFin = 'La fecha de fin no puede ser anterior a la de inicio.';
    if (body.horaInicio && body.horaFin && !v.validarHorasOrden(body.horaInicio, body.horaFin)) errores.horaFin = 'La hora de fin debe ser posterior a la de inicio.';

    // RF-09: cupoActual no se puede editar manualmente
    if (body.cupoActual !== undefined) {
        errores.cupoActual = 'El cupo ocupado no se puede modificar directamente.';
    }

    if (Object.keys(errores).length > 0) return next(errorValidacion(errores));

    // Construir $set con campos permitidos (lista blanca)
    const camposPermitidos = [
        'nombre', 'categoria', 'descripcion', 'fechaInicio', 'fechaFin',
        'horaInicio', 'horaFin', 'enUniversidad', 'lugar', 'cupoMax',
        'responsable', 'tipoEntrada', 'entradaLibre', 'visibilidad',
        'estado', 'imagen'
    ];

    const $set = { updatedAt: new Date() };
    camposPermitidos.forEach(campo => {
        if (body[campo] !== undefined) {
            if (campo === 'categoria') {
                $set[campo] = v.normalizarCatalogo(body[campo], CATEGORIAS_ACTIVIDAD) || existente.categoria;
            } else if (campo === 'visibilidad') {
                $set[campo] = v.limpiar(body[campo]).toLowerCase();
            } else if (campo === 'cupoMax') {
                $set[campo] = parseInt(body[campo], 10);
            } else if (campo === 'enUniversidad' || campo === 'entradaLibre') {
                $set[campo] = Boolean(body[campo]);
            } else if (typeof body[campo] === 'string') {
                $set[campo] = v.limpiar(body[campo]);
            } else {
                $set[campo] = body[campo];
            }
        }
    });

    // Recalcular estado si el cupo se llenó (RF-08)
    if ($set.cupoMax !== undefined || existente.cupoActual >= ($set.cupoMax || existente.cupoMax)) {
        const cupoMax = $set.cupoMax || existente.cupoMax;
        if (existente.cupoActual >= cupoMax && cupoMax > 0 && !existente.entradaLibre) {
            $set.estado = 'Llena';
        }
    }

    await db.collection(COLECCION).updateOne(filtro, { $set });

    const actualizado = await db.collection(COLECCION).findOne(filtro);
    res.json({ data: conAlias(actualizado), mensaje: 'Evento actualizado correctamente.' });
}

// ── ELIMINAR EVENTO ─────────────────────────────────────────────────────────
// DELETE /api/eventos/:id
// Si tiene actividades, stands u oradores → baja lógica (estado: Cancelada)
// Si no tiene dependencias → deleteOne

async function eliminar(req, res, next) {
    const db = getDB();
    const filtro = filtroPorId(req.params.id);

    const existente = await db.collection(COLECCION).findOne(filtro);
    if (!existente) return next(errorNoEncontrado('El evento solicitado no existe.'));

    // Verificar dependencias
    const actividades = await db.collection('actividades').countDocuments({ eventoId: existente._id });
    const stands = await db.collection('stands').countDocuments({ eventoId: existente._id });
    const oradores = await db.collection('oradores').countDocuments({ eventoId: existente._id });

    if (actividades > 0 || stands > 0 || oradores > 0) {
        // Baja lógica
        await db.collection(COLECCION).updateOne(filtro, {
            $set: { estado: 'Cancelada', updatedAt: new Date() }
        });
        // Cerrar stands asociados
        if (stands > 0) {
            await db.collection('stands').updateMany(
                { eventoId: existente._id },
                { $set: { estado: 'Cerrado', updatedAt: new Date() } }
            );
        }
        return res.json({ mensaje: 'Evento cancelado (tiene registros asociados).' });
    }

    // Sin dependencias — eliminar
    await db.collection(COLECCION).deleteOne(filtro);
    res.json({ mensaje: 'Evento eliminado correctamente.' });
}

module.exports = { listar, obtener, crear, actualizar, eliminar };
