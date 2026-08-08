// ==========================================================================
// CONTROLLER: EVENTOS — backend/controllers/eventos.controller.js
// Recibe peticiones HTTP, valida entrada, llama al service y responde.
// ==========================================================================

const { errorNoEncontrado, errorValidacion } = require('../utils/respuestas');
const v = require('../utils/validaciones.server');
const { CATEGORIAS_ACTIVIDAD } = require('../utils/catalogos');
const eventosService = require('../services/eventos.service');

// GET /api/eventos
async function listar(req, res, next) {
    const eventos = await eventosService.listarEventos(req.query);
    res.json({ data: eventos });
}

// GET /api/eventos/:id
async function obtener(req, res, next) {
    const evento = await eventosService.obtenerEvento(req.params.id);
    if (!evento) return next(errorNoEncontrado('El evento solicitado no existe.'));
    res.json({ data: evento });
}

// POST /api/eventos
async function crear(req, res, next) {
    const body = req.body;
    const errores = validarDatosEvento(body, false);
    if (Object.keys(errores).length > 0) return next(errorValidacion(errores));

    const evento = await eventosService.crearEvento(body, req);
    res.status(201).json({ data: evento, mensaje: 'Evento creado correctamente.' });
}

// PUT /api/eventos/:id
async function actualizar(req, res, next) {
    const body = req.body;
    const errores = validarDatosEvento(body, true);
    if (Object.keys(errores).length > 0) return next(errorValidacion(errores));

    const evento = await eventosService.actualizarEvento(req.params.id, body, req);
    if (!evento) return next(errorNoEncontrado('El evento solicitado no existe.'));
    res.json({ data: evento, mensaje: 'Evento actualizado correctamente.' });
}

// DELETE /api/eventos/:id
async function eliminar(req, res, next) {
    const resultado = await eventosService.eliminarEvento(req.params.id, req);
    if (!resultado.encontrado) return next(errorNoEncontrado('El evento solicitado no existe.'));
    if (resultado.cancelado) return res.json({ mensaje: 'Evento cancelado (tiene registros asociados).' });
    res.json({ mensaje: 'Evento eliminado correctamente.' });
}

// ── VALIDACIÓN ──────────────────────────────────────────────────────────────

function validarDatosEvento(body, esEdicion) {
    const errores = {};

    if (!esEdicion) {
        if (!v.validarRequerido(body.nombre)) errores.nombre = 'El nombre es requerido.';
        else if (!v.validarNombre(body.nombre)) errores.nombre = 'El nombre debe tener al menos 3 caracteres.';
        if (!v.validarRequerido(body.categoria)) errores.categoria = 'La categoría es requerida.';
        else if (!v.validarEnCatalogo(body.categoria, CATEGORIAS_ACTIVIDAD)) errores.categoria = 'Categoría no válida.';
        if (!v.validarRequerido(body.fechaInicio)) errores.fechaInicio = 'La fecha de inicio es requerida.';
        if (!v.validarRequerido(body.fechaFin)) errores.fechaFin = 'La fecha de fin es requerida.';
        if (!v.validarRequerido(body.horaInicio)) errores.horaInicio = 'La hora de inicio es requerida.';
        if (!v.validarRequerido(body.horaFin)) errores.horaFin = 'La hora de fin es requerida.';
        if (!v.validarRequerido(body.lugar)) errores.lugar = 'El lugar es requerido.';
    } else {
        if (body.nombre !== undefined && !v.validarNombre(body.nombre)) errores.nombre = 'El nombre debe tener al menos 3 caracteres.';
        if (body.categoria !== undefined && !v.validarEnCatalogo(body.categoria, CATEGORIAS_ACTIVIDAD)) errores.categoria = 'Categoría no válida.';
        if (body.cupoActual !== undefined) errores.cupoActual = 'El cupo ocupado no se puede modificar directamente.';
    }

    if (body.descripcion !== undefined && !v.validarDescripcion(body.descripcion)) errores.descripcion = 'La descripción no puede superar los 200 caracteres.';
    if (body.fechaInicio && body.fechaFin && !v.validarFechasOrden(body.fechaInicio, body.fechaFin)) errores.fechaFin = 'La fecha de fin no puede ser anterior a la de inicio.';
    if (body.horaInicio && body.horaFin && !v.validarHorasOrden(body.horaInicio, body.horaFin)) errores.horaFin = 'La hora de fin debe ser posterior a la de inicio.';

    const tipoEntrada = v.limpiar(body.tipoEntrada || '').toLowerCase();
    if (tipoEntrada && tipoEntrada !== 'libre' && tipoEntrada !== 'pago') errores.tipoEntrada = 'Tipo de entrada no válido.';

    if (!esEdicion && tipoEntrada !== 'libre' && !body.entradaLibre) {
        if (!v.validarCupo(body.cupoMax)) errores.cupoMax = 'Ingrese un cupo válido (número entero positivo).';
    }

    return errores;
}

module.exports = { listar, obtener, crear, actualizar, eliminar };
