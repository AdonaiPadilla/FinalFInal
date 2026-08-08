// # manejo centralizado de errores
//
// Cualquier error que llegue aquí (por next(error) o porque un controller
// no lo atrapó) se procesa en un solo lugar, con un formato de respuesta
// consistente y SIN exponer detalles internos (stack traces, mensajes de
// Mongo, etc.) al cliente.
function errorHandler(error, req, res, next) {
  console.error('Error no manejado:', error);

  // Errores de validación de Mongoose
  if (error.name === 'ValidationError') {
    const errores = Object.values(error.errors).map((e) => e.message);
    return res.status(400).json({ message: errores[0] || 'Datos inválidos', errores });
  }

  // Email duplicado (índice único)
  if (error.code === 11000) {
    return res.status(409).json({ message: 'Ese registro ya existe' });
  }

  // ObjectId con formato inválido
  if (error.name === 'CastError') {
    return res.status(400).json({ message: 'Identificador inválido' });
  }

  const status = error.status || error.statusCode || 500;
  const mensaje = status === 500 ? 'Error interno del servidor' : error.message;

  res.status(status).json({ message: mensaje });
}

module.exports = errorHandler;
