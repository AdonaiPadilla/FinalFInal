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

const REGEX_OBJECT_ID = /^[a-f\d]{24}$/i;

function esObjectIdValido(valor) {
  return esTexto(valor) && REGEX_OBJECT_ID.test(valor);
}

// Middleware para usar directo en las rutas: GET /libros/:id, /users/:id,
// etc. Corta la petición con 400 antes de que el controller siquiera la
// toque si el id de la URL no tiene formato de ObjectId de Mongo -- así
// no dependemos únicamente del CastError de Mongoose (que igual está
// cubierto por error.middleware.js, pero esto da un mensaje más claro y
// una segunda capa de defensa consistente en todos los endpoints con :id).
function validarIdParam(nombreParam = 'id') {
  return (req, res, next) => {
    if (!esObjectIdValido(req.params[nombreParam])) {
      return res.status(400).json({ message: 'Identificador inválido' });
    }
    next();
  };
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

// --- Validadores para el formulario de libros (crear/editar) ---
// Mismo criterio que arriba: aunque el cliente ya valide, cualquiera
// puede pegarle directo a la API, así que la validación real vive aquí.

function validarCampoTexto(valor, { campo, minLen = 1, maxLen, opcional = false }) {
  const errores = [];

  if (valor === undefined || valor === null || valor === '') {
    if (opcional) return { valido: true, errores: [], valor: '' };
    return { valido: false, errores: [`${campo} es obligatorio.`], valor: '' };
  }

  if (!esTexto(valor)) {
    return { valido: false, errores: [`${campo} debe ser texto.`], valor: '' };
  }

  const limpio = limpiarTexto(valor);

  if (limpio.length < minLen) errores.push(`${campo} debe tener al menos ${minLen} caracter(es).`);
  if (maxLen && limpio.length > maxLen) errores.push(`${campo} no puede exceder ${maxLen} caracteres.`);
  if (contienePatronSospechoso(limpio)) errores.push(`${campo} contiene caracteres no permitidos.`);

  return { valido: errores.length === 0, errores, valor: limpio };
}

function validarNumeroLibro(valor, { campo, min = 0, maxDecimales = 2 }) {
  // Acepta number o string numérico (el cliente manda strings desde los
  // TextInput), pero rechaza cualquier otra cosa -- en particular objetos,
  // que es como se ven los intentos de inyección de operadores de Mongo
  // (ej. { "$gt": 0 }) cuando llegan en un campo que debería ser numérico.
  if (typeof valor !== 'number' && !esTexto(valor)) {
    return { valido: false, errores: [`${campo} debe ser un número.`], valor: null };
  }

  const numero = typeof valor === 'number' ? valor : Number(valor);
  const errores = [];

  if (!Number.isFinite(numero)) {
    errores.push(`${campo} debe ser un número válido.`);
    return { valido: false, errores, valor: null };
  }
  if (numero < min) errores.push(`${campo} no puede ser menor a ${min}.`);

  const decimales = (String(numero).split('.')[1] || '').length;
  if (decimales > maxDecimales) errores.push(`${campo} admite máximo ${maxDecimales} decimales.`);

  return { valido: errores.length === 0, errores, valor: numero };
}

function validarUrlOpcional(valor, { campo, maxLen = 2000 }) {
  if (valor === undefined || valor === null || valor === '') {
    return { valido: true, errores: [], valor: '' };
  }
  if (!esTexto(valor)) {
    return { valido: false, errores: [`${campo} debe ser texto.`], valor: '' };
  }

  const limpio = limpiarTexto(valor);
  const errores = [];

  if (limpio.length > maxLen) errores.push(`${campo} es demasiado larga.`);
  if (contienePatronSospechoso(limpio)) errores.push(`${campo} contiene caracteres no permitidos.`);
  if (!/^https?:\/\/.+/i.test(limpio)) errores.push(`${campo} debe ser una URL http(s) válida.`);

  return { valido: errores.length === 0, errores, valor: limpio };
}

// archivoPdf no lo escribe el usuario a mano: lo genera el propio servidor
// en upload.middleware.js. Aun así lo validamos al guardar el libro, para
// que nadie mande una ruta arbitraria (ej. "../../.env" o una URL externa)
// intentando que resolverRutaPdf apunte a otro lado.
function validarRutaArchivoPdf(valor) {
  const errores = [];
  if (!esTexto(valor) || !valor) {
    return { valido: false, errores: ['El archivo PDF es obligatorio.'], valor: '' };
  }
  const limpio = limpiarTexto(valor);

  if (!/^\/uploads\/books\/[a-zA-Z0-9._\- ]+\.pdf$/.test(limpio)) {
    errores.push('La ruta del archivo PDF no es válida.');
  }
  if (limpio.includes('..')) errores.push('La ruta del archivo PDF no es válida.');

  return { valido: errores.length === 0, errores, valor: limpio };
}

// Valida el conjunto completo de campos que puede mandar el admin/gerente
// al crear o editar un libro. Devuelve { valido, errores, datos } donde
// "datos" ya viene limpio y listo para pasarle a Mongoose.
function validarDatosLibro(body, { esCreacion }) {
  const errores = [];
  const datos = {};

  const titulo = validarCampoTexto(body.titulo, { campo: 'El título', minLen: 1, maxLen: 200 });
  errores.push(...titulo.errores);
  if (body.titulo !== undefined) datos.titulo = titulo.valor;

  const autor = validarCampoTexto(body.autor, { campo: 'El autor', maxLen: 150, opcional: true });
  errores.push(...autor.errores);
  if (body.autor !== undefined && autor.valor) datos.autor = autor.valor;

  const categoria = validarCampoTexto(body.categoria, { campo: 'La categoría', minLen: 1, maxLen: 80 });
  errores.push(...categoria.errores);
  if (body.categoria !== undefined) datos.categoria = categoria.valor;

  const descripcion = validarCampoTexto(body.descripcion, { campo: 'La descripción', maxLen: 2000, opcional: true });
  errores.push(...descripcion.errores);
  if (body.descripcion !== undefined) datos.descripcion = descripcion.valor;

  if (body.precioCompra !== undefined) {
    const precioCompra = validarNumeroLibro(body.precioCompra, { campo: 'El precio de compra', min: 0 });
    errores.push(...precioCompra.errores);
    if (precioCompra.valido) datos.precioCompra = precioCompra.valor;
  }

  if (body.precioRenta !== undefined) {
    const precioRenta = validarNumeroLibro(body.precioRenta, { campo: 'El precio de renta', min: 0 });
    errores.push(...precioRenta.errores);
    if (precioRenta.valido) datos.precioRenta = precioRenta.valor;
  }

  if (body.totalPaginas !== undefined) {
    const totalPaginas = validarNumeroLibro(body.totalPaginas, { campo: 'El total de páginas', min: 1, maxDecimales: 0 });
    errores.push(...totalPaginas.errores);
    if (totalPaginas.valido) datos.totalPaginas = totalPaginas.valor;
  }

  if (body.duracionRentaDias !== undefined) {
    const duracion = validarNumeroLibro(body.duracionRentaDias, { campo: 'La duración de la renta', min: 1, maxDecimales: 0 });
    errores.push(...duracion.errores);
    if (duracion.valido) datos.duracionRentaDias = duracion.valor;
  }

  if (body.portada !== undefined) {
    const portada = validarUrlOpcional(body.portada, { campo: 'La URL de portada' });
    errores.push(...portada.errores);
    if (portada.valor) datos.portada = portada.valor;
  }

  // archivoPdf es obligatorio al crear; al editar es opcional (no siempre
  // se cambia el PDF), pero si viene, se valida igual.
  if (esCreacion || body.archivoPdf !== undefined) {
    const archivoPdf = validarRutaArchivoPdf(body.archivoPdf);
    errores.push(...archivoPdf.errores);
    if (archivoPdf.valido) datos.archivoPdf = archivoPdf.valor;
  }

  return { valido: errores.length === 0, errores, datos };
}

module.exports = {
  esTexto,
  limpiarTexto,
  contienePatronSospechoso,
  esObjectIdValido,
  validarIdParam,
  validarEmail,
  validarPassword,
  validarNombre,
  validarDatosLibro,
};
