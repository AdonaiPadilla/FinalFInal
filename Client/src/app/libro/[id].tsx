import React, { useEffect, useState } from 'react';
import { View, Text, Image, StyleSheet, ActivityIndicator, ScrollView, Button, Alert } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { obtenerLibroPorId, rentarLibro, comprarLibro } from '../../api/booksApi';

export default function DetalleLibroScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const [libro, setLibro] = useState(null);
  const [cargando, setCargando] = useState(true);
  const [procesando, setProcesando] = useState(false);

  const cargar = async () => {
    try {
      const data = await obtenerLibroPorId(id as string);
      setLibro(data);
    } catch (error) {
      Alert.alert('Error', 'No se pudo cargar el libro');
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => {
    cargar();
  }, [id]);

  const manejarRentar = async () => {
    setProcesando(true);
    try {
      await rentarLibro(id as string);
      Alert.alert('Listo', 'Libro rentado correctamente');
      await cargar();
    } catch (error) {
      const mensaje = error.response?.data?.message || 'No se pudo rentar el libro';
      Alert.alert('Error', mensaje);
    } finally {
      setProcesando(false);
    }
  };

  const manejarComprar = async () => {
    setProcesando(true);
    try {
      await comprarLibro(id as string);
      Alert.alert('Listo', 'Compra realizada correctamente');
    } catch (error) {
      const mensaje = error.response?.data?.message || 'No se pudo comprar el libro';
      Alert.alert('Error', mensaje);
    } finally {
      setProcesando(false);
    }
  };

  if (cargando) {
    return (
      <View style={styles.centrado}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  if (!libro) {
    return (
      <View style={styles.centrado}>
        <Text>No se encontró el libro</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.contenedor}>
      <Button title="← Volver" onPress={() => router.back()} />

      {libro.portada ? (
        <Image source={{ uri: libro.portada }} style={styles.portada} />
      ) : (
        <View style={[styles.portada, styles.sinPortada]}>
          <Text style={styles.iconoLibro}>📖</Text>
        </View>
      )}

      <Text style={styles.titulo}>{libro.titulo}</Text>
      <Text style={styles.autor}>{libro.autor}</Text>
      <Text style={styles.categoria}>{libro.categoria}</Text>

      {!libro.disponible ? (
        <View style={styles.badgeOcupado}>
          <Text style={styles.textoOcupado}>Actualmente rentado</Text>
        </View>
      ) : null}

      {libro.descripcion ? (
        <Text style={styles.descripcion}>{libro.descripcion}</Text>
      ) : null}

      <View style={styles.infoFila}>
        <Text style={styles.infoTexto}>{libro.totalPaginas} páginas</Text>
        <Text style={styles.infoTexto}>Renta: {libro.duracionRentaDias} días</Text>
      </View>

      <View style={styles.precios}>
        <View style={styles.precioBox}>
          <Text style={styles.precioLabel}>Renta</Text>
          <Text style={styles.precioValor}>${libro.precioRenta}</Text>
        </View>
        <View style={styles.precioBox}>
          <Text style={styles.precioLabel}>Compra</Text>
          <Text style={styles.precioValor}>${libro.precioCompra}</Text>
        </View>
      </View>

      <View style={styles.botones}>
        <Button
          title={libro.disponible ? 'Rentar' : 'No disponible'}
          onPress={manejarRentar}
          disabled={!libro.disponible || procesando}
        />
        <View style={{ height: 10 }} />
        <Button title="Comprar" color="#2a7" onPress={manejarComprar} disabled={procesando} />
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  contenedor: { flex: 1, padding: 16 },
  centrado: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  portada: { width: '100%', height: 260, borderRadius: 8, backgroundColor: '#eee', marginTop: 16 },
  sinPortada: { justifyContent: 'center', alignItems: 'center' },
  iconoLibro: { fontSize: 60 },
  titulo: { fontSize: 22, fontWeight: 'bold', marginTop: 16 },
  autor: { fontSize: 16, color: '#666', marginTop: 4 },
  categoria: { fontSize: 13, color: '#2a7', marginTop: 4, fontWeight: '600' },
  badgeOcupado: { backgroundColor: '#ffe0e0', borderRadius: 6, padding: 8, marginTop: 10, alignSelf: 'flex-start' },
  textoOcupado: { color: '#c00', fontWeight: '600', fontSize: 12 },
  descripcion: { fontSize: 14, marginTop: 16, lineHeight: 20 },
  infoFila: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 16 },
  infoTexto: { fontSize: 13, color: '#666' },
  precios: { flexDirection: 'row', marginTop: 20, gap: 12 },
  precioBox: { flex: 1, backgroundColor: '#f5f5f5', borderRadius: 8, padding: 12, alignItems: 'center' },
  precioLabel: { fontSize: 12, color: '#666' },
  precioValor: { fontSize: 20, fontWeight: 'bold', marginTop: 4 },
  botones: { marginTop: 24, marginBottom: 40 },
});