// ==========================================================================
// SERVICE: USUARIOS — backend/services/usuarios.service.js
// ==========================================================================

const bcrypt = require('bcryptjs');
const { ObjectId } = require('mongodb');
const { getDB } = require('../config/db');
const { COLECCION } = require('../models/usuario.model');

const BCRYPT_ROUNDS = parseInt(process.env.BCRYPT_ROUNDS, 10) || 10;

async function listarUsuarios() {
    const db = getDB();
    const usuarios = await db.collection(COLECCION)
        .find({}, { projection: { passwordHash: 0 } })
        .sort({ fechaCreacion: -1 })
        .toArray();
    return usuarios.map(u => ({ ...u, id: String(u._id) }));
}

async function crearUsuario(datos, req) {
    const db = getDB();
    const { nombre, email, password, rol } = datos;

    const existente = await db.collection(COLECCION).findOne({ email: email.toLowerCase().trim() });
    if (existente) return { error: 'Ya existe una cuenta con ese correo.', status: 409 };

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

    const resultado = await db.collection(COLECCION).insertOne(documento);
    documento._id = resultado.insertedId;
    delete documento.passwordHash;
    return { data: { ...documento, id: String(documento._id) } };
}

async function actualizarUsuario(id, datos) {
    const db = getDB();
    let _id;
    try { _id = new ObjectId(id); } catch { return { error: 'ID no válido.', status: 400 }; }

    const usuario = await db.collection(COLECCION).findOne({ _id });
    if (!usuario) return null;

    const $set = { updatedAt: new Date() };
    if (datos.nombre) $set.nombre = datos.nombre.trim();
    if (datos.rol) $set.rol = datos.rol;
    if (datos.estado) $set.estado = datos.estado;

    await db.collection(COLECCION).updateOne({ _id }, { $set });
    const actualizado = await db.collection(COLECCION).findOne({ _id }, { projection: { passwordHash: 0 } });
    return { data: { ...actualizado, id: String(actualizado._id) } };
}

async function eliminarUsuario(id) {
    const db = getDB();
    let _id;
    try { _id = new ObjectId(id); } catch { return { error: 'ID no válido.', status: 400 }; }

    const resultado = await db.collection(COLECCION).deleteOne({ _id });
    if (resultado.deletedCount === 0) return null;
    return { ok: true };
}

module.exports = { listarUsuarios, crearUsuario, actualizarUsuario, eliminarUsuario };
