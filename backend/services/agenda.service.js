// ==========================================================================
// SERVICE: AGENDA — backend/services/agenda.service.js
// Operaciones de MongoDB para la agenda de eventos.
// Responsable original: Kenner Gamboa (SW-26)
// ==========================================================================

const { getDB } = require('../config/db');
const { filtroPorId, conAlias, conAliasLista } = require('../utils/mongo');

// ==========================================================================
// OPERACIONES
// ==========================================================================

/**
 * RF-17: Obtener agenda de un evento agrupada por fecha y hora.
 */
async function obtenerAgenda(eventoId) {
    const db = getDB();

    // Buscar el evento por _id o código legible
    const filtroEvento = filtroPorId(eventoId);
    const evento = await db.collection('eventos').findOne(filtroEvento);
    if (!evento) return null;

    // Obtener actividades del evento ordenadas
    const actividades = await db.collection('actividades')
        .find({ eventoId: evento._id })
        .sort({ fecha: 1, horaInicio: 1 })
        .toArray();

    // Obtener oradores para resolver responsableId
    const oradores = await db.collection('oradores')
        .find({ eventoId: evento._id })
        .toArray();

    // Índice de oradores por _id
    const mapaOradores = {};
    oradores.forEach(o => { mapaOradores[o._id.toString()] = o; });

    // Agrupar actividades por fecha
    const porFecha = {};
    actividades.forEach(act => {
        const fecha = act.fecha
            ? new Date(act.fecha).toLocaleDateString('es-CR', {
                weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
            })
            : 'Sin fecha';

        if (!porFecha[fecha]) porFecha[fecha] = [];

        const responsable = act.responsableId
            ? mapaOradores[act.responsableId.toString()] || null
            : null;

        porFecha[fecha].push({
            ...conAlias(act),
            responsableNombre: responsable?.nombre || '—',
            responsableEmpresa: responsable?.empresa || '—',
            responsableEspecialidad: responsable?.especialidad || '—'
        });
    });

    // Convertir a array ordenado
    const agenda = Object.entries(porFecha).map(([fecha, items]) => ({
        fecha,
        actividades: items
    }));

    return { evento: conAlias(evento), agenda };
}

module.exports = { obtenerAgenda };
