const mongoose = require('mongoose');

const usuarioSchema = new mongoose.Schema({
  nombre: { type: String, required: true },
  correo: { type: String, required: true, unique: true, index: true },
  password: { type: String, required: true },
  cedula: { type: String, unique: true, sparse: true },
  rol: { type: String, enum: ['admin', 'usuario'], default: 'usuario', index: true }
}, { timestamps: true });

module.exports = mongoose.model('Usuario', usuarioSchema);