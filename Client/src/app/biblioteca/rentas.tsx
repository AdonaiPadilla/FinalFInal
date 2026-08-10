import React, { useCallback, useState } from 'react';
import { View, Text, FlatList, StyleSheet, ActivityIndicator, Image, Button, RefreshControl, TouchableOpacity } from 'react-native';
import { Link, useFocusEffect, useRouter } from 'expo-router';
import { obtenerMisRentas } from '../../api/booksApi';

export default function MisRentasScreen() {
  const router = useRouter();
  const [rentas, setRentas] = useState<any[]>([]);
  const [cargando, setCargando] = useState(true);
  const [refrescando, setRefrescando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const cargar = async () => {
    try {
      const data = await obtenerMisRentas();
      setRentas(Array.isArray(data) ? data : []);
      setError(null);
    } catch (err) {
      setError('No se pudieron cargar tus rentas');
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

  const diasRestantes = (fechaFin: string) => {
    const ms = new Date(fechaFin).getTime() - Date.now();
    return Math.max(0, Math.ceil(ms / (1000 * 60 * 60 * 24)));
  };

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
      <Text style={styles.titulo}>Mis rentas</Text>

      {error ? <Text style={styles.error}>{error}</Text> : null}

      {rentas.length === 0 && !error ? (
        <View style={styles.centrado}>
          <Text style={styles.vacioTexto}>Todavía no has rentado ningún libro</Text>
        </View>
      ) : (
        <FlatList
          data={rentas}
          keyExtractor={(item) => item._id}
          refreshControl={<RefreshControl refreshing={refrescando} onRefresh={onRefresh} />}
          contentContainerStyle={{ paddingBottom: 24 }}
          renderItem={({ item }) => {
            const libro = item.libro;
            const restantes = diasRestantes(item.fechaFin);
            const vencida = !item.activa || restantes === 0;

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
                    <Text style={[styles.estado, vencida ? styles.estadoVencido : styles.estadoActivo]}>
                      {vencida ? 'Renta vencida' : `Vence en ${restantes} día${restantes === 1 ? '' : 's'}`}
                    </Text>
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
  estado: { fontSize: 12, fontWeight: '600', marginTop: 6 },
  estadoActivo: { color: '#2a7' },
  estadoVencido: { color: '#c00' },
});
