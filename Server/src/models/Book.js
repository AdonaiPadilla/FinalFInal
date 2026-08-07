const mongoose = require('mongoose');

const bookSchema = new mongoose.Schema({
  titulo: {
    type: String,
    required: true,
  },
  autor: {
    type: String,
    default: 'Autor desconocido',
  },
  precioCompra: {
    type: Number,
    default: 50,
  },
  precioRenta: {
    type: Number,
    default: 15,
  },
  totalPaginas: {
    type: Number,
    default: 100,
  },
  portada: {
    type: String,
  },
  categoria: {
    type: String,
    required: true,
  },
  descripcion: {
    type: String,
  },
  duracionRentaDias: {
    type: Number,
    default: 14,
  },
  activo: {
    type: Boolean,
    default: true,
  },
  archivoPdf: {
    type: String,
    required: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model('Book', bookSchema);