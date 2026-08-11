const express = require('express');
const router = express.Router();
const { listarUsuarios, obtenerUsuarioPorId, eliminarUsuario } = require('../controllers/user.controller');
const protegerRuta = require('../middlewares/auth.middleware');
const permitirRoles = require('../middlewares/role.middleware');

router.get('/', protegerRuta, permitirRoles('admin'), listarUsuarios);
router.get('/:id', protegerRuta, permitirRoles('admin'), obtenerUsuarioPorId);
router.delete('/:id', protegerRuta, permitirRoles('admin'), eliminarUsuario);

module.exports = router;
