const { verifyToken } = require('../utils/jwt.util');

const protegerRuta = (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'No autorizado, falta el token' });
  }

  const token = authHeader.split(' ')[1]; // separa "Bearer" del token real

  try {
    const decoded = verifyToken(token);
    req.usuario = decoded; // guarda { id, rol } disponible en el resto de la petición
    next(); // deja continuar hacia el controller
  } catch (error) {
    return res.status(401).json({ message: 'Token inválido o expirado' });
  }
};

module.exports = protegerRuta;

/*
Explicación
req.headers.authorization: en Postman/React Native, el token se manda en un header llamado Authorization, con el formato Bearer <token> (es el estándar). Aquí lo leemos.
Si no viene el header, o no empieza con "Bearer ", respondemos 401 de una vez — no hay nada que verificar.
token.split(' ')[1]: el header llega como "Bearer eyJhbGci..." — al partirlo por espacio, [0] sería "Bearer" y [1] es el token real que necesitamos.
verifyToken(token): usa la función que ya hicimos en jwt.util.js — si el token es válido y no ha expirado, regresa el payload ({ id, rol }); si fue alterado o venció, lanza un error (por eso está en try/catch).
req.usuario = decoded: esto es clave — le "pega" la info del usuario a la petición (req), para que cualquier controller que venga después (gracias a next()) sepa quién está haciendo la petición sin tener que volver a consultar la base de datos.
next(): le dice a Express "ya terminé mi trabajo, deja que la petición siga su camino" (hacia el siguiente middleware o al controller final).
*/