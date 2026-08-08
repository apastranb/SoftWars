// ==========================================================================
// MODELO: EVENTO — backend/models/evento.model.js
// Define la estructura, campos permitidos y valores por defecto.
// ==========================================================================

const { CATEGORIAS_ACTIVIDAD, VISIBILIDAD_EVENTO, TIPO_ENTRADA } = require('../utils/catalogos');

const COLECCION = 'eventos';

const CAMPOS_PERMITIDOS_EDICION = [
    'nombre', 'categoria', 'descripcion', 'fechaInicio', 'fechaFin',
    'horaInicio', 'horaFin', 'enUniversidad', 'lugar', 'cupoMax',
    'responsable', 'tipoEntrada', 'entradaLibre', 'visibilidad',
    'estado', 'imagen'
];

const CAMPOS_INMUTABLES = ['cupoActual', 'codigo'];

const ESTADO_DEFAULT = 'Disponible';
const VISIBILIDAD_DEFAULT = 'publico';
const TIPO_ENTRADA_DEFAULT = 'libre';

module.exports = {
    COLECCION,
    CAMPOS_PERMITIDOS_EDICION,
    CAMPOS_INMUTABLES,
    ESTADO_DEFAULT,
    VISIBILIDAD_DEFAULT,
    TIPO_ENTRADA_DEFAULT
};
