const mongoose = require('mongoose');

const rentalSchema = new mongoose.Schema({
  usuario: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  libro: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Book',
    required: true
  },
  fechaInicio: {
    type: Date,
    default: Date.now
  },
  fechaFin: {
    type: Date,
    required: true
  },
  activa: {
    type: Boolean,
    default: true
  }
}, { timestamps: true });

module.exports = mongoose.model('Rental', rentalSchema);