const Purchase = require('../models/Purchase');
const Book = require('../models/Book');
const { esObjectIdValido } = require('../utils/validators.util');

const crearCompra = async (req, res) => {
  try {
    const { libroId } = req.body;
    if (!libroId) {
      return res.status(400).json({ message: 'libroId es obligatorio' });
    }
    // Antes de usar libroId en cualquier query de Mongo, se valida que
    // tenga el formato exacto de un ObjectId (24 caracteres hexadecimales).
    // Sin esto, alguien podría mandar algo que no sea un id real (incluso
    // ya neutralizado por sanitizarMongo si fuera un operador tipo
    // { "$ne": null }) y de todos modos vale la pena rechazarlo aquí con
    // un mensaje claro en vez de dejar que Mongoose truene con un CastError.
    if (!esObjectIdValido(libroId)) {
      return res.status(400).json({ message: 'libroId no es válido' });
    }

    const libro = await Book.findById(libroId);
    if (!libro || !libro.activo) {
      return res.status(404).json({ message: 'Libro no encontrado' });
    }

    const yaComprado = await Purchase.findOne({ usuario: req.usuario.id, libro: libroId });
    if (yaComprado) {
      return res.status(409).json({ message: 'Ya tienes este libro comprado' });
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

// GET /api/purchases/mias
// Compras del usuario autenticado (a diferencia de todasLasCompras, que
// es solo para admin/gerente y trae las de todos).
const misCompras = async (req, res) => {
  try {
    const compras = await Purchase.find({ usuario: req.usuario.id })
      .populate('libro', 'titulo autor portada categoria')
      .sort({ createdAt: -1 });
    res.json(compras);
  } catch (error) {
    res.status(500).json({ message: 'Error al obtener tus compras', error: error.message });
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

module.exports = { crearCompra, misCompras, todasLasCompras };
