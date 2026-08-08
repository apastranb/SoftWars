// ==========================================================================
// MODELO: ACTIVIDAD — backend/models/actividad.model.js
// ==========================================================================

const COLECCION = 'actividades';

const CAMPOS_PERMITIDOS_EDICION = [
    'nombre', 'categoria', 'descripcion', 'fecha', 'horaInicio', 'horaFin',
    'lugar', 'cupoMaximo', 'responsableId', 'estado', 'visibilidad',
    'entradaLibre', 'incluyeRefrigerio'
];

const CAMPOS_INMUTABLES = ['cupoOcupado', 'codigo', 'eventoId'];

const ESTADO_DEFAULT = 'Disponible';

module.exports = { COLECCION, CAMPOS_PERMITIDOS_EDICION, CAMPOS_INMUTABLES, ESTADO_DEFAULT };
