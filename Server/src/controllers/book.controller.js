const path = require('path');
const fs = require('fs');
const Book = require('../models/Book');
const Rental = require('../models/Rental');
const { obtenerEstadoUsuario, tieneAccesoLectura, tieneAccesoDescarga } = require('../services/rentalAccess.service');

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

// GET /api/books/libros/:id
// Ruta pública (autenticacionOpcional): si viene un token válido, además
// del libro se incluye el estado del usuario actual respecto a él
// (¿ya lo compró? ¿lo tiene rentado y hasta cuándo?), para que el cliente
// pueda mostrar "Ya tienes este libro" en vez de los botones de
// rentar/comprar.
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

    let estadoUsuario = { comprado: false, rentado: false, rentaFechaFin: null };
    if (req.usuario) {
      estadoUsuario = await obtenerEstadoUsuario(req.usuario.id, libro._id);
    }

    res.json({ ...libro, disponible: !rentaActiva, ...estadoUsuario });
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

// Resuelve la ruta absoluta real de un archivoPdf guardado en Mongo,
// verificando que no se salga de la carpeta uploads (anti path-traversal).
// Nunca recibe nada que venga del cliente: solo el valor ya guardado en BD.
const resolverRutaPdf = (archivoPdf) => {
  const carpetaUploads = path.join(__dirname, '../../uploads');
  const rutaRelativa = archivoPdf.replace(/^\/?uploads\//, '');
  const rutaAbsoluta = path.normalize(path.join(carpetaUploads, rutaRelativa));

  if (!rutaAbsoluta.startsWith(carpetaUploads)) return null;
  return rutaAbsoluta;
};

// GET /api/books/libros/:id/leer
// Sirve el PDF EN LÍNEA (inline, para leer dentro de la app) a quien lo
// compró, tiene una renta vigente, o es admin/gerente.
const leerPdf = async (req, res) => {
  try {
    const libro = await Book.findById(req.params.id);
    if (!libro || !libro.activo) {
      return res.status(404).json({ message: 'Libro no encontrado' });
    }

    const acceso = await tieneAccesoLectura(req.usuario.id, req.usuario.rol, libro._id);
    if (!acceso) {
      return res.status(403).json({ message: 'No tienes acceso a este libro. Réntalo o cómpralo primero.' });
    }

    const rutaAbsoluta = resolverRutaPdf(libro.archivoPdf);
    if (!rutaAbsoluta || !fs.existsSync(rutaAbsoluta)) {
      return res.status(404).json({ message: 'Archivo no disponible' });
    }

    res.setHeader('Content-Disposition', `inline; filename="${libro.titulo}.pdf"`);
    res.sendFile(rutaAbsoluta);
  } catch (error) {
    res.status(500).json({ message: 'Error al abrir el libro', error: error.message });
  }
};

// GET /api/books/libros/:id/download
// Descarga el PDF completo. A diferencia de /leer, esto SOLO se permite
// si el usuario COMPRÓ el libro (o es admin/gerente) — una renta vigente
// da derecho a leerlo, no a quedárselo. Antes esto se servía con
// express.static('uploads') público y sin ningún control.
const descargarPdf = async (req, res) => {
  try {
    const libro = await Book.findById(req.params.id);
    if (!libro || !libro.activo) {
      return res.status(404).json({ message: 'Libro no encontrado' });
    }

    const acceso = await tieneAccesoDescarga(req.usuario.id, req.usuario.rol, libro._id);
    if (!acceso) {
      return res.status(403).json({
        message: 'Para descargar este libro primero debes comprarlo. Con la renta puedes leerlo, pero no descargarlo.',
      });
    }

    const rutaAbsoluta = resolverRutaPdf(libro.archivoPdf);
    if (!rutaAbsoluta || !fs.existsSync(rutaAbsoluta)) {
      return res.status(404).json({ message: 'Archivo no disponible' });
    }

    res.download(rutaAbsoluta, `${libro.titulo}.pdf`);
  } catch (error) {
    res.status(500).json({ message: 'Error al descargar el libro', error: error.message });
  }
};

module.exports = { listarLibros, obtenerLibro, crearLibro, actualizarLibro, eliminarLibro, descargarPdf, leerPdf };
