// ==========================================================================
// MODELO: ORADOR — backend/models/orador.model.js
// Define la estructura, campos permitidos y valores por defecto.
// ==========================================================================

const COLECCION = 'oradores';

const CAMPOS_PERMITIDOS_EDICION = [
    'nombre', 'telefonos', 'telefono', 'especialidad', 'empresa',
    'biografia', 'foto', 'estado', 'eventoId'
];

const CAMPOS_INMUTABLES = ['correo', 'codigo'];

const ESTADOS = ['Activo', 'Inactivo'];

const ESTADO_DEFAULT = 'Activo';

/** Estados de actividad que se consideran "activos" para efectos del RF-13. */
const ESTADOS_ACTIVIDAD_VIGENTE = ['Disponible', 'Llena'];

module.exports = {
    COLECCION,
    CAMPOS_PERMITIDOS_EDICION,
    CAMPOS_INMUTABLES,
    ESTADOS,
    ESTADO_DEFAULT,
    ESTADOS_ACTIVIDAD_VIGENTE
};
