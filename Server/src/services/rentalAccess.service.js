const Rental = require('../models/Rental');
const Purchase = require('../models/Purchase');

/**
 * Devuelve el estado del usuario respecto a un libro: si lo compró, y si
 * tiene una renta vigente (con su fecha de fin). Se usa tanto para decidir
 * accesos como para mostrarle al cliente "ya tienes este libro" en la
 * pantalla de detalle.
 */
const obtenerEstadoUsuario = async (usuarioId, libroId) => {
  const [compra, rentaVigente] = await Promise.all([
    Purchase.findOne({ usuario: usuarioId, libro: libroId }).lean(),
    Rental.findOne({
      usuario: usuarioId,
      libro: libroId,
      activa: true,
      fechaFin: { $gte: new Date() },
    }).lean(),
  ]);

  return {
    comprado: !!compra,
    rentado: !!rentaVigente,
    rentaFechaFin: rentaVigente ? rentaVigente.fechaFin : null,
  };
};

/**
 * Acceso de LECTURA: para leer el libro (endpoint /leer, en línea) basta
 * con haberlo comprado, tener una renta vigente, o ser admin/gerente.
 */
const tieneAccesoLectura = async (usuarioId, rol, libroId) => {
  if (rol === 'admin' || rol === 'gerente') return true;

  const { comprado, rentado } = await obtenerEstadoUsuario(usuarioId, libroId);
  return comprado || rentado;
};

/**
 * Acceso de DESCARGA: descargar el archivo completo (para quedárselo)
 * requiere haberlo COMPRADO. Rentar el libro da derecho a leerlo mientras
 * la renta esté vigente, pero no a descargarlo — eso es exclusivo de la
 * compra (o de admin/gerente, para fines administrativos).
 */
const tieneAccesoDescarga = async (usuarioId, rol, libroId) => {
  if (rol === 'admin' || rol === 'gerente') return true;

  const { comprado } = await obtenerEstadoUsuario(usuarioId, libroId);
  return comprado;
};

module.exports = { obtenerEstadoUsuario, tieneAccesoLectura, tieneAccesoDescarga };
