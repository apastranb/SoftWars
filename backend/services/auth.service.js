// ==========================================================================
// SERVICE: AUTH — backend/services/auth.service.js
// Operaciones de MongoDB para autenticación.
// Responsable original: Kenner Gamboa (SW-10)
// ==========================================================================

const bcrypt = require('bcryptjs');
const { getDB } = require('../config/db');
const { validarCorreo, validarContrasena, validarRequerido, filtrarCampos } = require('../utils/validaciones.server');

const BCRYPT_ROUNDS = parseInt(process.env.BCRYPT_ROUNDS, 10) || 10;

// ==========================================================================
// OPERACIONES
// ==========================================================================

/**
 * HU-01: Verificar credenciales e iniciar sesión.
 */
async function verificarCredenciales(email, password) {
    if (!validarCorreo(email) || !validarRequerido(password)) {
        return { exito: false, status: 401, mensaje: 'Correo o contraseña incorrectos.' };
    }

    const db = getDB();
    const usuario = await db.collection('usuarios').findOne({
        email: email.toLowerCase().trim()
    });

    if (!usuario) {
        return { exito: false, status: 401, mensaje: 'Correo o contraseña incorrectos.' };
    }

    const coincide = await bcrypt.compare(password, usuario.passwordHash);
    if (!coincide) {
        return { exito: false, status: 401, mensaje: 'Correo o contraseña incorrectos.' };
    }

    if (usuario.estado !== 'Activo') {
        return { exito: false, status: 401, mensaje: 'Esta cuenta se encuentra inactiva. Contacta a un administrador.' };
    }

    // Actualizar último acceso
    await db.collection('usuarios').updateOne(
        { _id: usuario._id },
        { $set: { ultimoAcceso: new Date() } }
    );

    const datosUsuario = {
        _id: usuario._id.toString(),
        nombre: usuario.nombre,
        email: usuario.email,
        rol: usuario.rol
    };

    return { exito: true, usuario: datosUsuario };
}

/**
 * HU-04: Cambiar contraseña.
 */
async function cambiarContrasena(email, passwordActual, passwordNueva) {
    // Validaciones
    const errores = [];
    if (!validarCorreo(email))
        errores.push('El correo no es válido.');
    if (!validarRequerido(passwordActual))
        errores.push('La contraseña actual es requerida.');
    if (!validarContrasena(passwordNueva))
        errores.push('La nueva contraseña no cumple los requisitos de seguridad (8-16 caracteres, sin vocales, mayúscula, minúscula, número y carácter especial).');

    if (errores.length > 0) {
        return { exito: false, status: 400, errores };
    }

    const db = getDB();
    const usuario = await db.collection('usuarios').findOne({
        email: email.toLowerCase().trim()
    });

    if (!usuario) {
        return { exito: false, status: 404, mensaje: 'No existe ninguna cuenta registrada con ese correo.' };
    }

    const coincide = await bcrypt.compare(passwordActual, usuario.passwordHash);
    if (!coincide) {
        return { exito: false, status: 401, mensaje: 'La contraseña actual es incorrecta.' };
    }

    const nuevoHash = await bcrypt.hash(passwordNueva, BCRYPT_ROUNDS);
    await db.collection('usuarios').updateOne(
        { _id: usuario._id },
        { $set: { passwordHash: nuevoHash, updatedAt: new Date() } }
    );

    return { exito: true };
}

module.exports = {
    verificarCredenciales,
    cambiarContrasena,
    BCRYPT_ROUNDS
};
