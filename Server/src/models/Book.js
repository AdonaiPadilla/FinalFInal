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
    min: [0, 'El precio de compra no puede ser negativo'],
  },
  precioRenta: {
    type: Number,
    default: 15,
    min: [0, 'El precio de renta no puede ser negativo'],
  },
  totalPaginas: {
    type: Number,
    default: 100,
    min: [1, 'El libro debe tener al menos 1 página'],
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
    min: [1, 'La duración de la renta debe ser de al menos 1 día'],
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