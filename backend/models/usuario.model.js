// ==========================================================================
// MODELO: USUARIO — backend/models/usuario.model.js
// ==========================================================================

const COLECCION = 'usuarios';
const CAMPOS_INMUTABLES = ['email', 'passwordHash'];
const ESTADO_DEFAULT = 'Activo';

module.exports = { COLECCION, CAMPOS_INMUTABLES, ESTADO_DEFAULT };
