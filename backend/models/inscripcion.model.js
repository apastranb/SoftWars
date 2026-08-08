// ==========================================================================
// MODELO: INSCRIPCIÓN — backend/models/inscripcion.model.js
// Define la estructura y valores por defecto para participantes/inscripciones.
// ==========================================================================

const COLECCION_PARTICIPANTES = 'participantes';

const ESTADOS = ['Activo', 'Cancelado'];

const ESTADO_DEFAULT = 'Activo';

const CAMPOS_INSCRIPCION = [
    'idDocumento', 'nombreCompleto', 'correo',
    'telefono', 'edad', 'carrera', 'actividadIds', 'actividades', 'eventoId', 'metodoPago'
];

module.exports = {
    COLECCION_PARTICIPANTES,
    ESTADOS,
    ESTADO_DEFAULT,
    CAMPOS_INSCRIPCION
};
