const express = require('express');
const cors = require('cors');
const sanitizarMongo = require('./middlewares/sanitize.middleware');
const errorHandler = require('./middlewares/error.middleware');

const app = express();

// Middlewares globales
app.use(cors());
app.use(express.json({ limit: '50kb' }));
app.use(express.urlencoded({ extended: true, limit: '50kb' }));
app.use(sanitizarMongo); // limpia operadores de inyección NoSQL ($, .) del body

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

// Middleware de manejo de errores (siempre al final, después de las rutas)
app.use(errorHandler);

module.exports = app;
