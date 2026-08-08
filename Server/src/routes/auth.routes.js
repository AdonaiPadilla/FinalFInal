const express = require('express');
const router = express.Router();
const { register, login } = require('../controllers/auth.controller');
const limitarIntentos = require('../middlewares/rateLimit.middleware');

const limitarLogin = limitarIntentos({
  maxIntentos: 10,
  ventanaMs: 15 * 60 * 1000, // 15 minutos
  mensaje: 'Demasiados intentos de inicio de sesión. Intenta de nuevo en unos minutos.',
});

const limitarRegistro = limitarIntentos({
  maxIntentos: 5,
  ventanaMs: 60 * 60 * 1000, // 1 hora
  mensaje: 'Demasiados intentos de registro desde este dispositivo. Intenta más tarde.',
});

router.post('/register', limitarRegistro, register);
router.post('/login', limitarLogin, login);

module.exports = router;
