import React, { useState, useCallback } from 'react';
import { View, Text, FlatList, StyleSheet, ActivityIndicator, Image, RefreshControl, TouchableOpacity } from 'react-native';
import { obtenerLibros } from '../api/booksApi';
import { Link, useFocusEffect } from 'expo-router';
import { useAuth } from '../context/AuthContext';

export default function CatalogoLibros() {
  const [libros, setLibros] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [refrescando, setRefrescando] = useState(false);
  const [error, setError] = useState(null);
  const { usuario } = useAuth();
  const esAdmin = usuario?.rol === 'admin' || usuario?.rol === 'gerente';

  const cargarLibros = async () => {
    try {
      const data = await obtenerLibros();
      if (Array.isArray(data)) {
        setLibros(data);
      } else {
        console.error('Los datos no son un array:', data);
        setLibros([]);
      }
      setError(null);
    } catch (err) {
      console.error('Error al cargar:', err);
      setError('No se pudieron cargar los libros');
      setLibros([]);
    } finally {
      setCargando(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      cargarLibros();
    }, [])
  );

  const onRefresh = useCallback(async () => {
    setRefrescando(true);
    await cargarLibros();
    setRefrescando(false);
  }, []);

  const librosPorCategoria = libros.length > 0
    ? libros.reduce((acc, libro) => {
        const categoria = libro.categoria || 'General';
        if (!acc[categoria]) acc[categoria] = [];
        acc[categoria].push(libro);
        return acc;
      }, {})
    : {};

  if (cargando) {
    return (
      <View style={styles.centrado}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.centrado}>
        <Text>{error}</Text>
      </View>
    );
  }

  if (libros.length === 0) {
    return (
      <View style={styles.centrado}>
        <Text>No hay libros disponibles todavía</Text>
      </View>
    );
  }

  return (
    <FlatList
      style={styles.contenedor}
      data={Object.keys(librosPorCategoria)}
      keyExtractor={(categoria) => categoria}
      refreshControl={<RefreshControl refreshing={refrescando} onRefresh={onRefresh} />}
      renderItem={({ item: categoria }) => (
        <View style={styles.seccion}>
          <Text style={styles.tituloCategoria}>{categoria}</Text>
          <FlatList
            horizontal
            data={librosPorCategoria[categoria]}
            keyExtractor={(libro) => libro._id}
            showsHorizontalScrollIndicator={false}
            renderItem={({ item: libro }) => (
              <View style={styles.tarjeta}>
                <Link href={`/libro/${libro._id}`} asChild>
                  <TouchableOpacity>
                    {libro.portada ? (
                      <Image source={{ uri: libro.portada }} style={styles.portada} />
                    ) : (
                      <View style={[styles.portada, styles.sinPortada]}>
                        <Text style={styles.iconoLibro}>📖</Text>
                      </View>
                    )}
                    {!libro.disponible ? (
                      <View style={styles.badgeOcupado}>
                        <Text style={styles.textoOcupado}>Ocupado</Text>
                      </View>
                    ) : null}
                    <Text style={styles.tituloLibro} numberOfLines={2}>{libro.titulo}</Text>
                    <Text style={styles.autorLibro} numberOfLines={1}>{libro.autor}</Text>
                    <Text style={styles.precioLibro}>${libro.precioRenta} / renta</Text>
                  </TouchableOpacity>
                </Link>
                {esAdmin ? (
                  <Link href={`/admin/editar-libro/${libro._id}`} asChild>
                    <TouchableOpacity>
                      <Text style={styles.badgeAdmin}>✏️ Editar</Text>
                    </TouchableOpacity>
                  </Link>
                ) : null}
              </View>
            )}
          />
        </View>
      )}
    />
  );
}

const styles = StyleSheet.create({
  contenedor: { flex: 1, backgroundColor: '#fff' },
  centrado: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  seccion: { marginBottom: 20, paddingLeft: 16 },
  tituloCategoria: { fontSize: 18, fontWeight: 'bold', marginBottom: 10 },
  tarjeta: { width: 130, marginRight: 12 },
  portada: { width: 130, height: 180, borderRadius: 8, backgroundColor: '#eee' },
  sinPortada: { justifyContent: 'center', alignItems: 'center' },
  iconoLibro: { fontSize: 40 },
  tituloLibro: { fontSize: 13, fontWeight: '600', marginTop: 6 },
  autorLibro: { fontSize: 12, color: '#666' },
  precioLibro: { fontSize: 13, color: '#2a7', marginTop: 2, fontWeight: 'bold' },
  badgeOcupado: { position: 'absolute', top: 6, right: 6, backgroundColor: '#c00', borderRadius: 4, paddingHorizontal: 6, paddingVertical: 2 },
  textoOcupado: { color: '#fff', fontSize: 10, fontWeight: 'bold' },
  badgeAdmin: { fontSize: 11, color: '#0066cc', marginTop: 4, fontWeight: '600' },
});