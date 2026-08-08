/**
 * Sanitiza req.body eliminando claves que empiecen con "$" o contengan "."
 * Ese es el vector clásico de inyección en MongoDB: mandar en el JSON algo
 * como { "email": { "$ne": null }, "password": { "$ne": null } } para
 * saltarse la query de login (findOne({ email, password }) mal hecho).
 *
 * Con nuestros controllers ya validamos que email/password sean strings,
 * pero este middleware es una segunda capa de defensa que protege
 * cualquier endpoint que reciba JSON, no solo auth.
 */
function esObjetoPlano(valor) {
  return valor !== null && typeof valor === 'object' && !Array.isArray(valor);
}

function limpiarObjeto(objeto) {
  if (Array.isArray(objeto)) {
    return objeto.map((item) => (esObjetoPlano(item) || Array.isArray(item) ? limpiarObjeto(item) : item));
  }

  if (!esObjetoPlano(objeto)) return objeto;

  const limpio = {};
  for (const llave of Object.keys(objeto)) {
    if (llave.startsWith('$') || llave.includes('.')) {
      // Se descarta la llave sospechosa por completo.
      continue;
    }
    const valor = objeto[llave];
    limpio[llave] = esObjetoPlano(valor) || Array.isArray(valor) ? limpiarObjeto(valor) : valor;
  }
  return limpio;
}

function sanitizarMongo(req, res, next) {
  if (req.body && esObjetoPlano(req.body)) {
    req.body = limpiarObjeto(req.body);
  }
  next();
}

module.exports = sanitizarMongo;
