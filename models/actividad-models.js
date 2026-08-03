const mongoose = require('mongoose');

const actividadSchema = new mongoose.Schema({
  titulo: { type: String, required: true, index: true },
  descripcion: { type: String },
  horario: { type: Date, required: true },
  eventoId: { type: mongoose.Schema.Types.ObjectId, ref: 'Evento', required: true, index: true },
  oradorId: { type: mongoose.Schema.Types.ObjectId, ref: 'Orador' }
}, { timestamps: true });

module.exports = mongoose.model('Actividad', actividadSchema);