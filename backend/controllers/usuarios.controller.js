// ==========================================================================
// CONTROLLER: USUARIOS — backend/controllers/usuarios.controller.js
// ==========================================================================

const usuariosService = require('../services/usuarios.service');

async function listar(req, res, next) {
    try {
        const usuarios = await usuariosService.listarUsuarios();
        res.json({ data: usuarios });
    } catch (err) { next(err); }
}

async function crear(req, res, next) {
    try {
        const { nombre, email, password } = req.body;
        if (!nombre || !email || !password) {
            return res.status(400).json({ error: true, mensaje: 'Nombre, correo y contraseña son obligatorios.' });
        }
        const resultado = await usuariosService.crearUsuario(req.body, req);
        if (resultado.error) return res.status(resultado.status || 400).json({ error: true, mensaje: resultado.error });
        res.status(201).json({ data: resultado.data, mensaje: 'Administrador creado correctamente.' });
    } catch (err) { next(err); }
}

async function actualizar(req, res, next) {
    try {
        const resultado = await usuariosService.actualizarUsuario(req.params.id, req.body);
        if (!resultado) return res.status(404).json({ error: true, mensaje: 'Usuario no encontrado.' });
        if (resultado.error) return res.status(resultado.status || 400).json({ error: true, mensaje: resultado.error });
        res.json({ data: resultado.data, mensaje: 'Usuario actualizado correctamente.' });
    } catch (err) { next(err); }
}

async function eliminar(req, res, next) {
    try {
        const resultado = await usuariosService.eliminarUsuario(req.params.id);
        if (!resultado) return res.status(404).json({ error: true, mensaje: 'Usuario no encontrado.' });
        if (resultado.error) return res.status(resultado.status || 400).json({ error: true, mensaje: resultado.error });
        res.json({ mensaje: 'Usuario eliminado correctamente.' });
    } catch (err) { next(err); }
}

module.exports = { listar, crear, actualizar, eliminar };
