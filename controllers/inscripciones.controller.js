// ==========================================================================
// CONTROLADOR DE INSCRIPCIONES — controllers/inscripciones.controller.js
// Responsable: Kenner Gamboa (SW-16)
//
// HU-27: Inscribirse a una actividad
// RF-25: No permite inscripción duplicada
// RF-26: No permite conflicto de horario
// RF-23: No permite que el responsable se inscriba en su propia actividad
// RF-08: Cambia estado de actividad a Llena cuando se agota el cupo
// SW-30: Vista global de inscripciones con filtros
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
    filtrarCampos,
    validarInscripcionDuplicada,
    esResponsableDeActividad,
    tieneCupoDisponible
} = require('../utils/validaciones.server');

// ── POST /api/inscripciones ─────────────────────────────────────────────
// Inscribe a un visitante en una o varias actividades.

async function crearInscripcion(req, res, next) {
    try {
        const campos = filtrarCampos(req.body, [
            'idDocumento', 'nombreCompleto', 'correo',
            'telefono', 'edad', 'carrera', 'actividadIds', 'metodoPago'
        ]);

        const { idDocumento, nombreCompleto, correo, telefono, edad, carrera, actividadIds, metodoPago } = campos;

        // ── Validaciones de campos ──────────────────────────────────────
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
        if (!actividadIds || !Array.isArray(actividadIds) || actividadIds.length === 0)
            errores.push('Debe seleccionar al menos una actividad.');

        if (errores.length > 0) {
            return res.status(400).json({ error: true, errores });
        }

        // Convertir IDs a ObjectId
        let idsActividades;
        try {
            idsActividades = actividadIds.map(id => new ObjectId(id));
        } catch {
            return res.status(400).json({ error: true, mensaje: 'Uno o más IDs de actividad no son válidos.' });
        }

        const db = getDB();

        // ── Cargar actividades seleccionadas ────────────────────────────
        const actividades = await db.collection('actividades')
            .find({ _id: { $in: idsActividades } })
            .toArray();

        if (actividades.length !== idsActividades.length) {
            return res.status(404).json({ error: true, mensaje: 'Una o más actividades no fueron encontradas.' });
        }

        // ── Cargar oradores para verificar responsable ──────────────────
        const oradores = await db.collection('oradores').find({}).toArray();

        // ── Cargar participantes existentes para verificar duplicados ───
        const participantesExistentes = await db.collection('participantes')
            .find({ correo: correo.toLowerCase().trim() })
            .toArray();

        // ── Reglas de negocio ───────────────────────────────────────────
        const erroresNegocio = [];

        for (const actividad of actividades) {
            // RF-08: Cupo disponible
            if (!tieneCupoDisponible(actividad)) {
                erroresNegocio.push(`La actividad "${actividad.nombre}" no tiene cupo disponible.`);
                continue;
            }

            // RF-25: Inscripción duplicada
            if (validarInscripcionDuplicada(correo, actividad._id, participantesExistentes)) {
                erroresNegocio.push(`Ya estás inscrito en la actividad "${actividad.nombre}".`);
                continue;
            }

            // RF-23: El responsable no puede inscribirse en su propia actividad
            if (esResponsableDeActividad(correo, actividad, oradores)) {
                erroresNegocio.push(`No puedes inscribirte en "${actividad.nombre}" porque eres el responsable.`);
                continue;
            }
        }

        // RF-26: Conflicto de horario entre las actividades seleccionadas
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
            return res.status(409).json({ error: true, errores: erroresNegocio });
        }

        // ── Generar código único ────────────────────────────────────────
        const total = await db.collection('participantes').countDocuments();
        const codigo = `P-${String(total + 1).padStart(3, '0')}`;

        // ── Insertar participante ───────────────────────────────────────
        const nuevoParticipante = {
            codigo,
            idDocumento:     idDocumento.trim(),
            nombreCompleto:  nombreCompleto.trim(),
            correo:          correo.toLowerCase().trim(),
            telefono:        telefono.trim(),
            edad:            parseInt(edad, 10),
            carrera:         carrera?.trim() || '',
            actividades:     idsActividades,
            estado:          'Activo',
            metodoPago:      metodoPago || 'exento',
            fechaInscripcion: new Date(),
            createdAt:       new Date(),
            updatedAt:       new Date(),
            createdBy:       null  // origen público
        };

        const resultado = await db.collection('participantes').insertOne(nuevoParticipante);

        // ── Incrementar cupoOcupado en cada actividad ───────────────────
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

        return res.status(201).json({
            error:   false,
            mensaje: 'Inscripción registrada correctamente.',
            id:      resultado.insertedId
        });

    } catch (err) {
        next(err);
    }
}

// ── DELETE /api/inscripciones/:id ───────────────────────────────────────
// Cancela una inscripción y libera el cupo en las actividades.

async function cancelarInscripcion(req, res, next) {
    try {
        const { id } = req.params;
        let _id;
        try {
            _id = new ObjectId(id);
        } catch {
            return res.status(400).json({ error: true, mensaje: 'ID de inscripción no válido.' });
        }

        const db = getDB();
        const participante = await db.collection('participantes').findOne({ _id });

        if (!participante) {
            return res.status(404).json({ error: true, mensaje: 'Inscripción no encontrada.' });
        }

        if (participante.estado === 'Cancelado') {
            return res.status(409).json({ error: true, mensaje: 'Esta inscripción ya está cancelada.' });
        }

        // Marcar como Cancelado
        await db.collection('participantes').updateOne(
            { _id },
            { $set: { estado: 'Cancelado', updatedAt: new Date() } }
        );

        // Decrementar cupoOcupado y recalcular estado
        if (participante.actividades && participante.actividades.length > 0) {
            for (const actividadId of participante.actividades) {
                const actividad = await db.collection('actividades').findOne({ _id: actividadId });
                if (!actividad) continue;

                const nuevoCupo  = Math.max(0, actividad.cupoOcupado - 1);
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

        return res.status(200).json({ error: false, mensaje: 'Inscripción cancelada correctamente.' });

    } catch (err) {
        next(err);
    }
}

// ── GET /api/inscripciones ──────────────────────────────────────────────
// SW-30: Vista global de inscripciones con filtros.
// Admite filtros por actividadId, estado, categoria y fecha.

async function listarInscripciones(req, res, next) {
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

        if (req.query.fecha) {
            const inicio = new Date(req.query.fecha + 'T00:00:00');
            const fin    = new Date(req.query.fecha + 'T23:59:59');
            filtro.fechaInscripcion = { $gte: inicio, $lte: fin };
        }

        const participantes = await db.collection('participantes')
            .find(filtro)
            .sort({ fechaInscripcion: -1 })
            .toArray();

        // Enriquecer con nombres de actividades
        const todasActividades = await db.collection('actividades').find({}).toArray();
        const mapaActividades  = {};
        todasActividades.forEach(a => { mapaActividades[a._id.toString()] = a.nombre; });

        const resultado = participantes.map(p => ({
            ...p,
            actividadesNombres: (p.actividades || []).map(id => mapaActividades[id.toString()] || id.toString())
        }));

        return res.status(200).json({ error: false, inscripciones: resultado });

    } catch (err) {
        next(err);
    }
}

module.exports = { crearInscripcion, cancelarInscripcion, listarInscripciones };
