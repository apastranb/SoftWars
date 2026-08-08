// ==========================================================================
// CONTROLLER: PARTICIPANTES — backend/controllers/participantes.controller.js
// Recibe peticiones HTTP, llama al service y responde.
// Responsable original: Kenner Gamboa (SW-16)
//
// HU-28: Visualizar participantes
// HU-27: Editar datos del participante
// ==========================================================================

const participantesService = require('../services/participantes.service');

// ── GET /api/participantes ──────────────────────────────────────────────

async function listarParticipantes(req, res, next) {
    try {
        const resultado = await participantesService.listarParticipantes(req.query);

        if (!resultado.exito) {
            return res.status(resultado.status).json({ error: true, mensaje: resultado.mensaje });
        }

        return res.status(200).json({ error: false, participantes: resultado.participantes });
    } catch (err) {
        next(err);
    }
}

// ── PUT /api/participantes/:id ──────────────────────────────────────────

async function editarParticipante(req, res, next) {
    try {
        const resultado = await participantesService.editarParticipante(req.params.id, req.body);

        if (!resultado.exito) {
            const respuesta = { error: true };
            if (resultado.errores) respuesta.errores = resultado.errores;
            if (resultado.mensaje) respuesta.mensaje = resultado.mensaje;
            return res.status(resultado.status).json(respuesta);
        }

        return res.status(200).json({ error: false, mensaje: 'Participante actualizado correctamente.' });
    } catch (err) {
        next(err);
    }
}

// ── DELETE /api/participantes/:id ───────────────────────────────────────

async function eliminarParticipante(req, res, next) {
    try {
        const resultado = await participantesService.eliminarParticipante(req.params.id);

        if (!resultado.exito) {
            return res.status(resultado.status).json({ error: true, mensaje: resultado.mensaje });
        }

        return res.status(200).json({ error: false, mensaje: 'Participante eliminado correctamente.' });
    } catch (err) {
        next(err);
    }
}

module.exports = { listarParticipantes, editarParticipante, eliminarParticipante };
