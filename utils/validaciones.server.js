// ==========================================================================
// VALIDACIONES DEL SERVIDOR — utils/validaciones.server.js
// Atiende la observación OB-04 del profesor: la validación del navegador
// puede omitirse (con Postman o desactivando JavaScript), así que las mismas
// reglas se repiten aquí antes de escribir en MongoDB.
//
// ALCANCE DE ESTE ARCHIVO
// Contiene únicamente los VALIDADORES DE CAMPO, que son el espejo exacto de
// public/js/validaciones.js. Se agregaron ahora porque las APIs de oradores,
// stands y postulaciones (SW-12, SW-14, SW-17) los necesitan en el sprint 1.
//
// Las reglas de negocio propias de cada módulo (cupos, inscripciones
// duplicadas, conflictos de horario) NO van aquí: viven en el controller de
// su módulo. SW-20 (Kenner) amplía este archivo con lo que falte de
// participantes e inscripciones sin tener que tocar lo ya escrito.
//
// Iniciado por: Josué Arroyo (SW-12) — a completar por Kenner Gamboa (SW-20)
// ==========================================================================

// ── VALIDADORES DE CAMPO (espejo de public/js/validaciones.js) ────────────

/** Valida que un campo de texto no venga vacío ni sea solo espacios. */
function validarRequerido(valor) {
    return typeof valor === 'string' && valor.trim() !== '';
}

/** Valida formato de correo electrónico: usuario@dominio.ext */
function validarCorreo(correo) {
    if (typeof correo !== 'string') return false;
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(correo.trim());
}

/** Valida teléfono costarricense: 8 dígitos, con o sin guión. */
function validarTelefono(telefono) {
    if (typeof telefono !== 'string') return false;
    return /^[0-9]{8}$/.test(telefono.replace(/-/g, ''));
}

/** Valida cédula o documento de identidad: entre 8 y 12 dígitos. */
function validarCedula(idDocumento) {
    if (typeof idDocumento !== 'string') return false;
    return /^[0-9]{8,12}$/.test(idDocumento.replace(/-/g, ''));
}

/** Valida nombre: mínimo 3 caracteres. */
function validarNombre(nombre) {
    return typeof nombre === 'string' && nombre.trim().length >= 3;
}

/**
 * RF-02 — Contraseña sin vocales.
 * Longitud 8-16, al menos un número, un especial, una mayúscula, una
 * minúscula y CERO vocales.
 */
function validarContrasena(password) {
    if (typeof password !== 'string') return false;
    return password.length >= 8 && password.length <= 16 &&
        /[0-9]/.test(password) &&
        /[!@#$%^&*(),.?":{}|<>\-_=+\[\]\\;'/~`]/.test(password) &&
        /[A-Z]/.test(password) &&
        /[a-z]/.test(password) &&
        /^[^aeiouAEIOUáéíóúÁÉÍÓÚ]+$/.test(password);
}

/**
 * Valida una descripción o biografía: máximo 200 caracteres.
 * @param {string} texto
 * @param {boolean} [esRequerido=false] - Si es true, no puede venir vacía.
 */
function validarDescripcion(texto, esRequerido = false) {
    if (typeof texto !== 'string') return !esRequerido;
    if (esRequerido && texto.trim() === '') return false;
    if (texto.trim() === '') return true;
    return texto.trim().length <= 200;
}

/** Valida edad: entero entre 15 y 120. */
function validarEdad(edad) {
    const numero = parseInt(edad, 10);
    return !isNaN(numero) && numero >= 15 && numero <= 120;
}

/** Valida cupo máximo: entero mayor o igual a 1. */
function validarCupo(cupo) {
    const numero = parseInt(cupo, 10);
    return !isNaN(numero) && numero >= 1;
}

/** Valida que la hora de fin sea posterior a la de inicio (formato HH:mm). */
function validarHorasOrden(horaInicio, horaFin) {
    if (!horaInicio || !horaFin) return true;
    return horaFin > horaInicio;
}

/** Valida que la fecha de fin no sea anterior a la de inicio. */
function validarFechasOrden(fechaInicio, fechaFin) {
    if (!fechaInicio || !fechaFin) return true;
    return new Date(`${fechaFin}T00:00:00`) >= new Date(`${fechaInicio}T00:00:00`);
}

/** Valida que un valor pertenezca a un catálogo, ignorando mayúsculas. */
function validarEnCatalogo(valor, catalogo) {
    if (typeof valor !== 'string') return false;
    return catalogo.some(opcion => opcion.toLowerCase() === valor.trim().toLowerCase());
}

// ── NORMALIZADORES ────────────────────────────────────────────────────────
// El frontend de la iteración 1 guarda algunos valores en minúscula
// ("aprobado", "activo") mientras que utils/catalogos.js los define
// capitalizados. Estas funciones evitan que esa diferencia genere registros
// inconsistentes en la base de datos.

/** Recorta espacios y devuelve cadena vacía si el valor no es texto. */
function limpiar(valor) {
    return typeof valor === 'string' ? valor.trim() : '';
}

/** Normaliza un valor al que corresponda del catálogo, respetando su forma canónica. */
function normalizarCatalogo(valor, catalogo, porDefecto = null) {
    const encontrado = catalogo.find(
        opcion => opcion.toLowerCase() === limpiar(valor).toLowerCase()
    );
    return encontrado || porDefecto;
}

/** Deja el teléfono en formato 0000-0000. Devuelve '' si no es válido. */
function normalizarTelefono(telefono) {
    const digitos = limpiar(telefono).replace(/-/g, '');
    if (!/^[0-9]{8}$/.test(digitos)) return '';
    return `${digitos.slice(0, 4)}-${digitos.slice(4)}`;
}

/** Pasa el correo a minúsculas y sin espacios, para comparaciones de unicidad. */
function normalizarCorreo(correo) {
    return limpiar(correo).toLowerCase();
}

/**
 * Acepta el teléfono en cualquiera de las formas que envía el frontend
 * (un string, `telefono` + `telefono2`, o un arreglo `telefonos`) y devuelve
 * siempre un arreglo normalizado sin vacíos ni repetidos.
 * RF-12 y RF-24 hablan de "teléfonos" en plural.
 * @param {object} cuerpo - req.body
 * @returns {string[]}
 */
function extraerTelefonos(cuerpo) {
    const candidatos = Array.isArray(cuerpo.telefonos)
        ? cuerpo.telefonos
        : [cuerpo.telefono, cuerpo.telefono2, cuerpo.telefonoSecundario];

    const normalizados = candidatos
        .map(normalizarTelefono)
        .filter(Boolean);

    return [...new Set(normalizados)];
}

module.exports = {
    validarRequerido,
    validarCorreo,
    validarTelefono,
    validarCedula,
    validarNombre,
    validarContrasena,
    validarDescripcion,
    validarEdad,
    validarCupo,
    validarHorasOrden,
    validarFechasOrden,
    validarEnCatalogo,
    limpiar,
    normalizarCatalogo,
    normalizarTelefono,
    normalizarCorreo,
    extraerTelefonos
};
