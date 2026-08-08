// ==========================================================================
// CONTROLLER DE USUARIOS/ADMINISTRADORES — controllers/usuarios.controller.js
// RF-03: Crear admins | RF-04: Gestionar admins | RF-31: bcrypt
// ==========================================================================

const bcrypt = require('bcryptjs');
const { getDB } = require('../config/db');
const { ObjectId } = require('mongodb');

const BCRYPT_ROUNDS = parseInt(process.env.BCRYPT_ROUNDS, 10) || 10;

// GET /api/usuarios
async function listar(req, res, next) {
    try {
        const db = getDB();
        const usuarios = await db.collection('usuarios')
            .find({}, { projection: { passwordHash: 0 } })
            .sort({ fechaCreacion: -1 })
            .toArray();

        // Agregar id string para compatibilidad con frontend
        const resultado = usuarios.map(u => ({ ...u, id: String(u._id) }));
        res.json({ data: resultado });
    } catch (err) { next(err); }
}

// POST /api/usuarios
async function crear(req, res, next) {
    try {
        const { nombre, email, password, rol } = req.body;
        const db = getDB();

        if (!nombre || !email || !password) {
            return res.status(400).json({ error: true, mensaje: 'Nombre, correo y contraseña son obligatorios.' });
        }

        // Verificar duplicado
        const existente = await db.collection('usuarios').findOne({ email: email.toLowerCase().trim() });
        if (existente) {
            return res.status(409).json({ error: true, mensaje: 'Ya existe una cuenta con ese correo.' });
        }

        const passwordHash = await bcrypt.hash(password, BCRYPT_ROUNDS);

        const documento = {
            nombre: nombre.trim(),
            email: email.toLowerCase().trim(),
            passwordHash,
            rol: rol || 'Administrador',
            estado: 'Activo',
            fechaCreacion: new Date(),
            updatedAt: new Date(),
            createdBy: req.session?.usuario?._id || null
        };

        const resultado = await db.collection('usuarios').insertOne(documento);
        documento._id = resultado.insertedId;
        delete documento.passwordHash;

        res.status(201).json({ data: { ...documento, id: String(documento._id) }, mensaje: 'Administrador creado correctamente.' });
    } catch (err) { next(err); }
}

// PUT /api/usuarios/:id
async function actualizar(req, res, next) {
    try {
        const { id } = req.params;
        const { nombre, rol, estado } = req.body;
        const db = getDB();

        let _id;
        try { _id = new ObjectId(id); } catch {
            return res.status(400).json({ error: true, mensaje: 'ID no válido.' });
        }

        const usuario = await db.collection('usuarios').findOne({ _id });
        if (!usuario) return res.status(404).json({ error: true, mensaje: 'Usuario no encontrado.' });

        const $set = { updatedAt: new Date() };
        if (nombre) $set.nombre = nombre.trim();
        if (rol) $set.rol = rol;
        if (estado) $set.estado = estado;

        await db.collection('usuarios').updateOne({ _id }, { $set });

        const actualizado = await db.collection('usuarios').findOne({ _id }, { projection: { passwordHash: 0 } });
        res.json({ data: { ...actualizado, id: String(actualizado._id) }, mensaje: 'Usuario actualizado correctamente.' });
    } catch (err) { next(err); }
}

// DELETE /api/usuarios/:id
async function eliminar(req, res, next) {
    try {
        const { id } = req.params;
        const db = getDB();

        let _id;
        try { _id = new ObjectId(id); } catch {
            return res.status(400).json({ error: true, mensaje: 'ID no válido.' });
        }

        const resultado = await db.collection('usuarios').deleteOne({ _id });
        if (resultado.deletedCount === 0) {
            return res.status(404).json({ error: true, mensaje: 'Usuario no encontrado.' });
        }

        res.json({ mensaje: 'Usuario eliminado correctamente.' });
    } catch (err) { next(err); }
}

module.exports = { listar, crear, actualizar, eliminar };
