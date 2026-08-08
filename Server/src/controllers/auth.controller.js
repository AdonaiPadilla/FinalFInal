const User = require('../models/User');
const { comparePassword } = require('../utils/hash.util');
const { generateToken } = require('../utils/jwt.util');
const { validarEmail, validarPassword, validarNombre, esTexto } = require('../utils/validators.util');

// POST /api/auth/register
const register = async (req, res) => {
  try {
    const { nombre, email, password } = req.body;
    // OJO: a propósito NO se lee "rol" del body. Si un cliente manda
    // { "rol": "admin" } en el registro, se ignora por completo. Los
    // admins se promueven solo desde el script scripts/crearAdmin.js,
    // corrido directamente en el servidor.

    if (!esTexto(nombre) || !esTexto(email) || !esTexto(password)) {
      return res.status(400).json({ message: 'Nombre, email y contraseña son obligatorios' });
    }

    const resNombre = validarNombre(nombre);
    const resEmail = validarEmail(email);
    const resPassword = validarPassword(password);

    const errores = [...resNombre.errores, ...resEmail.errores, ...resPassword.errores];
    if (errores.length > 0) {
      return res.status(400).json({ message: errores[0], errores });
    }

    const emailNormalizado = resEmail.valor;

    const existeUsuario = await User.findOne({ email: emailNormalizado });
    if (existeUsuario) {
      return res.status(409).json({ message: 'Ese email ya está registrado' });
    }

    const nuevoUsuario = await User.create({
      nombre: resNombre.valor,
      email: emailNormalizado,
      password, // el pre('save') del modelo se encarga de hashearlo
      rol: 'usuario', // siempre fijo en el registro público
    });

    const token = generateToken({ id: nuevoUsuario._id, rol: nuevoUsuario.rol });

    res.status(201).json({
      message: 'Usuario registrado correctamente',
      token,
      usuario: {
        id: nuevoUsuario._id,
        nombre: nuevoUsuario.nombre,
        email: nuevoUsuario.email,
        rol: nuevoUsuario.rol,
      },
    });
  } catch (error) {
    if (error.code === 11000) {
      // índice único de Mongo (email duplicado) por si hay una carrera con el findOne
      return res.status(409).json({ message: 'Ese email ya está registrado' });
    }
    console.error('Error en register:', error);
    res.status(500).json({ message: 'Error al registrar usuario' });
  }
};

// POST /api/auth/login
const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Defensa clave contra inyección NoSQL: si email/password no son
    // strings (por ejemplo alguien manda { "$ne": null }), se rechaza de
    // inmediato en vez de dejar que lleguen a la query de Mongo.
    if (!esTexto(email) || !esTexto(password)) {
      return res.status(400).json({ message: 'Email y contraseña son obligatorios' });
    }

    const emailLimpio = email.trim().toLowerCase();
    if (!emailLimpio || !password) {
      return res.status(400).json({ message: 'Email y contraseña son obligatorios' });
    }

    const usuario = await User.findOne({ email: emailLimpio }).select('+password');
    if (!usuario) {
      return res.status(401).json({ message: 'Credenciales inválidas' });
    }

    if (!usuario.activo) {
      return res.status(403).json({ message: 'Esta cuenta está deshabilitada' });
    }

    const passwordValida = await comparePassword(password, usuario.password);
    if (!passwordValida) {
      return res.status(401).json({ message: 'Credenciales inválidas' });
    }

    const token = generateToken({ id: usuario._id, rol: usuario.rol });

    res.json({
      message: 'Login exitoso',
      token,
      usuario: {
        id: usuario._id,
        nombre: usuario.nombre,
        email: usuario.email,
        rol: usuario.rol,
      },
    });
  } catch (error) {
    console.error('Error en login:', error);
    res.status(500).json({ message: 'Error al iniciar sesión' });
  }
};

module.exports = { register, login };
