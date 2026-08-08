// ==========================================================================
// CONTROLADOR DE PARTICIPANTES — controllers/participantes.controller.js
// Responsable: Kenner Gamboa (SW-16)
//
// HU-28: Visualizar participantes
// HU-27: (editar datos del participante)
// Operaciones: listar, editar, eliminar
// ==========================================================================

const { ObjectId } = require('mongodb');
const { getDB } = require('../config/db');
const {
    validarRequerido,
    validarCorreo,
    validarTelefono,
    validarCedula,
    validarNombre,
    validarEdad,
    filtrarCampos
} = require('../utils/validaciones.server');

// ── GET /api/participantes ──────────────────────────────────────────────
// Lista participantes. Admite filtros por actividadId y estado.

async function listarParticipantes(req, res, next) {
    try {
        const db = getDB();
        const filtro = {};

        if (req.query.estado) {
            filtro.estado = req.query.estado;
        }

        if (req.query.actividadId) {
            try {
                filtro.actividades = new ObjectId(req.query.actividadId);
            } catch {
                return res.status(400).json({ error: true, mensaje: 'actividadId no es válido.' });
            }
        }

        const participantes = await db.collection('participantes')
            .find(filtro)
            .sort({ fechaInscripcion: -1 })
            .toArray();

        return res.status(200).json({ error: false, participantes });

    } catch (err) {
        next(err);
    }
}

// ── PUT /api/participantes/:id ──────────────────────────────────────────
// Edita los datos de un participante existente.

async function editarParticipante(req, res, next) {
    try {
        const { id } = req.params;
        let _id;
        try {
            _id = new ObjectId(id);
        } catch {
            return res.status(400).json({ error: true, mensaje: 'ID de participante no válido.' });
        }

        const campos = filtrarCampos(req.body, [
            'nombreCompleto', 'correo', 'telefono',
            'edad', 'carrera', 'estado'
        ]);

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
            return res.status(400).json({ error: true, errores });
        }

        const db = getDB();
        const resultado = await db.collection('participantes').updateOne(
            { _id },
            { $set: { ...campos, updatedAt: new Date() } }
        );

        if (resultado.matchedCount === 0) {
            return res.status(404).json({ error: true, mensaje: 'Participante no encontrado.' });
        }

        return res.status(200).json({ error: false, mensaje: 'Participante actualizado correctamente.' });

    } catch (err) {
        next(err);
    }
}

// ── DELETE /api/participantes/:id ───────────────────────────────────────
// Elimina un participante y libera el cupo de sus actividades.

async function eliminarParticipante(req, res, next) {
    try {
        const { id } = req.params;
        let _id;
        try {
            _id = new ObjectId(id);
        } catch {
            return res.status(400).json({ error: true, mensaje: 'ID de participante no válido.' });
        }

        const db = getDB();

        const participante = await db.collection('participantes').findOne({ _id });
        if (!participante) {
            return res.status(404).json({ error: true, mensaje: 'Participante no encontrado.' });
        }

        // Decrementar cupoOcupado en cada actividad inscrita
        if (participante.actividades && participante.actividades.length > 0) {
            await db.collection('actividades').updateMany(
                { _id: { $in: participante.actividades } },
                { $inc: { cupoOcupado: -1 } }
            );
        }

        // Eliminación real del documento
        await db.collection('participantes').deleteOne({ _id });

        return res.status(200).json({ error: false, mensaje: 'Participante eliminado correctamente.' });

    } catch (err) {
        next(err);
    }
}

module.exports = { listarParticipantes, editarParticipante, eliminarParticipante };
