const multer = require('multer');
const path = require('path');

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const destino = path.join(__dirname, '../../uploads/books');
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