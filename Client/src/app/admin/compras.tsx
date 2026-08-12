import React, { useState, useCallback } from 'react';
import { View, Text, FlatList, StyleSheet, ActivityIndicator, Button, Alert } from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { obtenerTodasLasCompras, eliminarCompra } from '../../api/booksApi';
import { useAuth } from '../../context/AuthContext';

export default function ComprasAdminScreen() {
  const router = useRouter();
  const { usuario } = useAuth();
  const [compras, setCompras] = useState([]);
  const [cargando, setCargando] = useState(true);
  const esGerente = usuario?.rol === 'gerente';
  const esAdmin = usuario?.rol === 'admin' || usuario?.rol === 'gerente';
  const totalGanado = compras.reduce((sum, item) => sum + Number(item.precioPagado || 0), 0);

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

  const manejarEliminar = async (id: string) => {
    Alert.alert('Confirmar', '¿Eliminar esta compra permanentemente?', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Eliminar',
        style: 'destructive',
        onPress: async () => {
          try {
            await eliminarCompra(id);
            const data = await obtenerTodasLasCompras();
            setCompras(data);
          } catch (error) {
            console.error('Error al eliminar compra:', error);
            Alert.alert('Error', error.response?.data?.message || 'No se pudo eliminar la compra');
          }
        },
      },
    ]);
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
      <Text style={styles.titulo}>Compras ({compras.length})</Text>
      {!esGerente ? <Text style={styles.total}>Total ganado: ${totalGanado.toFixed(2)}</Text> : null}

      <FlatList
        data={compras}
        keyExtractor={(item) => item._id}
        renderItem={({ item }) => (
          <View style={styles.fila}>
            <Text style={styles.tituloLibro}>{item.libro?.titulo || 'Libro eliminado'}</Text>
            <Text style={styles.detalle}>Usuario: {item.usuario?.nombre} ({item.usuario?.email})</Text>
            <Text style={styles.detalle}>${item.precioPagado} — {new Date(item.createdAt).toLocaleDateString()}</Text>
            {esAdmin ? (
              <View style={{ marginTop: 8 }}>
                <Button title="Eliminar" color="#c00" onPress={() => manejarEliminar(item._id)} />
              </View>
            ) : null}
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
  titulo: { fontSize: 20, fontWeight: 'bold', marginTop: 16, marginBottom: 8 },
  total: { fontSize: 15, fontWeight: '600', color: '#2a7', marginBottom: 16 },
  fila: { borderBottomWidth: 1, borderBottomColor: '#eee', paddingVertical: 12 },
  tituloLibro: { fontSize: 15, fontWeight: '600' },
  detalle: { fontSize: 13, color: '#666', marginTop: 2 },
  vacio: { textAlign: 'center', color: '#999', marginTop: 40 },
});