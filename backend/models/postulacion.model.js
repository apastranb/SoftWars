// ==========================================================================
// MODELO: POSTULACIÓN — backend/models/postulacion.model.js
// Define la estructura, campos permitidos y valores por defecto.
// ==========================================================================

const COLECCION = 'postulaciones';

const ESTADOS = ['Pendiente', 'Aprobada', 'Rechazada'];

/** Estados que ocupan un "cupo" de postulación para efectos del RF-25. */
const ESTADOS_QUE_BLOQUEAN = ['Pendiente', 'Aprobada'];

const ESTADO_DEFAULT = 'Pendiente';

module.exports = {
    COLECCION,
    ESTADOS,
    ESTADOS_QUE_BLOQUEAN,
    ESTADO_DEFAULT
};
