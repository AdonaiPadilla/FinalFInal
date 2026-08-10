import React, { useCallback, useState } from 'react';
import { View, Text, FlatList, StyleSheet, ActivityIndicator, Image, Button, RefreshControl, TouchableOpacity } from 'react-native';
import { Link, useFocusEffect, useRouter } from 'expo-router';
import { obtenerMisCompras } from '../../api/booksApi';

export default function MisComprasScreen() {
  const router = useRouter();
  const [compras, setCompras] = useState<any[]>([]);
  const [cargando, setCargando] = useState(true);
  const [refrescando, setRefrescando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const cargar = async () => {
    try {
      const data = await obtenerMisCompras();
      setCompras(Array.isArray(data) ? data : []);
      setError(null);
    } catch (err) {
      setError('No se pudieron cargar tus compras');
    } finally {
      setCargando(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      cargar();
    }, [])
  );

  const onRefresh = useCallback(async () => {
    setRefrescando(true);
    await cargar();
    setRefrescando(false);
  }, []);

  if (cargando) {
    return (
      <View style={styles.centrado}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return (
    <View style={styles.contenedor}>
      <Button title="← Volver" onPress={() => router.back()} />
      <Text style={styles.titulo}>Mis libros comprados</Text>

      {error ? <Text style={styles.error}>{error}</Text> : null}

      {compras.length === 0 && !error ? (
        <View style={styles.centrado}>
          <Text style={styles.vacioTexto}>Todavía no has comprado ningún libro</Text>
        </View>
      ) : (
        <FlatList
          data={compras}
          keyExtractor={(item) => item._id}
          refreshControl={<RefreshControl refreshing={refrescando} onRefresh={onRefresh} />}
          contentContainerStyle={{ paddingBottom: 24 }}
          renderItem={({ item }) => {
            const libro = item.libro;
            return (
              <Link href={libro ? `/libro/${libro._id}` : '#'} asChild>
                <TouchableOpacity style={styles.tarjeta} disabled={!libro}>
                  {libro?.portada ? (
                    <Image source={{ uri: libro.portada }} style={styles.portada} />
                  ) : (
                    <View style={[styles.portada, styles.sinPortada]}>
                      <Text style={styles.iconoLibro}>📖</Text>
                    </View>
                  )}
                  <View style={{ flex: 1 }}>
                    <Text style={styles.tituloLibro} numberOfLines={2}>{libro?.titulo || 'Libro no disponible'}</Text>
                    <Text style={styles.autorLibro}>{libro?.autor}</Text>
                    <Text style={styles.precioPagado}>Pagaste ${item.precioPagado}</Text>
                  </View>
                </TouchableOpacity>
              </Link>
            );
          }}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  contenedor: { flex: 1, padding: 16, paddingTop: 40 },
  centrado: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  titulo: { fontSize: 22, fontWeight: 'bold', marginTop: 20, marginBottom: 16 },
  error: { color: '#D92D20', marginBottom: 12 },
  vacioTexto: { color: '#666', fontSize: 14 },
  tarjeta: {
    flexDirection: 'row',
    gap: 12,
    backgroundColor: '#f7f7f7',
    borderRadius: 10,
    padding: 10,
    marginBottom: 10,
    alignItems: 'center',
  },
  portada: { width: 60, height: 84, borderRadius: 6, backgroundColor: '#eee' },
  sinPortada: { justifyContent: 'center', alignItems: 'center' },
  iconoLibro: { fontSize: 26 },
  tituloLibro: { fontSize: 15, fontWeight: '600' },
  autorLibro: { fontSize: 13, color: '#666', marginTop: 2 },
  precioPagado: { fontSize: 12, fontWeight: '600', color: '#2a7', marginTop: 6 },
});
