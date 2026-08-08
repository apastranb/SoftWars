// ==========================================================================
// CONTROLLER: INSCRIPCIONES — backend/controllers/inscripciones.controller.js
// Recibe peticiones HTTP, llama al service y responde.
// Responsable original: Kenner Gamboa (SW-16)
//
// HU-27: Inscribirse a una actividad
// RF-25: No permite inscripción duplicada
// RF-26: No permite conflicto de horario
// RF-23: No permite que el responsable se inscriba en su propia actividad
// RF-08: Cambia estado de actividad a Llena cuando se agota el cupo
// SW-30: Vista global de inscripciones con filtros
// ==========================================================================

const inscripcionesService = require('../services/inscripciones.service');

// ── POST /api/inscripciones ─────────────────────────────────────────────

async function crearInscripcion(req, res, next) {
    try {
        const resultado = await inscripcionesService.crearInscripcion(req.body);

        if (!resultado.exito) {
            const respuesta = { error: true };
            if (resultado.errores) respuesta.errores = resultado.errores;
            if (resultado.mensaje) respuesta.mensaje = resultado.mensaje;
            return res.status(resultado.status).json(respuesta);
        }

        return res.status(201).json({
            error: false,
            mensaje: 'Inscripción registrada correctamente.',
            id: resultado.id
        });
    } catch (err) {
        next(err);
    }
}

// ── DELETE /api/inscripciones/:id ───────────────────────────────────────

async function cancelarInscripcion(req, res, next) {
    try {
        const resultado = await inscripcionesService.cancelarInscripcion(req.params.id);

        if (!resultado.exito) {
            return res.status(resultado.status).json({ error: true, mensaje: resultado.mensaje });
        }

        return res.status(200).json({ error: false, mensaje: 'Inscripción cancelada correctamente.' });
    } catch (err) {
        next(err);
    }
}

// ── GET /api/inscripciones ──────────────────────────────────────────────

async function listarInscripciones(req, res, next) {
    try {
        const resultado = await inscripcionesService.listarInscripciones(req.query);

        if (!resultado.exito) {
            return res.status(resultado.status).json({ error: true, mensaje: resultado.mensaje });
        }

        return res.status(200).json({ error: false, inscripciones: resultado.inscripciones });
    } catch (err) {
        next(err);
    }
}

module.exports = { crearInscripcion, cancelarInscripcion, listarInscripciones };
