/**
 * Rate limiter simple en memoria, pensado para frenar fuerza bruta en
 * /auth/login y /auth/register.
 *
 * NOTA: esto vive en memoria del proceso. Sirve perfecto para un servidor
 * único (como el tuyo en Render con una sola instancia). Si algún día
 * escalas a varias instancias, esto ya no compartiría el conteo entre ellas
 * y ahí sí conviene migrar a `express-rate-limit` + Redis.
 */

const intentosPorLlave = new Map();

// Limpieza periódica para no acumular memoria indefinidamente.
setInterval(() => {
  const ahora = Date.now();
  for (const [llave, datos] of intentosPorLlave.entries()) {
    if (ahora > datos.resetEn) intentosPorLlave.delete(llave);
  }
}, 10 * 60 * 1000).unref();

function limitarIntentos({ maxIntentos, ventanaMs, mensaje }) {
  return (req, res, next) => {
    const ip = req.ip || req.connection?.remoteAddress || 'desconocida';
    const llave = `${req.baseUrl}${req.path}:${ip}`;
    const ahora = Date.now();

    let datos = intentosPorLlave.get(llave);
    if (!datos || ahora > datos.resetEn) {
      datos = { intentos: 0, resetEn: ahora + ventanaMs };
    }

    datos.intentos += 1;
    intentosPorLlave.set(llave, datos);

    if (datos.intentos > maxIntentos) {
      const segundosRestantes = Math.ceil((datos.resetEn - ahora) / 1000);
      res.set('Retry-After', String(segundosRestantes));
      return res.status(429).json({
        message: mensaje || 'Demasiados intentos. Intenta de nuevo más tarde.',
      });
    }

    next();
  };
}

module.exports = limitarIntentos;
