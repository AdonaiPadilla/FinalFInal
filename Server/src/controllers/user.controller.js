const User = require('../models/User');

const listarUsuarios = async (req, res) => {
  try {
    const usuarios = await User.find({}).select('-password').sort({ createdAt: -1 });
    res.json(usuarios);
  } catch (error) {
    res.status(500).json({ message: 'Error al obtener usuarios', error: error.message });
  }
};

const obtenerUsuarioPorId = async (req, res) => {
  try {
    const usuario = await User.findById(req.params.id).select('-password');
    if (!usuario) {
      return res.status(404).json({ message: 'Usuario no encontrado' });
    }
    res.json(usuario);
  } catch (error) {
    res.status(500).json({ message: 'Error al obtener usuario', error: error.message });
  }
};

const eliminarUsuario = async (req, res) => {
  try {
    if (req.params.id === req.usuario.id) {
      return res.status(400).json({ message: 'No puedes desactivar tu propia cuenta' });
    }

    const usuarioObjetivo = await User.findById(req.params.id);
    if (!usuarioObjetivo) {
      return res.status(404).json({ message: 'Usuario no encontrado' });
    }

    // Evita que un admin desactive a otro admin sin querer (o por abuso
    // de una cuenta comprometida). Si de verdad hace falta, que lo haga
    // directo en la base de datos.
    if (usuarioObjetivo.rol === 'admin') {
      return res.status(403).json({ message: 'No puedes desactivar a otro administrador desde aquí' });
    }

    usuarioObjetivo.activo = false;
    await usuarioObjetivo.save();

    const usuario = usuarioObjetivo.toObject();
    delete usuario.password;

    res.json({ message: 'Usuario desactivado correctamente', usuario });
  } catch (error) {
    res.status(500).json({ message: 'Error al eliminar usuario', error: error.message });
  }
};

module.exports = { listarUsuarios, obtenerUsuarioPorId, eliminarUsuario };
