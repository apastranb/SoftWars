const mongoose = require('mongoose');

const eventoSchema = new mongoose.Schema({
  nombre: { type: String, required: true, index: true },
  descripcion: { type: String },
  fechaInicio: { type: Date, required: true, index: true },
  fechaFin: { type: Date },
  lugar: { type: String },
  estado: { type: String, default: 'activo', index: true }
}, { timestamps: true });

module.exports = mongoose.model('Evento', eventoSchema);