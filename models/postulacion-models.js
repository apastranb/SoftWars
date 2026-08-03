const mongoose = require('mongoose');

const postulacionSchema = new mongoose.Schema({
  usuarioId: { type: mongoose.Schema.Types.ObjectId, ref: 'Usuario', required: true, index: true },
  eventoId: { type: mongoose.Schema.Types.ObjectId, ref: 'Evento', required: true, index: true },
  propuesta: { type: String, required: true },
  estado: { type: String, enum: ['pendiente', 'aprobada', 'rechazada'], default: 'pendiente', index: true }
}, { timestamps: true });

module.exports = mongoose.model('Postulacion', postulacionSchema);