import React, { useState, useCallback } from 'react';
import { View, Text, FlatList, StyleSheet, ActivityIndicator, Button, Alert } from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { obtenerTodasLasRentas, eliminarRenta } from '../../api/booksApi';
import { useAuth } from '../../context/AuthContext';

export default function RentasAdminScreen() {
  const router = useRouter();
  const { usuario } = useAuth();
  const [rentas, setRentas] = useState([]);
  const [cargando, setCargando] = useState(true);
  const esGerente = usuario?.rol === 'gerente';
  const esAdmin = usuario?.rol === 'admin' || usuario?.rol === 'gerente';
  const totalGanado = rentas.reduce((sum, item) => sum + Number(item.precioRenta || 0), 0);

  useFocusEffect(
    useCallback(() => {
      const cargar = async () => {
        try {
          const data = await obtenerTodasLasRentas();
          setRentas(data);
        } catch (error) {
          console.error('Error al cargar rentas:', error);
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
      <Text style={styles.titulo}>Rentas ({rentas.length})</Text>
      {!esGerente ? <Text style={styles.total}>Total ganado: ${totalGanado.toFixed(2)}</Text> : null}

      <FlatList
        data={rentas}
        keyExtractor={(item) => item._id}
        renderItem={({ item }) => {
          const activa = item.activa && new Date(item.fechaFin) >= new Date();
          return (
            <View style={styles.fila}>
              <Text style={styles.tituloLibro}>{item.libro?.titulo || 'Libro eliminado'}</Text>
              <Text style={styles.detalle}>Usuario: {item.usuario?.nombre} ({item.usuario?.email})</Text>
              <Text style={styles.detalle}>
                Del {new Date(item.fechaInicio).toLocaleDateString()} al {new Date(item.fechaFin).toLocaleDateString()}
              </Text>
              <Text style={styles.detalle}>Precio: ${Number(item.precioRenta || 0).toFixed(2)}</Text>
              <Text style={[styles.estado, activa ? styles.activa : styles.vencida]}>
                {activa ? 'Activa' : 'Vencida'}
              </Text>
              {esAdmin ? (
                <View style={{ marginTop: 8 }}>
                  <Button title="Eliminar" color="#c00" onPress={() => {
                    Alert.alert('Confirmar', '¿Eliminar esta renta? Esto revocará el acceso.', [
                      { text: 'Cancelar', style: 'cancel' },
                      { text: 'Eliminar', style: 'destructive', onPress: async () => {
                        try {
                          await eliminarRenta(item._id);
                          const data = await obtenerTodasLasRentas();
                          setRentas(data);
                        } catch (error) {
                          console.error('Error al eliminar renta:', error);
                          Alert.alert('Error', error.response?.data?.message || 'No se pudo eliminar la renta');
                        }
                      } }
                    ]);
                  }} />
                </View>
              ) : null}
            </View>
          );
        }}
        ListEmptyComponent={<Text style={styles.vacio}>No hay rentas registradas</Text>}
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
  estado: { fontSize: 12, fontWeight: 'bold', marginTop: 4 },
  activa: { color: '#2a7' },
  vencida: { color: '#c00' },
  vacio: { textAlign: 'center', color: '#999', marginTop: 40 },
});