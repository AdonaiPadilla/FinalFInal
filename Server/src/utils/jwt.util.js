const jwt = require('jsonwebtoken');

const generateToken = (payload) => {
  return jwt.sign(payload, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN
  });
};

const verifyToken = (token) => {
  return jwt.verify(token, process.env.JWT_SECRET);
};

module.exports = { generateToken, verifyToken };

/*
Un JWT (JSON Web Token) es como un "gafete" digital que le das al usuario después de hacer login. Ese gafete contiene información (en este caso, su id y su rol) firmada digitalmente, para que en cada petición futura no tenga que volver a mandar su contraseña — solo manda el token.

javascript
jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRES_IN });
payload: la información que va "dentro" del token (id y rol del usuario).
JWT_SECRET: una clave secreta que solo tu servidor conoce, usada para firmar el token — si alguien intenta modificar el token, la firma ya no coincide y tu servidor lo rechaza.
expiresIn: después de cuánto tiempo el token deja de ser válido (en tu .env pusimos 7d, 7 días).
javascript
jwt.verify(token, process.env.JWT_SECRET);
Esto se usa (más adelante en el middleware) para comprobar que un token que llega en una petición es válido y no ha sido alterado ni vencido.
*/