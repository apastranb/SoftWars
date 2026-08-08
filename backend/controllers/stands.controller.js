// ==========================================================================
// CONTROLLER: STANDS — backend/controllers/stands.controller.js
// Recibe peticiones HTTP, valida entrada, llama al service y responde.
// Responsable original: Josué Arroyo (SW-14)
//
// RF-14  Creación con categoría (Empresa / Personal).
// RF-15  ID numérico automático con reinicio anual.
// RF-16  Edición limitada (no se puede cambiar correo ni ID numérico).
// RF-22  Búsqueda y filtros.
// ==========================================================================

const { errorNoEncontrado, errorValidacion } = require('../utils/respuestas');
const v = require('../utils/validaciones.server');
const { ESTADOS_STAND, CATEGORIAS_STAND } = require('../utils/catalogos');
const standsService = require('../services/stands.service');
const { CAMPOS_INMUTABLES } = require('../models/stand.model');

// ==========================================================================
// VALIDACIÓN
// ==========================================================================

function validarStand(cuerpo, esEdicion = false) {
    const errores = {};
    const presente = campo => !esEdicion || cuerpo[campo] !== undefined;

    if (presente('nombre')) {
        if (!v.validarRequerido(cuerpo.nombre)) {
            errores.nombre = 'El nombre del stand es requerido.';
        } else if (!v.validarNombre(cuerpo.nombre)) {
            errores.nombre = 'El nombre debe tener al menos 3 caracteres.';
        }
    }

    if (presente('encargado') && !v.validarRequerido(cuerpo.encargado)) {
        errores.encargado = 'El encargado del stand es requerido.';
    }

    if (presente('empresa') && !v.validarRequerido(cuerpo.empresa)) {
        errores.empresa = 'La empresa u organización es requerida.';
    }

    if (!esEdicion) {
        if (!v.validarRequerido(cuerpo.correo)) {
            errores.correo = 'El correo de contacto es requerido.';
        } else if (!v.validarCorreo(cuerpo.correo)) {
            errores.correo = 'Ingrese un correo válido (ej. contacto@empresa.com).';
        }
    }

    if (presente('telefono')) {
        if (!v.validarRequerido(cuerpo.telefono)) {
            errores.telefono = 'El teléfono de contacto es requerido.';
        } else if (!v.validarTelefono(cuerpo.telefono)) {
            errores.telefono = 'El teléfono debe tener 8 dígitos (ej. 8888-8888).';
        }
    }

    const descripcion = cuerpo.descripcion !== undefined ? cuerpo.descripcion : cuerpo.desc;
    if (!esEdicion || descripcion !== undefined) {
        if (!v.validarRequerido(descripcion)) {
            errores.descripcion = 'La descripción es requerida.';
        } else if (!v.validarDescripcion(descripcion, true)) {
            errores.descripcion = 'La descripción no puede superar los 200 caracteres.';
        }
    }

    if (presente('categoria')) {
        if (!v.validarRequerido(cuerpo.categoria)) {
            errores.categoria = 'Debe seleccionar una categoría.';
        } else if (!v.validarEnCatalogo(cuerpo.categoria, CATEGORIAS_STAND)) {
            errores.categoria = `La categoría debe ser ${CATEGORIAS_STAND.join(' o ')}.`;
        }
    }

    if (cuerpo.estado !== undefined && !v.validarEnCatalogo(cuerpo.estado, ESTADOS_STAND)) {
        errores.estado = `El estado debe ser ${ESTADOS_STAND.join(' o ')}.`;
    }

    if (!esEdicion && !v.validarRequerido(String(cuerpo.eventoId || ''))) {
        errores.eventoId = 'Debe seleccionar el evento al que pertenece el stand.';
    }

    return errores;
}

// ==========================================================================
// ENDPOINTS
// ==========================================================================

/** GET /api/stands */
async function listar(req, res) {
    const resultado = await standsService.listarStands(req.query);
    res.json(resultado);
}

/** GET /api/stands/:id */
async function obtener(req, res) {
    const stand = await standsService.obtenerStand(req.params.id);
    if (!stand) throw errorNoEncontrado('El stand solicitado no existe.');
    res.json(stand);
}

/** POST /api/stands */
async function crear(req, res) {
    const errores = validarStand(req.body, false);
    if (Object.keys(errores).length > 0) throw errorValidacion(errores);

    const stand = await standsService.crearStand(req.body, req);
    res.status(201).json(stand);
}

/** PUT /api/stands/:id */
async function actualizar(req, res) {
    const errores = validarStand(req.body, true);
    if (Object.keys(errores).length > 0) throw errorValidacion(errores);

    const stand = await standsService.actualizarStand(req.params.id, req.body, req);
    if (!stand) throw errorNoEncontrado('El stand solicitado no existe.');
    res.json(stand);
}

/** PATCH /api/stands/:id/estado */
async function cambiarEstado(req, res) {
    const estado = v.normalizarCatalogo(req.body.estado, ESTADOS_STAND);
    if (!estado) {
        throw errorValidacion({ estado: `El estado debe ser ${ESTADOS_STAND.join(' o ')}.` });
    }

    const stand = await standsService.cambiarEstado(req.params.id, estado, req);
    if (!stand) throw errorNoEncontrado('El stand solicitado no existe.');
    res.json(stand);
}

/** DELETE /api/stands/:id */
async function eliminar(req, res) {
    const resultado = await standsService.eliminarStand(req.params.id);
    if (!resultado.encontrado) throw errorNoEncontrado('El stand solicitado no existe.');
    res.json({ mensaje: `El stand "${resultado.nombre}" fue eliminado.`, codigo: resultado.codigo });
}

module.exports = {
    listar,
    obtener,
    crear,
    actualizar,
    cambiarEstado,
    eliminar,
    CAMPOS_INMUTABLES,
    validarStand,
    construirDocumento: standsService.construirDocumento
};
