// ==========================================================================
// CONTROLLER: ACTIVIDADES — backend/controllers/actividades.controller.js
// ==========================================================================

const { errorNoEncontrado, errorConflicto, errorValidacion, errorSolicitud } = require('../utils/respuestas');
const v = require('../utils/validaciones.server');
const { CATEGORIAS_ACTIVIDAD } = require('../utils/catalogos');
const actividadesService = require('../services/actividades.service');

// GET /api/actividades
async function listar(req, res, next) {
    const actividades = await actividadesService.listarActividades(req.query);
    res.json({ data: actividades });
}

// GET /api/actividades/:id
async function obtener(req, res, next) {
    const actividad = await actividadesService.obtenerActividad(req.params.id);
    if (!actividad) return next(errorNoEncontrado('La actividad solicitada no existe.'));
    res.json({ data: actividad });
}

// POST /api/actividades
async function crear(req, res, next) {
    const errores = validarDatosActividad(req.body, false);
    if (Object.keys(errores).length > 0) return next(errorValidacion(errores));

    const resultado = await actividadesService.crearActividad(req.body, req);
    if (resultado.error) return next(errorSolicitud(resultado.error));
    res.status(201).json({ data: resultado.data, mensaje: 'Actividad creada correctamente.' });
}

// PUT /api/actividades/:id
async function actualizar(req, res, next) {
    const errores = validarDatosActividad(req.body, true);
    if (Object.keys(errores).length > 0) return next(errorValidacion(errores));

    const resultado = await actividadesService.actualizarActividad(req.params.id, req.body, req);
    if (!resultado) return next(errorNoEncontrado('La actividad solicitada no existe.'));
    if (resultado.error) return next(errorConflicto(resultado.error));
    res.json({ data: resultado.data, mensaje: 'Actividad actualizada correctamente.' });
}

// DELETE /api/actividades/:id
async function eliminar(req, res, next) {
    const resultado = await actividadesService.eliminarActividad(req.params.id);
    if (!resultado.encontrado) return next(errorNoEncontrado('La actividad solicitada no existe.'));
    if (resultado.bloqueado) return next(errorConflicto(`No se puede eliminar: hay ${resultado.inscritos} participante(s) inscrito(s).`));
    res.json({ mensaje: 'Actividad eliminada correctamente.' });
}

// ── VALIDACIÓN ──────────────────────────────────────────────────────────────

function validarDatosActividad(body, esEdicion) {
    const errores = {};

    if (!esEdicion) {
        if (!v.validarRequerido(body.eventoId)) errores.eventoId = 'El evento padre es requerido.';
        if (!v.validarRequerido(body.nombre)) errores.nombre = 'El nombre es requerido.';
        else if (!v.validarNombre(body.nombre)) errores.nombre = 'El nombre debe tener al menos 3 caracteres.';
        if (!v.validarRequerido(body.categoria)) errores.categoria = 'La categoría es requerida.';
        else if (!v.validarEnCatalogo(body.categoria, CATEGORIAS_ACTIVIDAD)) errores.categoria = 'Categoría no válida.';
        if (!v.validarRequerido(body.fecha)) errores.fecha = 'La fecha es requerida.';
        if (!v.validarRequerido(body.horaInicio)) errores.horaInicio = 'La hora de inicio es requerida.';
        if (!v.validarRequerido(body.horaFin)) errores.horaFin = 'La hora de fin es requerida.';
        if (!v.validarRequerido(body.lugar)) errores.lugar = 'El lugar es requerido.';
    } else {
        if (body.nombre !== undefined && !v.validarNombre(body.nombre)) errores.nombre = 'El nombre debe tener al menos 3 caracteres.';
        if (body.categoria !== undefined && !v.validarEnCatalogo(body.categoria, CATEGORIAS_ACTIVIDAD)) errores.categoria = 'Categoría no válida.';
        if (body.cupoOcupado !== undefined) errores.cupoOcupado = 'El cupo ocupado no se puede modificar directamente.';
    }

    if (body.descripcion !== undefined && !v.validarDescripcion(body.descripcion)) errores.descripcion = 'La descripción no puede superar los 200 caracteres.';
    if (body.horaInicio && body.horaFin && !v.validarHorasOrden(body.horaInicio, body.horaFin)) errores.horaFin = 'La hora de fin debe ser posterior a la de inicio.';

    const entradaLibre = Boolean(body.entradaLibre);
    if (!esEdicion && !entradaLibre && body.cupoMaximo !== undefined && !v.validarCupo(body.cupoMaximo)) {
        errores.cupoMaximo = 'Ingrese un cupo válido (número entero positivo).';
    }

    return errores;
}

module.exports = { listar, obtener, crear, actualizar, eliminar };
