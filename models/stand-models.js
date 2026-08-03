const mongoose = require('mongoose');

const standSchema = new mongoose.Schema({
  numeroStand: { type: String, required: true },
  empresa: { type: String },
  eventoId: { type: mongoose.Schema.Types.ObjectId, ref: 'Evento', required: true, index: true },
  estado: { type: String, enum: ['disponible', 'ocupado', 'reservado'], default: 'disponible', index: true }
}, { timestamps: true });

// Índice compuesto para que los números de stand no se repitan dentro del mismo evento
standSchema.index({ eventoId: 1, numeroStand: 1 }, { unique: true });

module.exports = mongoose.model('Stand', standSchema);