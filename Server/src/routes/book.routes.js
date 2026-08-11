const express = require('express');
const router = express.Router();
const { listarLibros, obtenerLibro, crearLibro, actualizarLibro, eliminarLibro, descargarPdf, leerPdf, previewPdf } = require('../controllers/book.controller');
const { protegerRuta, autenticacionOpcional } = require('../middlewares/auth.middleware');
const permitirRoles = require('../middlewares/role.middleware');
const upload = require('../middlewares/upload.middleware');

// Públicas, pero si viene token válido se incluye el estado del usuario
// respecto al libro (comprado / rentado) — ver book.controller.js -> obtenerLibro.
router.get('/libros', listarLibros);
router.get('/libros/:id', autenticacionOpcional, obtenerLibro);

// Vista previa pública de las primeras páginas del PDF (sin autenticación)
router.get('/libros/:id/preview', previewPdf);

// Leer en línea: requiere sesión + haber comprado o rentado el libro (o
// ser admin/gerente). Ver rentalAccess.service.js -> tieneAccesoLectura.
router.get('/libros/:id/leer', protegerRuta, leerPdf);

// Descargar el archivo completo: requiere sesión + haberlo COMPRADO
// (rentar NO da derecho a descarga, solo a leer). Admin/gerente sí puede,
// para fines administrativos. Ver rentalAccess.service.js -> tieneAccesoDescarga.
router.get('/libros/:id/download', protegerRuta, descargarPdf);

// Solo admin/gerente
router.post('/', protegerRuta, permitirRoles('admin', 'gerente'), crearLibro);
router.put('/:id', protegerRuta, permitirRoles('admin', 'gerente'), actualizarLibro);
router.delete('/:id', protegerRuta, permitirRoles('admin', 'gerente'), eliminarLibro);
router.post(
  '/upload-pdf',
  protegerRuta,
  permitirRoles('admin', 'gerente'),
  upload.single('pdf'),
  (req, res) => {
    if (!req.file) return res.status(400).json({ message: 'No se recibió archivo' });
    const rutaRelativa = `/uploads/books/${req.file.filename}`;
    res.json({ archivoPdf: rutaRelativa });
  }
);

module.exports = router;