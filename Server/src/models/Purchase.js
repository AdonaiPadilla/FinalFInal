const mongoose = require('mongoose');

const purchaseSchema = new mongoose.Schema({
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
  precioPagado: {
    type: Number,
    required: true
  }
}, { timestamps: true });

module.exports = mongoose.model('Purchase', purchaseSchema);