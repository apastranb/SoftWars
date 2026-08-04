// ==========================================================================
// CONTROLADOR DE AUTENTICACIÓN — controllers/auth.controller.js
// Responsable: Kenner Gamboa (SW-10)
//
// HU-01: Iniciar sesión con bcrypt
// HU-02: Cerrar sesión
// HU-04: Modificar contraseña
// Verifica credenciales contra la colección usuarios de MongoDB.
// Las contraseñas se comparan con bcrypt.compare — nunca en texto plano.
// El campo passwordHash NUNCA se incluye en las respuestas.
// ==========================================================================

const bcrypt  = require('bcryptjs');
const { getDB } = require('../config/db');
const { validarCorreo, validarContrasena, validarRequerido, filtrarCampos } = require('../utils/validaciones.server');

const BCRYPT_ROUNDS = parseInt(process.env.BCRYPT_ROUNDS, 10) || 10;

// ── HU-01: Iniciar sesión ───────────────────────────────────────────────

async function login(req, res, next) {
    try {
        const { email, password } = req.body;

        // Validación de entrada
        if (!validarCorreo(email) || !validarRequerido(password)) {
            return res.status(400).json({
                error: true,
                mensaje: 'Correo o contraseña incorrectos.'
            });
        }

        const db = getDB();
        const usuario = await db.collection('usuarios').findOne({
            email: email.toLowerCase().trim()
        });

        // Mensaje genérico para no revelar si el correo existe (RF-31)
        if (!usuario) {
            return res.status(401).json({
                error: true,
                mensaje: 'Correo o contraseña incorrectos.'
            });
        }

        // Verificar contraseña con bcrypt
        const coincide = await bcrypt.compare(password, usuario.passwordHash);
        if (!coincide) {
            return res.status(401).json({
                error: true,
                mensaje: 'Correo o contraseña incorrectos.'
            });
        }

        // Verificar que la cuenta esté activa
        if (usuario.estado !== 'Activo') {
            return res.status(401).json({
                error: true,
                mensaje: 'Esta cuenta se encuentra inactiva. Contacta a un administrador.'
            });
        }

        // Actualizar último acceso
        await db.collection('usuarios').updateOne(
            { _id: usuario._id },
            { $set: { ultimoAcceso: new Date() } }
        );

        // Guardar sesión (sin exponer passwordHash)
        req.session.usuario = {
            _id:    usuario._id.toString(),
            nombre: usuario.nombre,
            email:  usuario.email,
            rol:    usuario.rol
        };

        return res.status(200).json({
            error:   false,
            mensaje: 'Sesión iniciada correctamente.',
            usuario: req.session.usuario
        });

    } catch (err) {
        next(err);
    }
}

// ── HU-02: Cerrar sesión ────────────────────────────────────────────────

function logout(req, res, next) {
    try {
        req.session.destroy(err => {
            if (err) return next(err);
            res.clearCookie('connect.sid');
            return res.status(200).json({
                error:   false,
                mensaje: 'Sesión cerrada correctamente.'
            });
        });
    } catch (err) {
        next(err);
    }
}

// ── GET /api/auth/sesion — Devuelve el usuario autenticado o 401 ─────────

function obtenerSesion(req, res) {
    if (!req.session || !req.session.usuario) {
        return res.status(401).json({
            error:   true,
            mensaje: 'No hay sesión activa.'
        });
    }
    return res.status(200).json({
        error:   false,
        usuario: req.session.usuario
    });
}

// ── HU-04: Modificar contraseña ─────────────────────────────────────────

async function cambiarContrasena(req, res, next) {
    try {
        const campos = filtrarCampos(req.body, ['email', 'passwordActual', 'passwordNueva']);
        const { email, passwordActual, passwordNueva } = campos;

        // Validar todos los campos
        const errores = [];
        if (!validarCorreo(email))
            errores.push('El correo no es válido.');
        if (!validarRequerido(passwordActual))
            errores.push('La contraseña actual es requerida.');
        if (!validarContrasena(passwordNueva))
            errores.push('La nueva contraseña no cumple los requisitos de seguridad (8-16 caracteres, sin vocales, mayúscula, minúscula, número y carácter especial).');

        if (errores.length > 0) {
            return res.status(400).json({ error: true, errores });
        }

        const db = getDB();
        const usuario = await db.collection('usuarios').findOne({
            email: email.toLowerCase().trim()
        });

        if (!usuario) {
            return res.status(404).json({
                error:   true,
                mensaje: 'No existe ninguna cuenta registrada con ese correo.'
            });
        }

        // Verificar contraseña actual
        const coincide = await bcrypt.compare(passwordActual, usuario.passwordHash);
        if (!coincide) {
            return res.status(401).json({
                error:   true,
                mensaje: 'La contraseña actual es incorrecta.'
            });
        }

        // Cifrar la nueva contraseña
        const nuevoHash = await bcrypt.hash(passwordNueva, BCRYPT_ROUNDS);

        await db.collection('usuarios').updateOne(
            { _id: usuario._id },
            { $set: { passwordHash: nuevoHash, updatedAt: new Date() } }
        );

        return res.status(200).json({
            error:   false,
            mensaje: 'Contraseña actualizada correctamente.'
        });

    } catch (err) {
        next(err);
    }
}

module.exports = { login, logout, obtenerSesion, cambiarContrasena };
