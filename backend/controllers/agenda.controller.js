// ==========================================================================
// CONTROLADOR DE AGENDA — controllers/agenda.controller.js
// Responsable: Kenner Gamboa (SW-26)
//
// RF-17: Agenda del evento agrupada por fecha y hora, con el orador
//        responsable de cada actividad e indicador de refrigerio.
// RF-18: La exportación usa window.print() en el cliente con hoja de
//        estilos de impresión — no se genera ningún archivo en el servidor.
//
// GET /api/agenda/:eventoId
// ==========================================================================

const { getDB }       = require('../config/db');
const { filtroPorId, conAlias, conAliasLista } = require('../utils/mongo');
const { errorNoEncontrado } = require('../utils/respuestas');

async function obtenerAgenda(req, res, next) {
    const db = getDB();

    // Buscar el evento por _id o código legible
    const filtroEvento = filtroPorId(req.params.eventoId);
    const evento = await db.collection('eventos').findOne(filtroEvento);
    if (!evento) return next(errorNoEncontrado('El evento solicitado no existe.'));

    // Obtener todas las actividades del evento ordenadas por fecha y hora
    const actividades = await db.collection('actividades')
        .find({ eventoId: evento._id })
        .sort({ fecha: 1, horaInicio: 1 })
        .toArray();

    // Obtener todos los oradores del evento para resolver responsableId
    const oradores = await db.collection('oradores')
        .find({ eventoId: evento._id })
        .toArray();

    // Índice de oradores por _id para búsqueda rápida
    const mapaOradores = {};
    oradores.forEach(o => { mapaOradores[o._id.toString()] = o; });

    // Agrupar actividades por fecha (RF-17)
    const porFecha = {};
    actividades.forEach(act => {
        const fecha = act.fecha
            ? new Date(act.fecha).toLocaleDateString('es-CR', {
                weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
              })
            : 'Sin fecha';

        if (!porFecha[fecha]) porFecha[fecha] = [];

        // Resolver responsable
        const responsable = act.responsableId
            ? mapaOradores[act.responsableId.toString()] || null
            : null;

        porFecha[fecha].push({
            ...conAlias(act),
            responsableNombre:    responsable?.nombre    || '—',
            responsableEmpresa:   responsable?.empresa   || '—',
            responsableEspecialidad: responsable?.especialidad || '—'
        });
    });

    // Convertir a array ordenado para el cliente
    const agenda = Object.entries(porFecha).map(([fecha, items]) => ({
        fecha,
        actividades: items
    }));

    return res.status(200).json({
        error:  false,
        evento: conAlias(evento),
        agenda
    });
}

module.exports = { obtenerAgenda };
