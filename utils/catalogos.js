// ==========================================================================
// CATÁLOGOS DE VALORES PERMITIDOS — utils/catalogos.js
// Fuente: Doc de Diseño 2, apartado 4.6
//
// Estos valores se usan en validaciones del servidor, del cliente,
// y como referencia para la base de datos. Un cambio aquí se refleja
// en todo el sistema.
// ==========================================================================

const CATEGORIAS_ACTIVIDAD = [
    'Culturales',
    'Deportivas',
    'Tecnológicas',
    'Artísticas',
    'Voluntariado',
    'Recreación'
];

const ESTADOS_EVENTO = ['Disponible', 'Llena', 'Cancelada', 'Finalizada'];

const ESTADOS_STAND = ['Aprobado', 'Cerrado'];

const ESTADOS_PARTICIPANTE = ['Activo', 'Cancelado'];

const ESTADOS_POSTULACION = ['Pendiente', 'Aprobada', 'Rechazada'];

const ESTADOS_USUARIO = ['Activo', 'Inactivo'];

const ROLES_USUARIO = ['Administrador', 'Super Administrador', 'Editor', 'Moderador'];

const VISIBILIDAD_EVENTO = ['publico', 'privado'];

const TIPO_ENTRADA = ['libre', 'pago'];

const CATEGORIAS_STAND = ['empresa', 'personal'];

const ESPACIOS_UNIVERSIDAD = [
    'Auditorio',
    'Parqueo',
    'Laboratorio 1',
    'Laboratorio 2',
    'Laboratorio 3',
    'Laboratorio 4',
    'Laboratorio 5',
    'Laboratorio 6',
    'Laboratorio 7',
    'Laboratorio 8',
    'Laboratorio 9',
    'Laboratorio 10',
    'Laboratorio 11'
];

module.exports = {
    CATEGORIAS_ACTIVIDAD,
    ESTADOS_EVENTO,
    ESTADOS_STAND,
    ESTADOS_PARTICIPANTE,
    ESTADOS_POSTULACION,
    ESTADOS_USUARIO,
    ROLES_USUARIO,
    VISIBILIDAD_EVENTO,
    TIPO_ENTRADA,
    CATEGORIAS_STAND,
    ESPACIOS_UNIVERSIDAD
};
