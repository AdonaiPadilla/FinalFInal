const express = require('express');
const router = express.Router();
const { crearRenta, misRentas, todasLasRentas, eliminarRenta } = require('../controllers/rental.controller');
const protegerRuta = require('../middlewares/auth.middleware');
const permitirRoles = require('../middlewares/role.middleware');

router.post('/', protegerRuta, crearRenta);
router.get('/mias', protegerRuta, misRentas);
router.get('/', protegerRuta, permitirRoles('admin', 'gerente'), todasLasRentas);
router.delete('/:id', protegerRuta, permitirRoles('admin', 'gerente'), eliminarRenta);

module.exports = router;