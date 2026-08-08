// ==========================================================================
// SERVICE: PARTICIPANTES — backend/services/participantes.service.js
// Operaciones de MongoDB para la colección participantes (admin).
// Responsable original: Kenner Gamboa (SW-16)
// ==========================================================================

const { ObjectId } = require('mongodb');
const { getDB } = require('../config/db');
const { filtrarCampos, validarCorreo, validarTelefono, validarNombre, validarEdad } = require('../utils/validaciones.server');
const { COLECCION, CAMPOS_EDITABLES } = require('../models/participante.model');

// ==========================================================================
// OPERACIONES
// ==========================================================================

/**
 * GET — Listar participantes con filtros.
 */
async function listarParticipantes(filtros = {}) {
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

    const participantes = await db.collection(COLECCION)
        .find(filtro)
        .sort({ fechaInscripcion: -1 })
        .toArray();

    return { exito: true, participantes };
}

/**
 * PUT — Editar datos de un participante.
 */
async function editarParticipante(id, datos) {
    let _id;
    try {
        _id = new ObjectId(id);
    } catch {
        return { exito: false, status: 400, mensaje: 'ID de participante no válido.' };
    }

    const campos = filtrarCampos(datos, CAMPOS_EDITABLES);

    // Validaciones
    const errores = [];
    if (campos.nombreCompleto !== undefined && !validarNombre(campos.nombreCompleto))
        errores.push('El nombre debe tener al menos 3 caracteres.');
    if (campos.correo !== undefined && !validarCorreo(campos.correo))
        errores.push('El correo no tiene un formato válido.');
    if (campos.telefono !== undefined && !validarTelefono(campos.telefono))
        errores.push('El teléfono debe tener 8 dígitos.');
    if (campos.edad !== undefined && !validarEdad(campos.edad))
        errores.push('La edad debe ser un número entre 15 y 120.');

    if (errores.length > 0) {
        return { exito: false, status: 400, errores };
    }

    const db = getDB();
    const resultado = await db.collection(COLECCION).updateOne(
        { _id },
        { $set: { ...campos, updatedAt: new Date() } }
    );

    if (resultado.matchedCount === 0) {
        return { exito: false, status: 404, mensaje: 'Participante no encontrado.' };
    }

    return { exito: true };
}

/**
 * DELETE — Eliminar participante y liberar cupo.
 */
async function eliminarParticipante(id) {
    let _id;
    try {
        _id = new ObjectId(id);
    } catch {
        return { exito: false, status: 400, mensaje: 'ID de participante no válido.' };
    }

    const db = getDB();
    const participante = await db.collection(COLECCION).findOne({ _id });

    if (!participante) {
        return { exito: false, status: 404, mensaje: 'Participante no encontrado.' };
    }

    // Decrementar cupoOcupado en cada actividad inscrita
    if (participante.actividades && participante.actividades.length > 0) {
        await db.collection('actividades').updateMany(
            { _id: { $in: participante.actividades } },
            { $inc: { cupoOcupado: -1 } }
        );
    }

    await db.collection(COLECCION).deleteOne({ _id });

    return { exito: true };
}

module.exports = {
    listarParticipantes,
    editarParticipante,
    eliminarParticipante
};
