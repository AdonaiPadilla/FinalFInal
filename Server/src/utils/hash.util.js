const bcrypt = require('bcryptjs');

const hashPassword = async (password) => {
  const salt = await bcrypt.genSalt(10);
  return bcrypt.hash(password, salt);
};

const comparePassword = async (password, hashedPassword) => {
  return bcrypt.compare(password, hashedPassword);
};

module.exports = { hashPassword, comparePassword };

/* Nunca se guarda una contraseña en texto plano en la base de datos, porque si alguien accede a tu BD 
(o te la roban), vería las contraseñas de todos directo. Por eso se hashea: se transforma en un texto irreconocible e irreversible.

genSalt(10): genera un "salt" (un valor aleatorio) que se mezcla con la contraseña antes de hashear. El 10 es el "costo" — 
entre más alto, más segura pero más lenta la operación. 10 es el estándar razonable.
bcrypt.hash(password, salt): toma la contraseña + el salt y produce el hash final que sí se guarda en Mongo. 

Como el hash no se puede "deshacer", para saber si la contraseña que alguien escribió en el login es correcta, no 
la desencriptas — hasheas lo que escribió y comparas si da el mismo resultado que el hash guardado. 
Eso hace compare.*/

