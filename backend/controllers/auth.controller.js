// ==========================================================================
// CONTROLLER: AUTH — backend/controllers/auth.controller.js
// Recibe peticiones HTTP, llama al service y responde.
// Responsable original: Kenner Gamboa (SW-10)
//
// HU-01: Iniciar sesión con bcrypt
// HU-02: Cerrar sesión
// HU-04: Modificar contraseña
// ==========================================================================

const { filtrarCampos } = require('../utils/validaciones.server');
const authService = require('../services/auth.service');

// ── HU-01: Iniciar sesión ───────────────────────────────────────────────

async function login(req, res, next) {
    try {
        const { email, password } = req.body;
        const resultado = await authService.verificarCredenciales(email, password);

        if (!resultado.exito) {
            return res.status(resultado.status).json({
                error: true,
                mensaje: resultado.mensaje
            });
        }

        // Guardar sesión
        req.session.usuario = resultado.usuario;

        return res.status(200).json({
            error: false,
            mensaje: 'Sesión iniciada correctamente.',
            usuario: resultado.usuario
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
                error: false,
                mensaje: 'Sesión cerrada correctamente.'
            });
        });
    } catch (err) {
        next(err);
    }
}

// ── GET /api/auth/sesion ────────────────────────────────────────────────

function obtenerSesion(req, res) {
    if (!req.session || !req.session.usuario) {
        return res.status(401).json({
            error: true,
            mensaje: 'No hay sesión activa.'
        });
    }
    return res.status(200).json({
        error: false,
        usuario: req.session.usuario
    });
}

// ── HU-04: Modificar contraseña ─────────────────────────────────────────

async function cambiarContrasena(req, res, next) {
    try {
        const campos = filtrarCampos(req.body, ['email', 'passwordActual', 'passwordNueva']);
        const { email, passwordActual, passwordNueva } = campos;

        const resultado = await authService.cambiarContrasena(email, passwordActual, passwordNueva);

        if (!resultado.exito) {
            const respuesta = { error: true };
            if (resultado.errores) respuesta.errores = resultado.errores;
            if (resultado.mensaje) respuesta.mensaje = resultado.mensaje;
            return res.status(resultado.status).json(respuesta);
        }

        return res.status(200).json({
            error: false,
            mensaje: 'Contraseña actualizada correctamente.'
        });
    } catch (err) {
        next(err);
    }
}

module.exports = { login, logout, obtenerSesion, cambiarContrasena };
