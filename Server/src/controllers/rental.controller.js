const Rental = require('../models/Rental');
const Book = require('../models/Book');
const { esObjectIdValido } = require('../utils/validators.util');

const crearRenta = async (req, res) => {
  try {
    const { libroId } = req.body;
    if (!libroId) {
      return res.status(400).json({ message: 'libroId es obligatorio' });
    }
    if (!esObjectIdValido(libroId)) {
      return res.status(400).json({ message: 'libroId no es válido' });
    }

    const libro = await Book.findById(libroId);
    if (!libro || !libro.activo) {
      return res.status(404).json({ message: 'Libro no encontrado' });
    }

    const fechaFin = new Date();
    fechaFin.setDate(fechaFin.getDate() + (libro.duracionRentaDias || 7));

    const renta = await Rental.create({
      usuario: req.usuario.id,
      libro: libroId,
      fechaFin,
      precioRenta: libro.precioRenta || 0
    });

    res.status(201).json({ message: 'Libro rentado correctamente', renta });
  } catch (error) {
    res.status(500).json({ message: 'Error al rentar el libro', error: error.message });
  }
};

const misRentas = async (req, res) => {
  try {
    const rentas = await Rental.find({ usuario: req.usuario.id })
      .populate('libro', 'titulo autor portada categoria')
      .sort({ createdAt: -1 });
    res.json(rentas);
  } catch (error) {
    res.status(500).json({ message: 'Error al obtener rentas', error: error.message });
  }
};

const todasLasRentas = async (req, res) => {
  try {
    const rentas = await Rental.find()
      .populate('usuario', 'nombre email')
      .populate('libro', 'titulo autor')
      .sort({ createdAt: -1 });
    res.json(rentas);
  } catch (error) {
    res.status(500).json({ message: 'Error al obtener rentas', error: error.message });
  }
};

// DELETE /api/rentals/:id
// Solo admin/gerente puede borrar un registro de renta.
const eliminarRenta = async (req, res) => {
  try {
    const rentaId = req.params.id;
    if (!esObjectIdValido(rentaId)) return res.status(400).json({ message: 'ID de renta inválido' });

    const renta = await Rental.findById(rentaId);
    if (!renta) return res.status(404).json({ message: 'Renta no encontrada' });

    await Rental.findByIdAndDelete(rentaId);
    res.json({ message: 'Renta eliminada correctamente' });
  } catch (error) {
    res.status(500).json({ message: 'Error al eliminar la renta', error: error.message });
  }
};

module.exports = { crearRenta, misRentas, todasLasRentas, eliminarRenta };
