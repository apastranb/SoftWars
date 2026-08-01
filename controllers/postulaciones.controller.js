// ==========================================================================
// CONTROLLER DE POSTULACIONES DE ORADOR — controllers/postulaciones.controller.js
// Responsable: Josué Arroyo (SW-17)
//
// Requerimientos que implementa:
//   RF-24  Formulario público de solicitud: nombre completo, correo,
//          teléfonos, profesión/especialidad, foto y la actividad a la que
//          desea aplicar.
//   RF-25  Prevención de duplicados: el mismo correo no puede postularse dos
//          veces a la MISMA actividad, pero sí a actividades distintas.
//   HU-10  El administrador aprueba o rechaza; al aprobar se crea el orador
//          correspondiente en la colección `oradores`.
//
// Nota sobre el modelo de datos:
//   El Doc de Diseño 2 (apartado 4.2) describe la postulación con `eventoId`,
//   mientras que RF-24 y el formulario público (postular-participante.js)
//   trabajan con `actividadId`. Se guardan AMBOS: `actividadId` es el dato
//   que envía el usuario y `eventoId` se deriva de la actividad para poder
//   filtrar por evento en el panel sin un $lookup en cada consulta.
// ==========================================================================

const { getDB } = require('../config/db');
const { siguienteCodigo } = require('../utils/codigos');
const { filtroPorId, conAlias, conAliasLista, busquedaTexto, aObjectId } = require('../utils/mongo');
const { errorNoEncontrado, errorConflicto, errorValidacion } = require('../utils/respuestas');
const { ESTADOS_POSTULACION } = require('../utils/catalogos');
const { ESTADOS_ORADOR } = require('./oradores.controller');
const v = require('../utils/validaciones.server');

const COLECCION = 'postulaciones';

/** Estados que ocupan un "cupo" de postulación para efectos del RF-25. */
const ESTADOS_QUE_BLOQUEAN = ['Pendiente', 'Aprobada'];

// ==========================================================================
// VALIDACIÓN (OB-04 — segunda barrera en el servidor)
// ==========================================================================

/**
 * Valida el cuerpo de una postulación con las mismas reglas que
 * postular-participante-logic.js.
 * @param {object} cuerpo - req.body
 * @returns {object} Mapa { campo: mensaje }. Vacío si todo es válido.
 */
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

    // RF-24 pide "teléfonos": el principal es obligatorio, el segundo opcional.
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

/**
 * GET /api/postulaciones
 * Filtros: ?q= &estado= &actividadId= &eventoId=
 * Uso administrativo: bandeja de solicitudes pendientes.
 */
async function listar(req, res) {
    const { q, estado, actividadId, eventoId } = req.query;
    const filtro = {};

    if (q && q.trim()) {
        const texto = busquedaTexto(q);
        filtro.$or = [
            { nombre: texto }, { correo: texto },
            { especialidad: texto }, { organizacion: texto }, { codigo: texto }
        ];
    }
    if (estado) filtro.estado = v.normalizarCatalogo(estado, ESTADOS_POSTULACION, estado);
    if (actividadId) filtro.actividadId = aObjectId(actividadId) || actividadId;
    if (eventoId) filtro.eventoId = aObjectId(eventoId) || eventoId;

    const postulaciones = await getDB().collection(COLECCION)
        .find(filtro)
        .sort({ fechaPostulacion: -1 })
        .toArray();

    res.json(conAliasLista(postulaciones));
}

/** GET /api/postulaciones/:id — acepta ObjectId o código legible (PT-001). */
async function obtener(req, res) {
    const postulacion = await getDB().collection(COLECCION).findOne(filtroPorId(req.params.id));
    if (!postulacion) throw errorNoEncontrado('La postulación solicitada no existe.');
    res.json(conAlias(postulacion));
}

/**
 * POST /api/postulaciones — RF-24 y RF-25.
 * Endpoint PÚBLICO: cualquier visitante puede postularse sin autenticarse.
 */
async function crear(req, res) {
    const errores = validarPostulacion(req.body);
    if (Object.keys(errores).length > 0) throw errorValidacion(errores);

    const db = getDB();
    const coleccion = db.collection(COLECCION);

    // La actividad debe existir: es la referencia que el usuario seleccionó.
    const actividadIdRecibido = req.body.actividadId;
    const objectId = aObjectId(actividadIdRecibido);
    const actividad = await db.collection('actividades').findOne(
        objectId ? { _id: objectId } : { codigo: String(actividadIdRecibido) }
    );
    if (!actividad) {
        throw errorValidacion({ actividad: 'La actividad seleccionada no existe.' });
    }

    const correo = v.normalizarCorreo(req.body.correo);

    // RF-25 — el mismo correo no puede repetir postulación en la MISMA
    // actividad, pero sí puede postularse a otras actividades.
    const duplicada = await coleccion.findOne({
        correo: correo,
        actividadId: actividad._id,
        estado: { $in: ESTADOS_QUE_BLOQUEAN }
    });
    if (duplicada) {
        throw errorConflicto(
            `El correo ${correo} ya tiene una postulación registrada para la actividad "${actividad.nombre}". ` +
            'Puede postularse a otra actividad con el mismo correo.'
        );
    }

    const telefonos = v.extraerTelefonos(req.body);
    const organizacion = req.body.organizacion !== undefined ? req.body.organizacion : req.body.empresa;

    const documento = {
        codigo: await siguienteCodigo('PT', COLECCION),
        nombre: v.limpiar(req.body.nombre),
        correo: correo,
        telefonos: telefonos,
        telefono: telefonos[0],
        especialidad: v.limpiar(req.body.especialidad),
        organizacion: v.limpiar(organizacion),
        empresa: v.limpiar(organizacion),   // alias esperado por el Doc de Diseño 2
        biografia: v.limpiar(req.body.biografia),
        foto: req.body.foto || null,
        actividadId: actividad._id,
        eventoId: actividad.eventoId || null,
        estado: 'Pendiente',
        fechaPostulacion: new Date()
    };

    const resultado = await coleccion.insertOne(documento);
    res.status(201).json(conAlias({ _id: resultado.insertedId, ...documento }));
}

/**
 * PATCH /api/postulaciones/:id/aprobar — HU-10.
 *
 * Solo se aprueban las postulaciones en estado Pendiente. Al aprobar se crea
 * el orador correspondiente. Si ya existe un orador con ese correo (por
 * ejemplo, alguien que ya presentó en otro evento), se reutiliza el registro
 * existente en lugar de duplicarlo: el índice único de `oradores.correo`
 * rechazaría el insert de todas formas.
 */
async function aprobar(req, res) {
    const db = getDB();
    const coleccion = db.collection(COLECCION);
    const postulacion = await coleccion.findOne(filtroPorId(req.params.id));
    if (!postulacion) throw errorNoEncontrado('La postulación solicitada no existe.');

    if (postulacion.estado !== 'Pendiente') {
        throw errorConflicto(
            `Esta postulación ya fue procesada (estado actual: ${postulacion.estado}). ` +
            'Solo se pueden aprobar postulaciones pendientes.'
        );
    }

    const oradores = db.collection('oradores');
    let orador = await oradores.findOne({ correo: postulacion.correo });
    let creado = false;

    if (!orador) {
        const documento = {
            codigo: await siguienteCodigo('OR', 'oradores'),
            nombre: postulacion.nombre,
            correo: postulacion.correo,
            telefonos: postulacion.telefonos || [],
            telefono: postulacion.telefono || '',
            especialidad: postulacion.especialidad,
            empresa: postulacion.organizacion,
            biografia: postulacion.biografia,
            foto: postulacion.foto || null,
            eventoId: postulacion.eventoId || null,
            estado: ESTADOS_ORADOR[0],           // 'Activo'
            fechaRegistro: new Date(),
            origenPostulacionId: postulacion._id  // trazabilidad de dónde salió
        };
        const resultado = await oradores.insertOne(documento);
        orador = { _id: resultado.insertedId, ...documento };
        creado = true;
    }

    await coleccion.updateOne(
        { _id: postulacion._id },
        {
            $set: {
                estado: 'Aprobada',
                fechaResolucion: new Date(),
                oradorId: orador._id,
                resueltaPor: (req.session && req.session.usuario && req.session.usuario.email) || null
            }
        }
    );

    res.json({
        mensaje: creado
            ? `Postulación aprobada. Se registró a "${orador.nombre}" como orador (${orador.codigo}).`
            : `Postulación aprobada. "${orador.nombre}" ya existía como orador (${orador.codigo}) y se reutilizó su perfil.`,
        postulacion: conAlias({ ...postulacion, estado: 'Aprobada', oradorId: orador._id }),
        orador: conAlias(orador),
        oradorCreado: creado
    });
}

/**
 * PATCH /api/postulaciones/:id/rechazar — HU-10.
 * Solo se rechazan postulaciones pendientes. Admite un motivo opcional.
 */
async function rechazar(req, res) {
    const coleccion = getDB().collection(COLECCION);
    const postulacion = await coleccion.findOne(filtroPorId(req.params.id));
    if (!postulacion) throw errorNoEncontrado('La postulación solicitada no existe.');

    if (postulacion.estado !== 'Pendiente') {
        throw errorConflicto(
            `Esta postulación ya fue procesada (estado actual: ${postulacion.estado}). ` +
            'Solo se pueden rechazar postulaciones pendientes.'
        );
    }

    const motivo = v.limpiar(req.body.motivo);
    if (motivo && !v.validarDescripcion(motivo, false)) {
        throw errorValidacion({ motivo: 'El motivo no puede superar los 200 caracteres.' });
    }

    await coleccion.updateOne(
        { _id: postulacion._id },
        {
            $set: {
                estado: 'Rechazada',
                motivoRechazo: motivo || null,
                fechaResolucion: new Date(),
                resueltaPor: (req.session && req.session.usuario && req.session.usuario.email) || null
            }
        }
    );

    res.json({
        mensaje: `La postulación de "${postulacion.nombre}" fue rechazada.`,
        postulacion: conAlias({ ...postulacion, estado: 'Rechazada', motivoRechazo: motivo || null })
    });
}

/**
 * DELETE /api/postulaciones/:id
 * Descarta una solicitud de la bandeja. No afecta al orador si ya fue creado.
 */
async function eliminar(req, res) {
    const coleccion = getDB().collection(COLECCION);
    const postulacion = await coleccion.findOne(filtroPorId(req.params.id));
    if (!postulacion) throw errorNoEncontrado('La postulación solicitada no existe.');

    await coleccion.deleteOne({ _id: postulacion._id });

    res.json({
        mensaje: `La postulación de "${postulacion.nombre}" fue eliminada.`,
        codigo: postulacion.codigo
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
