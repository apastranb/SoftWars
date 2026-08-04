// ==========================================================================
// VALIDACIONES DEL SERVIDOR — utils/validaciones.server.js
// Responsable: Kenner Gamboa (SW-20)
//
// Replica exactamente las mismas reglas de public/js/validaciones.js
// para que ninguna escritura llegue a MongoDB sin pasar por esta capa.
// Los controllers importan este módulo y llaman a sus funciones antes
// de ejecutar cualquier operación sobre la base de datos.
// ==========================================================================

// ── VALIDADORES DE CAMPO ────────────────────────────────────────────────

/** Valida que un valor no esté vacío tras trim(). */
function validarRequerido(valor) {
    if (typeof valor !== 'string') return false;
    return valor.trim() !== '';
}

/**
 * Valida formato de correo electrónico.
 * Patrón: usuario@dominio.ext
 */
function validarCorreo(correo) {
    if (typeof correo !== 'string') return false;
    const patron = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return patron.test(correo.trim());
}

/**
 * RF-02: Contraseña sin vocales.
 * Longitud 8-16, al menos 1 número, 1 carácter especial,
 * 1 mayúscula, 1 minúscula y CERO vocales.
 */
function validarContrasena(password) {
    if (typeof password !== 'string') return false;
    const tieneLongitud  = password.length >= 8 && password.length <= 16;
    const tieneNumero    = /[0-9]/.test(password);
    const tieneEspecial  = /[!@#$%^&*(),.?":{}|<>\-_=+\[\]\\;'/~`]/.test(password);
    const tieneMayuscula = /[A-Z]/.test(password);
    const tieneMinuscula = /[a-z]/.test(password);
    const ceroVocales    = /^[^aeiouAEIOUáéíóúÁÉÍÓÚ]+$/.test(password);
    return tieneLongitud && tieneNumero && tieneEspecial && tieneMayuscula && tieneMinuscula && ceroVocales;
}

/**
 * Valida teléfono costarricense (8 dígitos, con o sin guión).
 */
function validarTelefono(telefono) {
    if (typeof telefono !== 'string') return false;
    const limpio = telefono.replace(/-/g, '');
    return /^[0-9]{8}$/.test(limpio);
}

/**
 * Valida cédula / documento de identidad (8 a 12 dígitos, con o sin guiones).
 */
function validarCedula(idDocumento) {
    if (typeof idDocumento !== 'string') return false;
    const limpio = idDocumento.replace(/-/g, '');
    return /^[0-9]{8,12}$/.test(limpio);
}

/** Valida nombre (mínimo 3 caracteres). */
function validarNombre(nombre) {
    if (typeof nombre !== 'string') return false;
    return nombre.trim().length >= 3;
}

/**
 * Valida que una fecha sea futura (posterior a hoy).
 * @param {string} fechaStr - Fecha en formato YYYY-MM-DD.
 */
function validarFechaFutura(fechaStr) {
    if (!fechaStr) return false;
    const fecha = new Date(fechaStr + 'T00:00:00');
    const hoy   = new Date();
    hoy.setHours(0, 0, 0, 0);
    return fecha > hoy;
}

/**
 * Valida descripción.
 * Si esRequerido=true no puede estar vacía.
 * Si tiene contenido no puede superar 200 caracteres.
 */
function validarDescripcion(texto, esRequerido = false) {
    if (typeof texto !== 'string') return !esRequerido;
    if (esRequerido && texto.trim() === '') return false;
    if (texto.trim() === '') return true;
    return texto.trim().length <= 200;
}

/** Valida edad (número entero entre 15 y 120). */
function validarEdad(edad) {
    const num = parseInt(edad, 10);
    return !isNaN(num) && num >= 15 && num <= 120;
}

/** Valida cupo máximo (número entero mayor o igual a 1). */
function validarCupo(cupo) {
    const num = parseInt(cupo, 10);
    return !isNaN(num) && num >= 1;
}

/**
 * Valida que fechaFin no sea anterior a fechaInicio.
 * @param {string} fechaInicio - Formato YYYY-MM-DD.
 * @param {string} fechaFin    - Formato YYYY-MM-DD.
 */
function validarFechasOrden(fechaInicio, fechaFin) {
    if (!fechaInicio || !fechaFin) return true;
    return new Date(fechaFin + 'T00:00:00') >= new Date(fechaInicio + 'T00:00:00');
}

/**
 * Valida que horaFin sea posterior a horaInicio.
 * @param {string} horaInicio - Formato HH:mm.
 * @param {string} horaFin    - Formato HH:mm.
 */
function validarHorasOrden(horaInicio, horaFin) {
    if (!horaInicio || !horaFin) return true;
    return horaFin > horaInicio;
}

// ── VALIDADORES DE LÓGICA DE NEGOCIO ────────────────────────────────────

/**
 * RF-25: Verifica si un correo ya está inscrito en una actividad específica.
 * Se usa en el controller de inscripciones antes de insertar.
 * @param {string}   correo      - Correo del participante.
 * @param {string}   actividadId - ID de la actividad (string o ObjectId).
 * @param {object[]} participantes - Documentos de la colección participantes.
 */
function validarInscripcionDuplicada(correo, actividadId, participantes) {
    return participantes.some(p =>
        p.estado === 'Activo' &&
        p.correo.toLowerCase() === correo.toLowerCase() &&
        p.actividades.some(id => id.toString() === actividadId.toString())
    );
}

/**
 * Verifica si el correo pertenece al responsable de la actividad.
 * Impide que el orador responsable se inscriba en su propia actividad (RF-23).
 * @param {string}   correo      - Correo a verificar.
 * @param {object}   actividad   - Documento de la actividad (con responsableId).
 * @param {object[]} oradores    - Documentos de la colección oradores.
 */
function esResponsableDeActividad(correo, actividad, oradores) {
    if (!actividad.responsableId) return false;
    const responsable = oradores.find(o =>
        o._id.toString() === actividad.responsableId.toString()
    );
    return responsable && responsable.correo.toLowerCase() === correo.toLowerCase();
}

/**
 * Verifica si una actividad tiene cupo disponible.
 * @param {object} actividad - Documento de la colección actividades.
 */
function tieneCupoDisponible(actividad) {
    if (actividad.entradaLibre) return true;
    return actividad.cupoOcupado < actividad.cupoMaximo;
}

/**
 * Filtra una lista blanca de campos del body para no persistir campos
 * no autorizados en MongoDB (defensa contra inyección NoSQL).
 * @param {object}   body         - req.body completo.
 * @param {string[]} camposPermitidos - Lista de campos que sí se aceptan.
 * @returns {object} Objeto limpio con solo los campos permitidos.
 */
function filtrarCampos(body, camposPermitidos) {
    const limpio = {};
    camposPermitidos.forEach(campo => {
        if (body[campo] !== undefined) {
            limpio[campo] = body[campo];
        }
    });
    return limpio;
}

// ── EXPORTAR ─────────────────────────────────────────────────────────────

module.exports = {
    validarRequerido,
    validarCorreo,
    validarContrasena,
    validarTelefono,
    validarCedula,
    validarNombre,
    validarFechaFutura,
    validarDescripcion,
    validarEdad,
    validarCupo,
    validarFechasOrden,
    validarHorasOrden,
    validarInscripcionDuplicada,
    esResponsableDeActividad,
    tieneCupoDisponible,
    filtrarCampos
};
