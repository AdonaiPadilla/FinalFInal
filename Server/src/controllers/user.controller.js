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
    const usuario = await User.findByIdAndUpdate(
      req.params.id,
      { activo: false },
      { new: true }
    ).select('-password');

    if (!usuario) {
      return res.status(404).json({ message: 'Usuario no encontrado' });
    }

    res.json({ message: 'Usuario desactivado correctamente', usuario });
  } catch (error) {
    res.status(500).json({ message: 'Error al eliminar usuario', error: error.message });
  }
};

module.exports = { listarUsuarios, obtenerUsuarioPorId, eliminarUsuario };
