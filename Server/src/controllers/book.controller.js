const Book = require('../models/Book');
const Rental = require('../models/Rental');

const listarLibros = async (req, res) => {
  try {
    const libros = await Book.find({ activo: true }).select('-archivoPdf').lean();

    const rentasActivas = await Rental.find({
      activa: true,
      fechaFin: { $gte: new Date() }
    }).select('libro');

    const idsOcupados = new Set(rentasActivas.map((r) => r.libro.toString()));

    const librosConEstado = libros.map((libro) => ({
      ...libro,
      disponible: !idsOcupados.has(libro._id.toString())
    }));

    res.json(librosConEstado);
  } catch (error) {
    res.status(500).json({ message: 'Error al obtener libros', error: error.message });
  }
};

const obtenerLibro = async (req, res) => {
  try {
    const libro = await Book.findById(req.params.id).select('-archivoPdf').lean();
    if (!libro || !libro.activo) {
      return res.status(404).json({ message: 'Libro no encontrado' });
    }

    const rentaActiva = await Rental.findOne({
      libro: req.params.id,
      activa: true,
      fechaFin: { $gte: new Date() }
    });

    res.json({ ...libro, disponible: !rentaActiva });
  } catch (error) {
    res.status(500).json({ message: 'Error al obtener el libro', error: error.message });
  }
};

const crearLibro = async (req, res) => {
  try {
    const libro = await Book.create(req.body);
    res.status(201).json(libro);
  } catch (error) {
    res.status(500).json({ message: 'Error al crear el libro', error: error.message });
  }
};

const actualizarLibro = async (req, res) => {
  try {
    const libro = await Book.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    if (!libro) {
      return res.status(404).json({ message: 'Libro no encontrado' });
    }
    res.json(libro);
  } catch (error) {
    res.status(500).json({ message: 'Error al actualizar el libro', error: error.message });
  }
};

const eliminarLibro = async (req, res) => {
  try {
    const libro = await Book.findByIdAndUpdate(req.params.id, { activo: false }, { new: true });
    if (!libro) {
      return res.status(404).json({ message: 'Libro no encontrado' });
    }
    res.json({ message: 'Libro eliminado (soft delete)', libro });
  } catch (error) {
    res.status(500).json({ message: 'Error al eliminar el libro', error: error.message });
  }
};

module.exports = { listarLibros, obtenerLibro, crearLibro, actualizarLibro, eliminarLibro };
