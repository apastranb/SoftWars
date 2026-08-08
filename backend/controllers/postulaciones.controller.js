// ==========================================================================
// CONTROLLER: POSTULACIONES — backend/controllers/postulaciones.controller.js
// Recibe peticiones HTTP, valida entrada, llama al service y responde.
// Responsable original: Josué Arroyo (SW-17)
//
// RF-24  Formulario público de postulación como orador.
// RF-25  Prevención de duplicados (mismo correo + misma actividad).
// HU-10  Aprobar/rechazar postulaciones → crear orador.
// ==========================================================================

const { errorNoEncontrado, errorValidacion } = require('../utils/respuestas');
const v = require('../utils/validaciones.server');
const postulacionesService = require('../services/postulaciones.service');
const { ESTADOS_QUE_BLOQUEAN } = require('../models/postulacion.model');

// ==========================================================================
// VALIDACIÓN
// ==========================================================================

function validarPostulacion(cuerpo) {
    const errores = {};

    if (!v.validarRequerido(cuerpo.nombre)) {
        errores.nombre = 'El nombre completo es requerido.';
    } else if (!v.validarNombre(cuerpo.nombre)) {
        errores.nombre = 'El nombre debe tener al menos 3 caracteres.';
    }

    if (!v.validarRequerido(cuerpo.correo)) {
        errores.correo = 'El correo es requerido.';
    } else if (!v.validarCorreo(cuerpo.correo)) {
        errores.correo = 'Ingrese un correo electrónico válido.';
    }

    const telefonos = v.extraerTelefonos(cuerpo);
    if (telefonos.length === 0) {
        errores.telefono = 'Ingrese un número de teléfono válido (8 dígitos).';
    }

    if (!v.validarRequerido(cuerpo.especialidad)) {
        errores.especialidad = 'El área o especialidad es requerida.';
    } else if (!v.validarNombre(cuerpo.especialidad)) {
        errores.especialidad = 'La especialidad debe tener al menos 3 caracteres.';
    }

    const organizacion = cuerpo.organizacion !== undefined ? cuerpo.organizacion : cuerpo.empresa;
    if (!v.validarRequerido(organizacion)) {
        errores.organizacion = 'La institución u organización es requerida.';
    }

    if (!v.validarRequerido(cuerpo.biografia)) {
        errores.biografia = 'La biografía es requerida.';
    } else if (!v.validarDescripcion(cuerpo.biografia, true)) {
        errores.biografia = 'La biografía no puede superar los 200 caracteres.';
    }

    if (!v.validarRequerido(String(cuerpo.actividadId || ''))) {
        errores.actividad = 'Debe seleccionar una actividad.';
    }

    return errores;
}

// ==========================================================================
// ENDPOINTS
// ==========================================================================

/** GET /api/postulaciones */
async function listar(req, res) {
    const resultado = await postulacionesService.listarPostulaciones(req.query);
    res.json(resultado);
}

/** GET /api/postulaciones/:id */
async function obtener(req, res) {
    const postulacion = await postulacionesService.obtenerPostulacion(req.params.id);
    if (!postulacion) throw errorNoEncontrado('La postulación solicitada no existe.');
    res.json(postulacion);
}

/** POST /api/postulaciones — público (RF-24) */
async function crear(req, res) {
    const errores = validarPostulacion(req.body);
    if (Object.keys(errores).length > 0) throw errorValidacion(errores);

    const postulacion = await postulacionesService.crearPostulacion(req.body);
    res.status(201).json(postulacion);
}

/** PATCH /api/postulaciones/:id/aprobar */
async function aprobar(req, res) {
    const resultado = await postulacionesService.aprobarPostulacion(req.params.id, req);
    if (!resultado.encontrado) throw errorNoEncontrado('La postulación solicitada no existe.');

    const mensaje = resultado.oradorCreado
        ? `Postulación aprobada. Se registró a "${resultado.orador.nombre}" como orador (${resultado.orador.codigo}).`
        : `Postulación aprobada. "${resultado.orador.nombre}" ya existía como orador (${resultado.orador.codigo}) y se reutilizó su perfil.`;

    res.json({
        mensaje,
        postulacion: resultado.postulacion,
        orador: resultado.orador,
        oradorCreado: resultado.oradorCreado
    });
}

/** PATCH /api/postulaciones/:id/rechazar */
async function rechazar(req, res) {
    const motivo = v.limpiar(req.body.motivo);
    if (motivo && !v.validarDescripcion(motivo, false)) {
        throw errorValidacion({ motivo: 'El motivo no puede superar los 200 caracteres.' });
    }

    const resultado = await postulacionesService.rechazarPostulacion(req.params.id, motivo, req);
    if (!resultado.encontrado) throw errorNoEncontrado('La postulación solicitada no existe.');

    res.json({
        mensaje: `La postulación de "${resultado.postulacion.nombre}" fue rechazada.`,
        postulacion: resultado.postulacion
    });
}

/** DELETE /api/postulaciones/:id */
async function eliminar(req, res) {
    const resultado = await postulacionesService.eliminarPostulacion(req.params.id);
    if (!resultado.encontrado) throw errorNoEncontrado('La postulación solicitada no existe.');
    res.json({
        mensaje: `La postulación de "${resultado.nombre}" fue eliminada.`,
        codigo: resultado.codigo
    });
}

module.exports = {
    listar,
    obtener,
    crear,
    aprobar,
    rechazar,
    eliminar,
    ESTADOS_QUE_BLOQUEAN,
    validarPostulacion
};
