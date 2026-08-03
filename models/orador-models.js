const mongoose = require('mongoose');

const oradorSchema = new mongoose.Schema({
  nombre: { type: String, required: true },
  correo: { type: String, required: true, unique: true, index: true },
  especialidad: { type: String },
  biografia: { type: String }
}, { timestamps: true });

module.exports = mongoose.model('Orador', oradorSchema);