import React, { useState, useCallback } from 'react';
import { View, Text, FlatList, StyleSheet, ActivityIndicator, Button } from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { obtenerTodasLasCompras } from '../../api/booksApi';

export default function ComprasAdminScreen() {
  const router = useRouter();
  const [compras, setCompras] = useState([]);
  const [cargando, setCargando] = useState(true);

  useFocusEffect(
    useCallback(() => {
      const cargar = async () => {
        try {
          const data = await obtenerTodasLasCompras();
          setCompras(data);
        } catch (error) {
          console.error('Error al cargar compras:', error);
        } finally {
          setCargando(false);
        }
      };
      cargar();
    }, [])
  );

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
      <Text style={styles.titulo}>Compras ({compras.length})</Text>

      <FlatList
        data={compras}
        keyExtractor={(item) => item._id}
        renderItem={({ item }) => (
          <View style={styles.fila}>
            <Text style={styles.tituloLibro}>{item.libro?.titulo || 'Libro eliminado'}</Text>
            <Text style={styles.detalle}>Usuario: {item.usuario?.nombre} ({item.usuario?.email})</Text>
            <Text style={styles.detalle}>${item.precioPagado} — {new Date(item.createdAt).toLocaleDateString()}</Text>
          </View>
        )}
        ListEmptyComponent={<Text style={styles.vacio}>No hay compras registradas</Text>}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  contenedor: { flex: 1, padding: 16, paddingTop: 40 },
  centrado: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  titulo: { fontSize: 20, fontWeight: 'bold', marginTop: 16, marginBottom: 16 },
  fila: { borderBottomWidth: 1, borderBottomColor: '#eee', paddingVertical: 12 },
  tituloLibro: { fontSize: 15, fontWeight: '600' },
  detalle: { fontSize: 13, color: '#666', marginTop: 2 },
  vacio: { textAlign: 'center', color: '#999', marginTop: 40 },
});