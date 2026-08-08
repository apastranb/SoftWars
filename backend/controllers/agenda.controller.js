// ==========================================================================
// CONTROLLER: AGENDA — backend/controllers/agenda.controller.js
// Recibe peticiones HTTP, llama al service y responde.
// Responsable original: Kenner Gamboa (SW-26)
//
// RF-17: Agenda del evento agrupada por fecha y hora.
// RF-18: Exportación con window.print() en el cliente.
//
// GET /api/eventos/agenda/:eventoId
// ==========================================================================

const { errorNoEncontrado } = require('../utils/respuestas');
const agendaService = require('../services/agenda.service');

async function obtenerAgenda(req, res, next) {
    const resultado = await agendaService.obtenerAgenda(req.params.eventoId);

    if (!resultado) return next(errorNoEncontrado('El evento solicitado no existe.'));

    return res.status(200).json({
        error: false,
        evento: resultado.evento,
        agenda: resultado.agenda
    });
}

module.exports = { obtenerAgenda };
