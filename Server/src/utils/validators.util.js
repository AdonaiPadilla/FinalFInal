/**
 * Validaciones del lado del servidor.
 *
 * Estas reglas DEBEN existir aquí aunque ya existan en el cliente (React
 * Native), porque cualquiera puede saltarse la app y pegarle directo a la
 * API con Postman/curl. El cliente es UX, el servidor es la verdad.
 */

const PATRON_INYECCION =
  /(--|;|\/\*|\*\/|\bunion\b|\bselect\b|\binsert\b|\bdelete\b|\bdrop\b|\bupdate\b|\bexec\b|\bor\s+1=1\b|\$where|\$ne|\$gt|\$lt|\$regex|\$or|\$and|<script|<\/script|javascript:)/i;

const REGEX_EMAIL =
  /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)+$/;

const REGEX_NOMBRE = /^[a-zA-ZÀ-ÖØ-öø-ÿñÑ]+(?:\s[a-zA-ZÀ-ÖØ-öø-ÿñÑ]+)*$/;

function esTexto(valor) {
  return typeof valor === 'string';
}

function limpiarTexto(valor) {
  if (!esTexto(valor)) return '';
  // eslint-disable-next-line no-control-regex
  return valor.replace(/[\u0000-\u001F\u007F]/g, '').trim();
}

function contienePatronSospechoso(valor) {
  if (!esTexto(valor)) return true;
  return PATRON_INYECCION.test(valor);
}

function validarEmail(valor) {
  const errores = [];
  if (!esTexto(valor)) {
    return { valido: false, errores: ['El correo debe ser texto.'] };
  }
  const email = limpiarTexto(valor);

  if (!email) errores.push('El correo es obligatorio.');
  if (email.length > 254) errores.push('El correo es demasiado largo.');
  if (email && !REGEX_EMAIL.test(email)) errores.push('El formato del correo no es válido.');
  if (contienePatronSospechoso(email)) errores.push('El correo contiene caracteres no permitidos.');

  return { valido: errores.length === 0, errores, valor: email.toLowerCase() };
}

function validarPassword(valor) {
  const errores = [];
  if (!esTexto(valor)) {
    return { valido: false, errores: ['La contraseña debe ser texto.'] };
  }

  if (!valor) errores.push('La contraseña es obligatoria.');
  if (valor.length < 8) errores.push('Debe tener al menos 8 caracteres.');
  if (valor.length > 72) errores.push('No puede exceder 72 caracteres.');
  if (!/[a-z]/.test(valor)) errores.push('Debe incluir al menos una minúscula.');
  if (!/[A-Z]/.test(valor)) errores.push('Debe incluir al menos una mayúscula.');
  if (!/[0-9]/.test(valor)) errores.push('Debe incluir al menos un número.');
  if (!/[^a-zA-Z0-9]/.test(valor)) errores.push('Debe incluir al menos un símbolo.');
  if (/\s/.test(valor)) errores.push('No puede contener espacios.');

  return { valido: errores.length === 0, errores };
}

function validarNombre(valor) {
  const errores = [];
  if (!esTexto(valor)) {
    return { valido: false, errores: ['El nombre debe ser texto.'] };
  }
  const nombre = limpiarTexto(valor);

  if (!nombre) errores.push('El nombre es obligatorio.');
  if (nombre.length < 2 || nombre.length > 60) {
    errores.push('El nombre debe tener entre 2 y 60 caracteres.');
  }
  if (nombre && !REGEX_NOMBRE.test(nombre)) {
    errores.push('El nombre solo puede contener letras y espacios.');
  }
  if (contienePatronSospechoso(nombre)) errores.push('El nombre contiene caracteres no permitidos.');

  return { valido: errores.length === 0, errores, valor: nombre };
}

module.exports = {
  esTexto,
  limpiarTexto,
  contienePatronSospechoso,
  validarEmail,
  validarPassword,
  validarNombre,
};
