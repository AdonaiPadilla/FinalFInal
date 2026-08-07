const express = require('express');
const cors = require('cors');

const app = express();

// Middlewares globales
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Ruta de prueba, para confirmar que el servidor responde
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'API funcionando correctamente' });
});

// Aquí más adelante montamos las rutas reales:
app.use('/api/auth', require('./routes/auth.routes'));
// app.use('/api/users', require('./routes/user.routes'));
app.use('/api/books', require('./routes/book.routes'));
app.use('/api/purchases', require('./routes/purchase.routes'));
app.use('/api/rentals', require('./routes/rental.routes'));
// app.use('/api/admin', require('./routes/admin.routes'));
app.use('/uploads', express.static('uploads'));

// Middleware de manejo de errores (lo armamos más adelante)
// app.use(require('./middlewares/error.middleware'));

module.exports = app;