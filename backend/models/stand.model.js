// ==========================================================================
// MODELO: STAND — backend/models/stand.model.js
// Define la estructura, campos permitidos y valores por defecto.
// ==========================================================================

const COLECCION = 'stands';

const CAMPOS_PERMITIDOS_EDICION = [
    'nombre', 'categoria', 'descripcion', 'encargado', 'empresa',
    'telefono', 'estado', 'eventoId'
];

const CAMPOS_INMUTABLES = ['correo', 'numero', 'anio', 'codigo'];

const ESTADOS = ['Aprobado', 'Cerrado'];

const CATEGORIAS = ['empresa', 'personal'];

const ESTADO_DEFAULT = 'Aprobado';

const CATEGORIA_DEFAULT = 'empresa';

module.exports = {
    COLECCION,
    CAMPOS_PERMITIDOS_EDICION,
    CAMPOS_INMUTABLES,
    ESTADOS,
    CATEGORIAS,
    ESTADO_DEFAULT,
    CATEGORIA_DEFAULT
};
