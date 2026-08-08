// ==========================================================================
// UTILIDADES DE ACCESO A MONGODB — utils/mongo.js
// Responsable: Josué Arroyo (SW-12)
//
// Dos problemas que resuelve este archivo:
//
// 1. Convivencia de identificadores. MongoDB genera _id (ObjectId), pero el
//    frontend de la iteración 1 trabaja con códigos legibles ("OR-001").
//    Durante la migración (SW-27) van a coexistir, así que los endpoints
//    aceptan cualquiera de los dos en :id.
//
// 2. Forma de la respuesta. El frontend actual lee `documento.id`. Para no
//    romperlo mientras se migra, cada documento que sale de la API incluye
//    `id` con el _id en texto, además de `_id` y `codigo`.
// ==========================================================================

const { ObjectId } = require('mongodb');

/**
 * Convierte una cadena a ObjectId si tiene el formato correcto.
 * @param {string} valor
 * @returns {ObjectId|null} null si no es un ObjectId válido.
 */
function aObjectId(valor) {
    if (valor instanceof ObjectId) return valor;
    if (typeof valor === 'string' && ObjectId.isValid(valor) && String(new ObjectId(valor)) === valor) {
        return new ObjectId(valor);
    }
    return null;
}

/**
 * Construye el filtro para buscar un documento por _id o por código legible.
 *
 * Ejemplos:
 *   filtroPorId('68a1f0c3e4b0a1d2c3e4f5a6')  →  { _id: ObjectId(...) }
 *   filtroPorId('OR-001')                    →  { codigo: 'OR-001' }
 *
 * @param {string} id - Valor recibido en el parámetro de ruta.
 * @returns {object} Filtro listo para findOne / updateOne / deleteOne.
 */
function filtroPorId(id) {
    const objectId = aObjectId(id);
    return objectId ? { _id: objectId } : { codigo: String(id) };
}

/**
 * Añade el alias `id` (texto) a un documento para compatibilidad con el
 * frontend que todavía no se ha migrado. No modifica el original.
 * @param {object|null} documento
 * @returns {object|null}
 */
function conAlias(documento) {
    if (!documento) return documento;
    return { ...documento, id: String(documento._id) };
}

/**
 * Aplica `conAlias` a una lista de documentos.
 * @param {object[]} documentos
 * @returns {object[]}
 */
function conAliasLista(documentos) {
    return documentos.map(conAlias);
}

/**
 * Escapa los caracteres especiales de una expresión regular, para poder
 * usar texto que escribe el usuario dentro de un $regex sin riesgo de que
 * un paréntesis o un punto rompan la consulta.
 * @param {string} texto
 * @returns {string}
 */
function escaparRegex(texto) {
    return String(texto).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * Construye una condición $regex insensible a mayúsculas y acentos básicos
 * para búsquedas por texto libre.
 * @param {string} texto
 * @returns {object} Condición lista para usar en un filtro.
 */
function busquedaTexto(texto) {
    return { $regex: escaparRegex(texto.trim()), $options: 'i' };
}

module.exports = {
    aObjectId,
    filtroPorId,
    conAlias,
    conAliasLista,
    escaparRegex,
    busquedaTexto
};
