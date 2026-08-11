require('dotenv').config();
const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');
const Book = require('../models/Book');

const carpetaBase = path.join(__dirname, '../uploads/books');

const cargarLibros = async () => {
  await mongoose.connect(process.env.MONGO_URI);
  console.log('Conectado a MongoDB');

  // 1) Limpieza: cualquier libro que ya exista en la BD pero cuyo PDF ya
  // no esté físicamente en uploads/books se desactiva (soft delete) en
  // vez de dejarlo ahí dando "Archivo no disponible" al usuario. Esto
  // también resuelve los 2 libros de prueba que deja seed.js
  // (cien_anios.pdf, el_principito.pdf), que nunca tuvieron PDF real.
  const librosExistentes = await Book.find({ activo: true });
  let desactivados = 0;
  for (const libro of librosExistentes) {
    const rutaRelativa = libro.archivoPdf.replace(/^\/?uploads\//, '');
    const rutaAbsoluta = path.join(__dirname, '../uploads', rutaRelativa);
    if (!fs.existsSync(rutaAbsoluta)) {
      libro.activo = false;
      await libro.save();
      desactivados++;
      console.log(`Desactivado (sin archivo real): ${libro.titulo}`);
    }
  }

  // 2) Carga: recorre uploads/books/<categoria>/*.pdf e inserta los que
  // todavía no estén en la BD (se identifican por su archivoPdf, así que
  // correr esto varias veces es seguro, nunca duplica).
  const categorias = fs.readdirSync(carpetaBase, { withFileTypes: true })
    .filter((item) => item.isDirectory());

  let totalInsertados = 0;

  for (const categoriaDir of categorias) {
    const nombreCategoria = categoriaDir.name;
    const rutaCategoria = path.join(carpetaBase, nombreCategoria);

    const archivos = fs.readdirSync(rutaCategoria)
      .filter((archivo) => archivo.toLowerCase().endsWith('.pdf'));

    for (const archivo of archivos) {
      const titulo = archivo.replace(/\.pdf$/i, '').replace(/[-_]/g, ' ').trim();
      const rutaRelativa = `/uploads/books/${nombreCategoria}/${archivo}`;

      const yaExiste = await Book.findOne({ archivoPdf: rutaRelativa });
      if (yaExiste) {
        // Si existía pero estaba desactivado (por ejemplo por una corrida
        // anterior antes de que el archivo estuviera ahí), lo reactivamos.
        if (!yaExiste.activo) {
          yaExiste.activo = true;
          await yaExiste.save();
          console.log(`Reactivado: ${titulo}`);
        } else {
          console.log(`Ya existe: ${titulo}`);
        }
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

  console.log(`\nListo. Insertados: ${totalInsertados} · Desactivados (sin archivo): ${desactivados}`);
  await mongoose.disconnect();
};

cargarLibros().catch((error) => {
  console.error('Error al cargar libros:', error);
  process.exit(1);
});
