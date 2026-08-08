/**
 * Utilidades de validación y sanitización de entradas.
 *
 * IMPORTANTE: esta capa es una primera línea de defensa (UX + defensa en
 * profundidad). La protección real contra inyecciones SIEMPRE debe existir
 * también en el servidor (queries parametrizadas / Mongoose con esquemas
 * estrictos, sanitización de operadores de Mongo como $where, $ne, $gt,
 * validación con librerías como express-validator o Joi, hashing con bcrypt,
 * rate limiting en /auth/login, etc). Nunca confíes solo en el cliente.
 */

export interface ResultadoValidacion {
  valido: boolean;
  errores: string[];
}

// Patrones típicos usados en ataques de inyección (SQL clásico, NoSQL/Mongo
// y XSS básico). Si aparecen en un campo de texto libre, lo rechazamos.
const PATRON_INYECCION =
  /(--|;|\/\*|\*\/|\bunion\b|\bselect\b|\binsert\b|\bdelete\b|\bdrop\b|\bupdate\b|\bexec\b|\bor\s+1=1\b|\$where|\$ne|\$gt|\$lt|\$regex|\$or|\$and|<script|<\/script|javascript:)/i;

/** Elimina espacios sobrantes y caracteres de control invisibles. */
export function limpiarTexto(valor: string): string {
  if (typeof valor !== 'string') return '';
  // Quita caracteres de control (incluye null bytes) y recorta espacios.
  // eslint-disable-next-line no-control-regex
  return valor.replace(/[\u0000-\u001F\u007F]/g, '').trim();
}

/** Detecta patrones sospechosos de inyección SQL/NoSQL/XSS en un texto. */
export function contienePatronSospechoso(valor: string): boolean {
  if (typeof valor !== 'string') return true; // si no es string, es sospechoso
  return PATRON_INYECCION.test(valor);
}

export function validarEmail(emailCrudo: string): ResultadoValidacion {
  const errores: string[] = [];
  const email = limpiarTexto(emailCrudo);

  if (!email) {
    errores.push('El correo es obligatorio.');
    return { valido: false, errores };
  }

  if (email.length > 254) {
    errores.push('El correo es demasiado largo.');
  }

  const regexEmail = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)+$/;
  if (!regexEmail.test(email)) {
    errores.push('El formato del correo no es válido.');
  }

  if (contienePatronSospechoso(email)) {
    errores.push('El correo contiene caracteres no permitidos.');
  }

  return { valido: errores.length === 0, errores };
}

export function validarPassword(passwordCrudo: string): ResultadoValidacion {
  const errores: string[] = [];
  const password = passwordCrudo ?? '';

  if (!password) {
    errores.push('La contraseña es obligatoria.');
    return { valido: false, errores };
  }

  if (password.length < 8) {
    errores.push('Debe tener al menos 8 caracteres.');
  }
  if (password.length > 72) {
    // bcrypt ignora todo lo que exceda 72 bytes; evitamos falsa sensación de seguridad
    errores.push('No puede exceder 72 caracteres.');
  }
  if (!/[a-z]/.test(password)) {
    errores.push('Debe incluir al menos una minúscula.');
  }
  if (!/[A-Z]/.test(password)) {
    errores.push('Debe incluir al menos una mayúscula.');
  }
  if (!/[0-9]/.test(password)) {
    errores.push('Debe incluir al menos un número.');
  }
  if (!/[^a-zA-Z0-9]/.test(password)) {
    errores.push('Debe incluir al menos un símbolo (ej. !@#$%).');
  }
  if (/\s/.test(password)) {
    errores.push('No puede contener espacios.');
  }

  return { valido: errores.length === 0, errores };
}

export function validarNombre(nombreCrudo: string): ResultadoValidacion {
  const errores: string[] = [];
  const nombre = limpiarTexto(nombreCrudo);

  if (!nombre) {
    errores.push('El nombre es obligatorio.');
    return { valido: false, errores };
  }

  if (nombre.length < 2 || nombre.length > 60) {
    errores.push('El nombre debe tener entre 2 y 60 caracteres.');
  }

  // Solo letras (con acentos/ñ) y espacios simples.
  const regexNombre = /^[a-zA-ZÀ-ÖØ-öø-ÿñÑ]+(?:\s[a-zA-ZÀ-ÖØ-öø-ÿñÑ]+)*$/;
  if (!regexNombre.test(nombre)) {
    errores.push('El nombre solo puede contener letras y espacios.');
  }

  if (contienePatronSospechoso(nombre)) {
    errores.push('El nombre contiene caracteres no permitidos.');
  }

  return { valido: errores.length === 0, errores };
}

export function validarConfirmacionPassword(
  password: string,
  confirmacion: string
): ResultadoValidacion {
  const errores: string[] = [];
  if (password !== confirmacion) {
    errores.push('Las contraseñas no coinciden.');
  }
  return { valido: errores.length === 0, errores };
}

/** Traduce errores comunes de red/backend a mensajes amigables en español. */
export function obtenerMensajeError(error: any): string {
  if (!error) return 'Ocurrió un error inesperado.';

  if (error.response?.data?.message) {
    return String(error.response.data.message);
  }
  if (error.response?.data?.errores?.length) {
    return String(error.response.data.errores[0]);
  }
  if (error.response?.status === 401) {
    return 'Correo o contraseña incorrectos.';
  }
  if (error.response?.status === 409) {
    return 'Ese correo ya está registrado.';
  }
  if (error.response?.status === 429) {
    return 'Demasiados intentos. Intenta de nuevo más tarde.';
  }
  if (error.code === 'ECONNABORTED') {
    return 'El servidor tardó demasiado en responder. Intenta de nuevo.';
  }
  if (error.request && !error.response) {
    return 'No se pudo conectar con el servidor. Revisa tu conexión.';
  }
  return 'Ocurrió un error inesperado. Intenta de nuevo.';
}
