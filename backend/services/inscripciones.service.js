// ==========================================================================
// SERVICE: INSCRIPCIONES — backend/services/inscripciones.service.js
// Operaciones de MongoDB para inscripciones de participantes.
// Responsable original: Kenner Gamboa (SW-16)
// ==========================================================================

const { ObjectId } = require('mongodb');
const { getDB } = require('../config/db');
const { sellarAuditoria, sellarActualizacion } = require('../utils/auditoria');
const {
    validarCorreo, validarTelefono, validarCedula, validarNombre, validarEdad,
    filtrarCampos, validarInscripcionDuplicada, esResponsableDeActividad, tieneCupoDisponible
} = require('../utils/validaciones.server');
const { COLECCION_PARTICIPANTES, ESTADO_DEFAULT, CAMPOS_INSCRIPCION } = require('../models/inscripcion.model');

// ==========================================================================
// OPERACIONES
// ==========================================================================

/**
 * POST — Inscribir visitante en una o varias actividades.
 * Retorna { exito, data, errores, status }
 */
async function crearInscripcion(datos) {
    const campos = filtrarCampos(datos, CAMPOS_INSCRIPCION);

    const { idDocumento, nombreCompleto, correo, telefono, edad, carrera, metodoPago } = campos;
    const actividadIds = campos.actividadIds || campos.actividades || [];

    // Validaciones de campos
    const errores = [];
    if (!validarCedula(idDocumento))
        errores.push('El documento de identidad debe tener entre 8 y 12 dígitos.');
    if (!validarNombre(nombreCompleto))
        errores.push('El nombre debe tener al menos 3 caracteres.');
    if (!validarCorreo(correo))
        errores.push('El correo no tiene un formato válido.');
    if (!validarTelefono(telefono))
        errores.push('El teléfono debe tener 8 dígitos.');
    if (!validarEdad(edad))
        errores.push('La edad debe ser un número entre 15 y 120.');

    if (errores.length > 0) {
        return { exito: false, status: 400, errores };
    }

    // Parsear IDs de actividades
    let idsActividades = [];
    if (actividadIds && Array.isArray(actividadIds) && actividadIds.length > 0) {
        try {
            idsActividades = actividadIds.map(id => new ObjectId(id));
        } catch {
            return { exito: false, status: 400, mensaje: 'Uno o más IDs de actividad no son válidos.' };
        }
    }

    const db = getDB();

    // Verificar si el evento tiene actividades y el usuario no seleccionó ninguna
    if (idsActividades.length === 0) {
        const eventoId = datos.eventoId;
        if (eventoId) {
            let filtroEvento;
            try { filtroEvento = { eventoId: new ObjectId(eventoId) }; } catch { filtroEvento = { eventoId }; }
            const totalActividades = await db.collection('actividades').countDocuments(filtroEvento);
            if (totalActividades > 0) {
                return { exito: false, status: 400, mensaje: 'Debe seleccionar al menos una actividad.' };
            }
        }
    }

    // Cargar actividades seleccionadas
    let actividades = [];
    if (idsActividades.length > 0) {
        actividades = await db.collection('actividades')
            .find({ _id: { $in: idsActividades } })
            .toArray();

        if (actividades.length !== idsActividades.length) {
            return { exito: false, status: 404, mensaje: 'Una o más actividades no fueron encontradas.' };
        }
    }

    // Cargar oradores y participantes existentes para validaciones de negocio
    const oradores = await db.collection('oradores').find({}).toArray();
    const participantesExistentes = await db.collection(COLECCION_PARTICIPANTES)
        .find({ correo: correo.toLowerCase().trim() })
        .toArray();

    // Reglas de negocio
    const erroresNegocio = [];

    for (const actividad of actividades) {
        if (!tieneCupoDisponible(actividad)) {
            erroresNegocio.push(`La actividad "${actividad.nombre}" no tiene cupo disponible.`);
            continue;
        }
        if (validarInscripcionDuplicada(correo, actividad._id, participantesExistentes)) {
            erroresNegocio.push(`Ya estás inscrito en la actividad "${actividad.nombre}".`);
            continue;
        }
        if (esResponsableDeActividad(correo, actividad, oradores)) {
            erroresNegocio.push(`No puedes inscribirte en "${actividad.nombre}" porque eres el responsable.`);
            continue;
        }
    }

    // RF-26: Conflicto de horario
    for (let i = 0; i < actividades.length; i++) {
        for (let j = i + 1; j < actividades.length; j++) {
            const a = actividades[i];
            const b = actividades[j];
            if (
                a.fecha?.toString() === b.fecha?.toString() &&
                a.horaInicio === b.horaInicio
            ) {
                erroresNegocio.push(
                    `Conflicto de horario entre "${a.nombre}" y "${b.nombre}": misma fecha y hora de inicio.`
                );
            }
        }
    }

    if (erroresNegocio.length > 0) {
        return { exito: false, status: 409, errores: erroresNegocio };
    }

    // Generar código
    const total = await db.collection(COLECCION_PARTICIPANTES).countDocuments();
    const codigo = `P-${String(total + 1).padStart(3, '0')}`;

    // Insertar participante
    const nuevoParticipante = {
        codigo,
        idDocumento: idDocumento.trim(),
        nombreCompleto: nombreCompleto.trim(),
        correo: correo.toLowerCase().trim(),
        telefono: telefono.trim(),
        edad: parseInt(edad, 10),
        carrera: carrera?.trim() || '',
        actividades: idsActividades,
        estado: ESTADO_DEFAULT,
        metodoPago: metodoPago || 'exento',
        fechaInscripcion: new Date(),
        createdAt: new Date(),
        updatedAt: new Date(),
        createdBy: null
    };

    const resultado = await db.collection(COLECCION_PARTICIPANTES).insertOne(nuevoParticipante);

    // Incrementar cupoOcupado en cada actividad
    for (const actividad of actividades) {
        const nuevoCupo = actividad.cupoOcupado + 1;
        const nuevoEstado = (!actividad.entradaLibre && nuevoCupo >= actividad.cupoMaximo)
            ? 'Llena'
            : actividad.estado;

        await db.collection('actividades').updateOne(
            { _id: actividad._id },
            {
                $inc: { cupoOcupado: 1 },
                $set: { estado: nuevoEstado, updatedAt: new Date() }
            }
        );
    }

    return { exito: true, id: resultado.insertedId };
}

/**
 * DELETE — Cancelar inscripción y liberar cupo.
 */
async function cancelarInscripcion(id) {
    let _id;
    try {
        _id = new ObjectId(id);
    } catch {
        return { exito: false, status: 400, mensaje: 'ID de inscripción no válido.' };
    }

    const db = getDB();
    const participante = await db.collection(COLECCION_PARTICIPANTES).findOne({ _id });

    if (!participante) {
        return { exito: false, status: 404, mensaje: 'Inscripción no encontrada.' };
    }

    if (participante.estado === 'Cancelado') {
        return { exito: false, status: 409, mensaje: 'Esta inscripción ya está cancelada.' };
    }

    // Marcar como Cancelado
    await db.collection(COLECCION_PARTICIPANTES).updateOne(
        { _id },
        { $set: { estado: 'Cancelado', updatedAt: new Date() } }
    );

    // Decrementar cupoOcupado y recalcular estado
    if (participante.actividades && participante.actividades.length > 0) {
        for (const actividadId of participante.actividades) {
            const actividad = await db.collection('actividades').findOne({ _id: actividadId });
            if (!actividad) continue;

            const nuevoEstado = actividad.estado === 'Llena' ? 'Disponible' : actividad.estado;

            await db.collection('actividades').updateOne(
                { _id: actividadId },
                {
                    $inc: { cupoOcupado: -1 },
                    $set: { estado: nuevoEstado, updatedAt: new Date() }
                }
            );
        }
    }

    return { exito: true };
}

/**
 * GET — Vista global de inscripciones con filtros (SW-30).
 */
async function listarInscripciones(filtros = {}) {
    const db = getDB();
    const filtro = {};

    if (filtros.estado) {
        filtro.estado = filtros.estado;
    }

    if (filtros.actividadId) {
        try {
            filtro.actividades = new ObjectId(filtros.actividadId);
        } catch {
            return { exito: false, status: 400, mensaje: 'actividadId no es válido.' };
        }
    }

    if (filtros.fecha) {
        const inicio = new Date(filtros.fecha + 'T00:00:00');
        const fin = new Date(filtros.fecha + 'T23:59:59');
        filtro.fechaInscripcion = { $gte: inicio, $lte: fin };
    }

    const participantes = await db.collection(COLECCION_PARTICIPANTES)
        .find(filtro)
        .sort({ fechaInscripcion: -1 })
        .toArray();

    // Enriquecer con nombres de actividades
    const todasActividades = await db.collection('actividades').find({}).toArray();
    const mapaActividades = {};
    todasActividades.forEach(a => { mapaActividades[a._id.toString()] = a.nombre; });

    const resultado = participantes.map(p => ({
        ...p,
        id: String(p._id),
        actividadesNombres: (p.actividades || []).map(id => mapaActividades[id.toString()] || id.toString())
    }));

    return { exito: true, inscripciones: resultado };
}

module.exports = {
    crearInscripcion,
    cancelarInscripcion,
    listarInscripciones
};
