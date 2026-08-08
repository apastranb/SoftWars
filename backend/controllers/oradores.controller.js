// ==========================================================================
// CONTROLLER: ORADORES — backend/controllers/oradores.controller.js
// Recibe peticiones HTTP, valida entrada, llama al service y responde.
// Responsable original: Josué Arroyo (SW-12)
//
// RF-12  Registro de responsables con perfil completo.
// RF-13  Edición y eliminación condicional (actividades activas).
// RF-20  Búsqueda por nombre, ID, correo o profesión.
// ==========================================================================

const { errorNoEncontrado, errorConflicto, errorValidacion } = require('../utils/respuestas');
const v = require('../utils/validaciones.server');
const oradoresService = require('../services/oradores.service');
const { ESTADOS } = require('../models/orador.model');

// ==========================================================================
// VALIDACIÓN
// ==========================================================================

const ESTADOS_ORADOR = ESTADOS;

function validarOrador(cuerpo, esEdicion = false) {
    const errores = {};
    const presente = campo => !esEdicion || cuerpo[campo] !== undefined;

    if (presente('nombre')) {
        if (!v.validarRequerido(cuerpo.nombre)) {
            errores.nombre = 'El nombre es requerido.';
        } else if (!v.validarNombre(cuerpo.nombre)) {
            errores.nombre = 'El nombre debe tener al menos 3 caracteres.';
        }
    }

    if (presente('correo')) {
        if (!v.validarRequerido(cuerpo.correo)) {
            errores.correo = 'El correo es requerido.';
        } else if (!v.validarCorreo(cuerpo.correo)) {
            errores.correo = 'Ingrese un correo válido (ej. usuario@empresa.com).';
        }
    }

    const telefonos = v.extraerTelefonos(cuerpo);
    const envioAlgunTelefono = cuerpo.telefono !== undefined ||
        cuerpo.telefono2 !== undefined || cuerpo.telefonos !== undefined;

    if (!esEdicion || envioAlgunTelefono) {
        if (telefonos.length === 0) {
            errores.telefono = 'El teléfono principal es requerido y debe tener 8 dígitos (ej. 8888-8888).';
        }
    }

    if (presente('especialidad') && !v.validarRequerido(cuerpo.especialidad)) {
        errores.especialidad = 'La especialidad es requerida.';
    }

    const organizacion = cuerpo.empresa !== undefined ? cuerpo.empresa : cuerpo.organizacion;
    if (!esEdicion || organizacion !== undefined) {
        if (!v.validarRequerido(organizacion)) {
            errores.empresa = 'La institución u organización es requerida.';
        }
    }

    if (presente('biografia')) {
        if (!v.validarRequerido(cuerpo.biografia)) {
            errores.biografia = 'La biografía es requerida.';
        } else if (!v.validarDescripcion(cuerpo.biografia, true)) {
            errores.biografia = 'La biografía no puede superar los 200 caracteres.';
        }
    }

    if (cuerpo.estado !== undefined && !v.validarEnCatalogo(cuerpo.estado, ESTADOS_ORADOR)) {
        errores.estado = `El estado debe ser ${ESTADOS_ORADOR.join(' o ')}.`;
    }

    return errores;
}

// ==========================================================================
// ENDPOINTS
// ==========================================================================

/** GET /api/oradores */
async function listar(req, res) {
    const resultado = await oradoresService.listarOradores(req.query);
    res.json(resultado);
}

/** GET /api/oradores/:id */
async function obtener(req, res) {
    const orador = await oradoresService.obtenerOrador(req.params.id);
    if (!orador) throw errorNoEncontrado('El orador solicitado no existe.');
    res.json(orador);
}

/** POST /api/oradores */
async function crear(req, res) {
    const errores = validarOrador(req.body, false);
    if (Object.keys(errores).length > 0) throw errorValidacion(errores);

    const orador = await oradoresService.crearOrador(req.body, req);
    res.status(201).json(orador);
}

/** PUT /api/oradores/:id */
async function actualizar(req, res) {
    const errores = validarOrador(req.body, true);
    if (Object.keys(errores).length > 0) throw errorValidacion(errores);

    const orador = await oradoresService.actualizarOrador(req.params.id, req.body, req);
    if (!orador) throw errorNoEncontrado('El orador solicitado no existe.');
    res.json(orador);
}

/** PATCH /api/oradores/:id/estado */
async function cambiarEstado(req, res) {
    const estado = v.normalizarCatalogo(req.body.estado, ESTADOS_ORADOR);
    if (!estado) {
        throw errorValidacion({ estado: `El estado debe ser ${ESTADOS_ORADOR.join(' o ')}.` });
    }

    const orador = await oradoresService.cambiarEstado(req.params.id, estado, req);
    if (!orador) throw errorNoEncontrado('El orador solicitado no existe.');
    res.json(orador);
}

/** DELETE /api/oradores/:id */
async function eliminar(req, res) {
    const resultado = await oradoresService.eliminarOrador(req.params.id);
    if (!resultado.encontrado) throw errorNoEncontrado('El orador solicitado no existe.');
    if (resultado.bloqueado) {
        throw errorConflicto(
            `No se puede eliminar a "${resultado.nombre}" porque es responsable de ${resultado.actividadesActivas} actividad(es) activa(s). ` +
            'Reasigne o cancele esas actividades primero.',
            { actividadesActivas: resultado.actividadesActivas }
        );
    }
    res.json({ mensaje: `El orador "${resultado.nombre}" fue eliminado.`, codigo: resultado.codigo });
}

module.exports = {
    listar,
    obtener,
    crear,
    actualizar,
    cambiarEstado,
    eliminar,
    // Exportados para reutilización
    ESTADOS_ORADOR,
    validarOrador,
    construirDocumento: oradoresService.construirDocumento,
    contarActividadesActivas: oradoresService.contarActividadesActivas
};
