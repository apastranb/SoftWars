// ==========================================================================
// CONTROLLER DE ORADORES / RESPONSABLES — controllers/oradores.controller.js
// Responsable: Josué Arroyo (SW-12)
//
// Requerimientos que implementa:
//   RF-12  Registro de responsables con perfil completo (nombre, correo,
//          teléfonos, especialidad, organización, biografía, foto y fecha
//          de registro).
//   RF-13  Edición y eliminación CONDICIONAL: se deniegan si el responsable
//          tiene actividades activas asignadas.
//   RF-20  Búsqueda por nombre, ID, correo o profesión; filtros por estado.
//
// Interpretación documentada de RF-13:
//   - PUT /:id        → bloqueado si tiene actividades activas (edición de perfil).
//   - DELETE /:id     → bloqueado si tiene actividades activas.
//   - PATCH /:id/estado → SIEMPRE permitido.
//     Motivo: el Doc de Diseño 2 (apartado 4.3) establece que "un orador
//     inactivo no puede asignarse como responsable de una NUEVA actividad",
//     lo que presupone que desactivar a un orador con actividades vigentes es
//     una operación válida. Además el panel administrativo cambia el estado
//     desde un <select> en la propia fila de la tabla.
// ==========================================================================

const { getDB } = require('../config/db');
const { siguienteCodigo } = require('../utils/codigos');
const { filtroPorId, conAlias, conAliasLista, busquedaTexto, aObjectId } = require('../utils/mongo');
const {
    errorNoEncontrado, errorConflicto, errorValidacion
} = require('../utils/respuestas');
const v = require('../utils/validaciones.server');

const COLECCION = 'oradores';

/** Estados válidos de un orador. Se mantiene la forma canónica capitalizada. */
const ESTADOS_ORADOR = ['Activo', 'Inactivo'];

/** Estados de actividad que se consideran "activos" para efectos del RF-13. */
const ESTADOS_ACTIVIDAD_VIGENTE = ['Disponible', 'Llena'];

// ==========================================================================
// VALIDACIÓN (OB-04 — segunda barrera en el servidor)
// ==========================================================================

/**
 * Valida el cuerpo de un orador con las mismas reglas que el cliente.
 * @param {object} cuerpo - req.body
 * @param {boolean} [esEdicion=false] - En edición, los campos ausentes se omiten.
 * @returns {object} Mapa { campo: mensaje }. Vacío si todo es válido.
 */
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

    // RF-12 habla de "teléfonos" en plural: se exige al menos uno válido.
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

    // El frontend envía "empresa"; el formulario público la llama "organizacion".
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

/**
 * Arma el documento que se guarda en MongoDB a partir del cuerpo recibido.
 * @param {object} cuerpo - req.body ya validado.
 * @returns {object} Campos listos para insertar o actualizar.
 */
function construirDocumento(cuerpo) {
    const telefonos = v.extraerTelefonos(cuerpo);
    const organizacion = cuerpo.empresa !== undefined ? cuerpo.empresa : cuerpo.organizacion;

    const documento = {
        nombre: v.limpiar(cuerpo.nombre),
        correo: v.normalizarCorreo(cuerpo.correo),
        telefonos: telefonos,
        // Se conserva `telefono` (el principal) porque el panel de la
        // iteración 1 todavía lee ese campo. Se elimina al cerrar SW-27.
        telefono: telefonos[0] || '',
        especialidad: v.limpiar(cuerpo.especialidad),
        empresa: v.limpiar(organizacion),
        biografia: v.limpiar(cuerpo.biografia),
        foto: cuerpo.foto || null
    };

    // Campos opcionales: solo se escriben si vienen en la petición.
    if (cuerpo.eventoId !== undefined) {
        documento.eventoId = aObjectId(cuerpo.eventoId) || v.limpiar(cuerpo.eventoId) || null;
    }
    if (cuerpo.estado !== undefined) {
        documento.estado = v.normalizarCatalogo(cuerpo.estado, ESTADOS_ORADOR, 'Activo');
    }

    return documento;
}

// ==========================================================================
// REGLA DE NEGOCIO RF-13 — ACTIVIDADES ACTIVAS
// ==========================================================================

/**
 * Cuenta las actividades vigentes que tienen a este orador como responsable.
 * @param {ObjectId} oradorId
 * @returns {Promise<number>}
 */
async function contarActividadesActivas(oradorId) {
    return getDB().collection('actividades').countDocuments({
        responsableId: oradorId,
        estado: { $in: ESTADOS_ACTIVIDAD_VIGENTE }
    });
}

/**
 * Devuelve el conjunto de ids de oradores que tienen actividades vigentes.
 * Se resuelve con una sola consulta para no hacer N+1 al listar la tabla.
 * @returns {Promise<Set<string>>}
 */
async function idsConActividadesActivas() {
    const ids = await getDB().collection('actividades').distinct('responsableId', {
        estado: { $in: ESTADOS_ACTIVIDAD_VIGENTE },
        responsableId: { $ne: null }
    });
    return new Set(ids.map(String));
}

/**
 * Lanza 409 si el orador tiene actividades vigentes asignadas (RF-13).
 * @param {object} orador - Documento del orador.
 * @param {string} accion - Verbo para el mensaje ('editar' | 'eliminar').
 */
async function exigirSinActividadesActivas(orador, accion) {
    const cantidad = await contarActividadesActivas(orador._id);
    if (cantidad > 0) {
        throw errorConflicto(
            `No se puede ${accion} a "${orador.nombre}" porque es responsable de ${cantidad} actividad(es) activa(s). ` +
            'Reasigne o cancele esas actividades primero.',
            { actividadesActivas: cantidad }
        );
    }
}

// ==========================================================================
// ENDPOINTS
// ==========================================================================

/**
 * GET /api/oradores
 * Filtros: ?q= &estado= &eventoId= &especialidad= &fechaRegistro=
 * RF-20 — búsqueda por nombre, código, correo, empresa o especialidad.
 */
async function listar(req, res) {
    const { q, estado, eventoId, especialidad, fechaRegistro } = req.query;
    const filtro = {};

    if (q && q.trim()) {
        const texto = busquedaTexto(q);
        filtro.$or = [
            { nombre: texto }, { correo: texto }, { empresa: texto },
            { especialidad: texto }, { codigo: texto }
        ];
    }
    if (estado) filtro.estado = v.normalizarCatalogo(estado, ESTADOS_ORADOR, estado);
    if (especialidad) filtro.especialidad = busquedaTexto(especialidad);

    // `fechaRegistro` se guarda como Date, pero el <input type="date"> del panel
    // envía "YYYY-MM-DD". Comparar ambos directamente nunca coincide, así que se
    // filtra por el rango que cubre ese día completo.
    if (fechaRegistro) {
        const inicio = new Date(`${fechaRegistro}T00:00:00`);
        if (!isNaN(inicio.getTime())) {
            const fin = new Date(inicio);
            fin.setDate(fin.getDate() + 1);
            filtro.fechaRegistro = { $gte: inicio, $lt: fin };
        }
    }

    if (eventoId) filtro.eventoId = aObjectId(eventoId) || eventoId;

    const oradores = await getDB().collection(COLECCION)
        .find(filtro)
        .sort({ codigo: 1 })
        .toArray();

    // Se adjunta el indicador de RF-13 para que el panel pueda deshabilitar
    // los botones de editar y eliminar sin hacer una petición extra por fila.
    const bloqueados = await idsConActividadesActivas();
    const resultado = conAliasLista(oradores).map(orador => ({
        ...orador,
        tieneActividadesActivas: bloqueados.has(String(orador._id)),
        puedeEditarse: !bloqueados.has(String(orador._id))
    }));

    res.json(resultado);
}

/** GET /api/oradores/:id — acepta ObjectId o código legible (OR-001). */
async function obtener(req, res) {
    const orador = await getDB().collection(COLECCION).findOne(filtroPorId(req.params.id));
    if (!orador) throw errorNoEncontrado('El orador solicitado no existe.');

    const actividadesActivas = await contarActividadesActivas(orador._id);

    res.json({
        ...conAlias(orador),
        actividadesActivas: actividadesActivas,
        tieneActividadesActivas: actividadesActivas > 0,
        puedeEditarse: actividadesActivas === 0
    });
}

/** POST /api/oradores — RF-12. Requiere sesión de administrador. */
async function crear(req, res) {
    const errores = validarOrador(req.body, false);
    if (Object.keys(errores).length > 0) throw errorValidacion(errores);

    const coleccion = getDB().collection(COLECCION);
    const correo = v.normalizarCorreo(req.body.correo);

    // El índice único sobre `correo` (SW-7) es la garantía final, pero se
    // comprueba antes para devolver un 409 con mensaje entendible.
    const duplicado = await coleccion.findOne({ correo: correo });
    if (duplicado) {
        throw errorConflicto(`Ya existe un orador registrado con el correo ${correo}.`);
    }

    const documento = {
        codigo: await siguienteCodigo('OR', COLECCION),
        ...construirDocumento(req.body),
        estado: v.normalizarCatalogo(req.body.estado, ESTADOS_ORADOR, 'Activo'),
        eventoId: aObjectId(req.body.eventoId) || v.limpiar(req.body.eventoId) || null,
        fechaRegistro: new Date()
    };

    const resultado = await coleccion.insertOne(documento);
    res.status(201).json(conAlias({ _id: resultado.insertedId, ...documento }));
}

/**
 * PUT /api/oradores/:id — RF-13.
 * Denegado si el orador tiene actividades activas asignadas.
 */
async function actualizar(req, res) {
    const coleccion = getDB().collection(COLECCION);
    const orador = await coleccion.findOne(filtroPorId(req.params.id));
    if (!orador) throw errorNoEncontrado('El orador solicitado no existe.');

    await exigirSinActividadesActivas(orador, 'editar');

    const errores = validarOrador(req.body, true);
    if (Object.keys(errores).length > 0) throw errorValidacion(errores);

    // Se fusiona el documento guardado con los campos recibidos para que la
    // edición sea parcial. Si la petición trae `telefono` o `telefono2`, se
    // descarta el arreglo `telefonos` almacenado: de lo contrario tendría
    // precedencia en extraerTelefonos() y el teléfono nuevo se perdería.
    const fusionado = { ...orador, ...req.body };
    if (req.body.telefono !== undefined || req.body.telefono2 !== undefined) {
        delete fusionado.telefonos;
    }

    const cambios = construirDocumento(fusionado);

    // Si cambia el correo, se revalida la unicidad contra el resto de documentos.
    if (cambios.correo !== orador.correo) {
        const duplicado = await coleccion.findOne({
            correo: cambios.correo,
            _id: { $ne: orador._id }
        });
        if (duplicado) {
            throw errorConflicto(`Ya existe otro orador registrado con el correo ${cambios.correo}.`);
        }
    }

    cambios.fechaActualizacion = new Date();
    await coleccion.updateOne({ _id: orador._id }, { $set: cambios });

    const actualizado = await coleccion.findOne({ _id: orador._id });
    res.json(conAlias(actualizado));
}

/**
 * PATCH /api/oradores/:id/estado
 * Activar o desactivar. Permitido aunque tenga actividades vigentes: no
 * modifica el perfil, solo impide que se le asignen actividades nuevas.
 */
async function cambiarEstado(req, res) {
    const estado = v.normalizarCatalogo(req.body.estado, ESTADOS_ORADOR);
    if (!estado) {
        throw errorValidacion({ estado: `El estado debe ser ${ESTADOS_ORADOR.join(' o ')}.` });
    }

    const coleccion = getDB().collection(COLECCION);
    const orador = await coleccion.findOne(filtroPorId(req.params.id));
    if (!orador) throw errorNoEncontrado('El orador solicitado no existe.');

    await coleccion.updateOne(
        { _id: orador._id },
        { $set: { estado: estado, fechaActualizacion: new Date() } }
    );

    res.json(conAlias({ ...orador, estado: estado }));
}

/**
 * DELETE /api/oradores/:id — RF-13.
 * Denegado si el orador tiene actividades activas asignadas.
 */
async function eliminar(req, res) {
    const coleccion = getDB().collection(COLECCION);
    const orador = await coleccion.findOne(filtroPorId(req.params.id));
    if (!orador) throw errorNoEncontrado('El orador solicitado no existe.');

    await exigirSinActividadesActivas(orador, 'eliminar');

    await coleccion.deleteOne({ _id: orador._id });

    // Se limpia la referencia en actividades ya finalizadas o canceladas para
    // no dejar responsableId apuntando a un documento inexistente.
    await getDB().collection('actividades').updateMany(
        { responsableId: orador._id },
        { $set: { responsableId: null } }
    );

    res.json({ mensaje: `El orador "${orador.nombre}" fue eliminado.`, codigo: orador.codigo });
}

module.exports = {
    listar,
    obtener,
    crear,
    actualizar,
    cambiarEstado,
    eliminar,
    // Se exportan para reutilizarlos desde postulaciones.controller.js (SW-17)
    // y para las pruebas de Kenner (SW-34).
    ESTADOS_ORADOR,
    validarOrador,
    construirDocumento,
    contarActividadesActivas
};
