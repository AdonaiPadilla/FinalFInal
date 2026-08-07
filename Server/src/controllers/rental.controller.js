const Rental = require('../models/Rental');
const Book = require('../models/Book');

const crearRenta = async (req, res) => {
  try {
    const { libroId } = req.body;
    if (!libroId) {
      return res.status(400).json({ message: 'libroId es obligatorio' });
    }

    const libro = await Book.findById(libroId);
    if (!libro || !libro.activo) {
      return res.status(404).json({ message: 'Libro no encontrado' });
    }

    const rentaActiva = await Rental.findOne({
      libro: libroId,
      activa: true,
      fechaFin: { $gte: new Date() }
    });

    if (rentaActiva) {
      return res.status(409).json({ message: 'Este libro ya está rentado actualmente' });
    }

    const fechaFin = new Date();
    fechaFin.setDate(fechaFin.getDate() + (libro.duracionRentaDias || 7));

    const renta = await Rental.create({
      usuario: req.usuario.id,
      libro: libroId,
      fechaFin
    });

    res.status(201).json({ message: 'Libro rentado correctamente', renta });
  } catch (error) {
    res.status(500).json({ message: 'Error al rentar el libro', error: error.message });
  }
};

const misRentas = async (req, res) => {
  try {
    const rentas = await Rental.find({ usuario: req.usuario.id })
      .populate('libro', 'titulo autor portada')
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

module.exports = { crearRenta, misRentas, todasLasRentas };
