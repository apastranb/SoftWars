// ==========================================================================
// CREACIÓN DE ÍNDICES — utils/crearIndices.js
// Responsable: Adonis Pastrana (SW-7)
//
// Fuente: Documento de Diseño 2, apartado 4.4.
//
// Se llama UNA SOLA VEZ desde config/db.js al arrancar el servidor,
// después de establecer la conexión. MongoDB ignora índices que ya existen,
// por lo que es seguro invocarlo en cada arranque.
//
// Índices implementados:
//   usuarios      → email único
//   eventos       → codigo único, índice compuesto para catálogo público,
//                   índice de texto para búsqueda libre
//   actividades   → eventoId simple, índice de texto para búsqueda libre
//   oradores      → correo único
//   stands        → eventoId simple, índice único compuesto (numero + anio)
//   participantes → idDocumento único, índice compuesto correo + actividades
//   postulaciones → índice compuesto correo + actividadId
// ==========================================================================

const { getDB } = require('../config/db');

/**
 * Crea todos los índices de las siete colecciones.
 * El flag { background: true } ya no es necesario en MongoDB 4.2+
 * (todos los índices se construyen en segundo plano por defecto).
 * Se usa { sparse: true } en campos que pueden ser nulos para no desperdiciar
 * espacio del índice con documentos que no tienen ese campo.
 */
async function crearIndices() {
    const db = getDB();

    // ── USUARIOS ──────────────────────────────────────────────────────────
    // Email como credencial de acceso: debe ser único y acelera el login.
    await db.collection('usuarios').createIndex(
        { email: 1 },
        { unique: true, name: 'usuarios_email_unico' }
    );

    // ── EVENTOS ───────────────────────────────────────────────────────────
    // Codigo legible único (EV-001, EV-002, …)
    await db.collection('eventos').createIndex(
        { codigo: 1 },
        { unique: true, name: 'eventos_codigo_unico' }
    );

    // Consulta del catálogo público: la más frecuente del sistema.
    // Filtra por visibilidad + estado y ordena por fechaInicio.
    await db.collection('eventos').createIndex(
        { visibilidad: 1, estado: 1, fechaInicio: 1 },
        { name: 'eventos_catalogo_publico' }
    );

    // Búsqueda por texto libre en nombre, lugar y descripción (RF-19, RF-30).
    // MongoDB solo permite UN índice de texto por colección.
    await db.collection('eventos').createIndex(
        { nombre: 'text', lugar: 'text', descripcion: 'text' },
        { name: 'eventos_texto', default_language: 'spanish' }
    );

    // ── ACTIVIDADES ───────────────────────────────────────────────────────
    // Carga de todas las actividades de un evento (detalle-evento.html).
    await db.collection('actividades').createIndex(
        { eventoId: 1 },
        { name: 'actividades_eventoId' }
    );

    // Búsqueda de actividades por nombre y lugar (RF-19).
    await db.collection('actividades').createIndex(
        { nombre: 'text', lugar: 'text' },
        { name: 'actividades_texto', default_language: 'spanish' }
    );

    // ── ORADORES ─────────────────────────────────────────────────────────
    // Correo único: evita registrar dos veces al mismo presentador.
    await db.collection('oradores').createIndex(
        { correo: 1 },
        { unique: true, name: 'oradores_correo_unico' }
    );

    // Listado de oradores por evento (panel admin y detalle público).
    await db.collection('oradores').createIndex(
        { eventoId: 1 },
        { name: 'oradores_eventoId' }
    );

    // ── STANDS ────────────────────────────────────────────────────────────
    // Listado de stands por evento.
    await db.collection('stands').createIndex(
        { eventoId: 1 },
        { name: 'stands_eventoId' }
    );

    // RF-15: La combinación numero + anio debe ser única dentro del sistema.
    // Garantiza que la numeración anual de stands no se repita.
    await db.collection('stands').createIndex(
        { numero: 1, anio: 1 },
        { unique: true, sparse: true, name: 'stands_numero_anio_unico' }
    );

    // ── PARTICIPANTES ─────────────────────────────────────────────────────
    // Un documento de identidad corresponde a un solo participante.
    await db.collection('participantes').createIndex(
        { idDocumento: 1 },
        { unique: true, name: 'participantes_idDocumento_unico' }
    );

    // RF-25: Soporta la verificación de inscripción duplicada (correo + actividad).
    await db.collection('participantes').createIndex(
        { correo: 1, actividades: 1 },
        { name: 'participantes_correo_actividades' }
    );

    // ── POSTULACIONES ─────────────────────────────────────────────────────
    // RF-25 aplicado a postulaciones: mismo correo no repite solicitud
    // en la misma actividad mientras esté pendiente o aprobada.
    await db.collection('postulaciones').createIndex(
        { correo: 1, actividadId: 1 },
        { name: 'postulaciones_correo_actividad' }
    );

    console.log('[db] Índices verificados/creados correctamente.');
}

module.exports = { crearIndices };
