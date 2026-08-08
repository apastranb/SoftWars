// ==========================================================================
// MODELO: PARTICIPANTE — backend/models/participante.model.js
// Define la estructura, campos permitidos y valores por defecto.
// ==========================================================================

const COLECCION = 'participantes';

const CAMPOS_EDITABLES = ['nombreCompleto', 'correo', 'telefono', 'edad', 'carrera', 'estado'];

const CAMPOS_INMUTABLES = ['idDocumento', 'correo'];

const ESTADOS = ['Activo', 'Cancelado'];

const ESTADO_DEFAULT = 'Activo';

module.exports = {
    COLECCION,
    CAMPOS_EDITABLES,
    CAMPOS_INMUTABLES,
    ESTADOS,
    ESTADO_DEFAULT
};
