const multer = require('multer');
const path = require('path');

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    // uploads/ vive dentro de src/ (junto a middlewares/, controllers/, etc.),
    // así que desde src/middlewares basta con subir UN nivel. Antes decía
    // '../../uploads/books' (dos niveles), lo que guardaba los PDFs subidos
    // desde el panel admin fuera de src/, en una carpeta que ni
    // resolverRutaPdf ni cargarLibros.js miraban -- por eso el detalle
    // del libro decía "Archivo no disponible" para lo que se subiera así.
    const destino = path.join(__dirname, '../uploads/books');
    console.log('Guardando PDF en:', destino);
    cb(null, destino);
  },
  filename: (req, file, cb) => {
    const nombreLimpio = file.originalname.replace(/\s+/g, '-');
    cb(null, `${Date.now()}-${nombreLimpio}`);
  }
});

const upload = multer({ storage });

module.exports = upload;