const mongoose = require('mongoose');

const participanteSchema = new mongoose.Schema({
  nombre: { type: String, required: true },
  correo: { type: String, required: true, index: true },
  eventoId: { type: mongoose.Schema.Types.ObjectId, ref: 'Evento', required: true, index: true },
  confirmado: { type: Boolean, default: false }
}, { timestamps: true });

// Índice compuesto para evitar inscripciones duplicadas del mismo correo en un evento
participanteSchema.index({ eventoId: 1, correo: 1 }, { unique: true });

module.exports = mongoose.model('Participante', participanteSchema);