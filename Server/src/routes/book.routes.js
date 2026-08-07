const express = require('express');
const router = express.Router();
const { listarLibros, obtenerLibro, crearLibro, actualizarLibro, eliminarLibro } = require('../controllers/book.controller');
const protegerRuta = require('../middlewares/auth.middleware');
const permitirRoles = require('../middlewares/role.middleware');
const upload = require('../middlewares/upload.middleware');

// Públicas
router.get('/libros', listarLibros);
router.get('/libros/:id', obtenerLibro);

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