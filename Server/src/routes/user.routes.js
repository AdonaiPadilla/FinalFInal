const express = require('express');
const router = express.Router();
const { listarUsuarios, obtenerUsuarioPorId, eliminarUsuario } = require('../controllers/user.controller');
const protegerRuta = require('../middlewares/auth.middleware');
const permitirRoles = require('../middlewares/role.middleware');
const { validarIdParam } = require('../utils/validators.util');

router.get('/', protegerRuta, permitirRoles('admin'), listarUsuarios);
router.get('/:id', validarIdParam(), protegerRuta, permitirRoles('admin'), obtenerUsuarioPorId);
router.delete('/:id', validarIdParam(), protegerRuta, permitirRoles('admin'), eliminarUsuario);

module.exports = router;
