require('dotenv').config();
const mongoose = require('mongoose');
const User = require('../models/User');

const email = process.argv[2];

if (!email) {
  console.log('Uso: node src/scripts/crearAdmin.js correo@ejemplo.com');
  process.exit(1);
}

const promoverAdmin = async () => {
  await mongoose.connect(process.env.MONGO_URI);
  console.log('Conectado a MongoDB');

  const usuario = await User.findOneAndUpdate(
    { email },
    { rol: 'admin' },
    { new: true }
  );

  if (!usuario) {
    console.log(`No se encontró ningún usuario con el email: ${email}`);
  } else {
    console.log(`Usuario actualizado a admin: ${usuario.nombre} (${usuario.email})`);
  }

  await mongoose.disconnect();
};

promoverAdmin().catch((error) => {
  console.error('Error:', error);
  process.exit(1);
});