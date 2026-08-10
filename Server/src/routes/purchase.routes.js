const express = require('express');
const router = express.Router();
const { crearCompra, misCompras, todasLasCompras } = require('../controllers/purchase.controller');
const protegerRuta = require('../middlewares/auth.middleware');
const permitirRoles = require('../middlewares/role.middleware');

router.post('/', protegerRuta, crearCompra);
router.get('/mias', protegerRuta, misCompras);
router.get('/', protegerRuta, permitirRoles('admin', 'gerente'), todasLasCompras);

module.exports = router;