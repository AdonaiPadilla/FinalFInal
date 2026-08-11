
require('dotenv').config({ path: '../../.env' });
require('dotenv').config();
const mongoose = require('mongoose');
const Book = require('../models/Book');

const connectDB = async () => {
  try {
    const uri = process.env.MONGO_URI || 'mongodb://localhost:27017/app-libros';
    await mongoose.connect(uri);
    console.log('MongoDB conectado para seeding');
  } catch (error) {
    console.error('Error de conexion:', error.message);
    process.exit(1);
  }
};

const seedData = async () => {
  await connectDB();

  // Este script borra TODA la colección de libros (Book.deleteMany({})).
  // Ya causó que se perdieran los 42 libros reales cargados con
  // cargarLibros.js, dejando solo estos 2 de prueba (cuyo archivoPdf ni
  // siquiera apunta a un archivo real). Para evitar que se vuelva a correr
  // por accidente, ahora exige la bandera --confirmar explícita:
  //   node scripts/seed.js --confirmar
  if (!process.argv.includes('--confirmar')) {
    console.log('⚠️  seed.js borra TODOS los libros de la base de datos.');
    console.log('   Si de verdad quieres hacer eso, corre: node scripts/seed.js --confirmar');
    console.log('   (Si lo que quieres es cargar tus PDFs reales, usa cargarLibros.js en vez de este script.)');
    process.exit(0);
  }

  const libros = [
    {
      titulo: 'Cien Años de Soledad',
      autor: 'Gabriel García Márquez',
      descripcion: 'Obra maestra de la literatura hispanoamericana y universal.',
      categoria: 'Novela',
      precioCompra: 20,
      precioRenta: 5,
      totalPaginas: 417,
      portada: 'https://images.cdn2.buscalibre.com/fit-in/360x360/61/8d/618d227e8967274cd9589a549adff52d.jpg',
      archivoPdf: '/uploads/books/cien_anios.pdf'
    },
    {
      titulo: 'El Principito',
      autor: 'Antoine de Saint-Exupéry',
      descripcion: 'Una historia corta pero profunda sobre la vida y el amor.',
      categoria: 'Ficcion',
      precioCompra: 15,
      precioRenta: 3,
      totalPaginas: 96,
      portada: 'https://images.cdn3.buscalibre.com/fit-in/360x360/e8/63/e8633393910c2c3666d6d3d4bbcbdf23.jpg',
      archivoPdf: '/uploads/books/el_principito.pdf'
    }
  ];

  try {
    await Book.deleteMany({});
    await Book.insertMany(libros);
    console.log('Libros de prueba insertados con exito!');
    process.exit();
  } catch (error) {
    console.error('Error al insertar libros:', error);
    process.exit(1);
  }
};

seedData();

