const User = require('../models/User');
const { comparePassword } = require('../utils/hash.util');
const { generateToken } = require('../utils/jwt.util');

// POST /api/auth/register
const register = async (req, res) => {
  try {
    const { nombre, email, password, rol } = req.body;

    if (!nombre || !email || !password) {
      return res.status(400).json({ message: 'Nombre, email y contraseña son obligatorios' });
    }

    const existeUsuario = await User.findOne({ email });
    if (existeUsuario) {
      return res.status(409).json({ message: 'Ese email ya está registrado' });
    }

    const nuevoUsuario = await User.create({
      nombre,
      email,
      password, // el pre('save') del modelo se encarga de hashearlo
      rol: rol || 'usuario' // por seguridad, si no mandan rol, se asigna 'usuario'
    });

    const token = generateToken({ id: nuevoUsuario._id, rol: nuevoUsuario.rol });

    res.status(201).json({
      message: 'Usuario registrado correctamente',
      token,
      usuario: {
        id: nuevoUsuario._id,
        nombre: nuevoUsuario.nombre,
        email: nuevoUsuario.email,
        rol: nuevoUsuario.rol
      }
    });
  } catch (error) {
    res.status(500).json({ message: 'Error al registrar usuario', error: error.message });
  }
};

// POST /api/auth/login
const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: 'Email y contraseña son obligatorios' });
    }

    const usuario = await User.findOne({ email }).select('+password');
    if (!usuario) {
      return res.status(401).json({ message: 'Credenciales inválidas' });
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
        rol: usuario.rol
      }
    });
  } catch (error) {
    res.status(500).json({ message: 'Error al iniciar sesión', error: error.message });
  }
};

module.exports = { register, login };