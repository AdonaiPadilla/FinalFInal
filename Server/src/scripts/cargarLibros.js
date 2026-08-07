require('dotenv').config();
const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');
const Book = require('../models/Book');

const carpetaBase = path.join(__dirname, '../uploads/books');

const cargarLibros = async () => {
  await mongoose.connect(process.env.MONGO_URI);
  console.log('Conectado a MongoDB');

  const categorias = fs.readdirSync(carpetaBase, { withFileTypes: true })
    .filter((item) => item.isDirectory());

  let totalInsertados = 0;

  for (const categoriaDir of categorias) {
    const nombreCategoria = categoriaDir.name;
    const rutaCategoria = path.join(carpetaBase, nombreCategoria);

    const archivos = fs.readdirSync(rutaCategoria)
      .filter((archivo) => archivo.toLowerCase().endsWith('.pdf'));

    for (const archivo of archivos) {
      const titulo = archivo.replace('.pdf', '').replace(/-/g, ' ');
      const rutaRelativa = `/uploads/books/${nombreCategoria}/${archivo}`;

      const yaExiste = await Book.findOne({ archivoPdf: rutaRelativa });
      if (yaExiste) {
        console.log(`Ya existe: ${titulo}`);
        continue;
      }

      await Book.create({
        titulo,
        autor: 'Autor desconocido', // ajusta manualmente después si quieres
        precioCompra: 50,
        precioRenta: 15,
        totalPaginas: 100, // valor por defecto, ajusta si tienes el dato real
        archivoPdf: rutaRelativa,
        categoria: nombreCategoria,
        activo: true,
      });

      totalInsertados++;
      console.log(`Insertado: ${titulo} (${nombreCategoria})`);
    }
  }

  console.log(`\nListo. Total insertados: ${totalInsertados}`);
  await mongoose.disconnect();
};

cargarLibros().catch((error) => {
  console.error('Error al cargar libros:', error);
  process.exit(1);
});