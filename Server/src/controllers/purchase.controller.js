const Purchase = require('../models/Purchase');
const Book = require('../models/Book');

const crearCompra = async (req, res) => {
  try {
    const { libroId } = req.body;
    if (!libroId) {
      return res.status(400).json({ message: 'libroId es obligatorio' });
    }

    const libro = await Book.findById(libroId);
    if (!libro || !libro.activo) {
      return res.status(404).json({ message: 'Libro no encontrado' });
    }

    const compra = await Purchase.create({
      usuario: req.usuario.id,
      libro: libroId,
      precioPagado: libro.precioCompra
    });

    res.status(201).json({ message: 'Compra realizada correctamente', compra });
  } catch (error) {
    res.status(500).json({ message: 'Error al comprar el libro', error: error.message });
  }
};

const todasLasCompras = async (req, res) => {
  try {
    const compras = await Purchase.find()
      .populate('usuario', 'nombre email')
      .populate('libro', 'titulo autor')
      .sort({ createdAt: -1 });
    res.json(compras);
  } catch (error) {
    res.status(500).json({ message: 'Error al obtener compras', error: error.message });
  }
};

module.exports = { crearCompra, todasLasCompras };
