import React, { useState, useCallback } from 'react';
import { View, Text, FlatList, StyleSheet, ActivityIndicator, Button, Alert } from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { obtenerTodosLosUsuarios, eliminarUsuario } from '../../api/booksApi';
import { useAuth } from '../../context/AuthContext';

export default function UsuariosAdminScreen() {
  const router = useRouter();
  const { usuario: usuarioActual } = useAuth();
  const [usuarios, setUsuarios] = useState<any[]>([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const cargarUsuarios = useCallback(async () => {
    try {
      const data = await obtenerTodosLosUsuarios();
      setUsuarios(data);
      setError(null);
    } catch (err: any) {
      const mensaje = err.response?.data?.message || 'No se pudo cargar la lista de usuarios';
      setError(mensaje);
      console.error('Error al cargar usuarios:', err);
    } finally {
      setCargando(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      cargarUsuarios();
    }, [cargarUsuarios])
  );

  const confirmarEliminacion = (usuario: any) => {
    Alert.alert(
      'Desactivar usuario',
      `¿Deseas desactivar a ${usuario.nombre}?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Desactivar',
          style: 'destructive',
          onPress: async () => {
            try {
              await eliminarUsuario(usuario._id);
              await cargarUsuarios();
            } catch (err: any) {
              const mensaje = err.response?.data?.message || 'No se pudo desactivar el usuario';
              Alert.alert('Error', mensaje);
            }
          },
        },
      ]
    );
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
      <Text style={styles.titulo}>Usuarios ({usuarios.length})</Text>

      {error ? <Text style={styles.error}>{error}</Text> : null}

      <FlatList
        data={usuarios}
        keyExtractor={(item) => item._id}
        renderItem={({ item }) => {
          const esUnoMismo = item._id === usuarioActual?.id;
          const esOtroAdmin = item.rol === 'admin' && !esUnoMismo;
          const puedeDesactivar = item.activo && !esUnoMismo && !esOtroAdmin;

          return (
            <View style={styles.fila}>
              <Text style={styles.nombre}>{item.nombre}{esUnoMismo ? ' (tú)' : ''}</Text>
              <Text style={styles.detalle}>Email: {item.email}</Text>
              <Text style={styles.detalle}>Rol: {item.rol}</Text>
              <Text style={styles.detalle}>Estado: {item.activo ? 'Activo' : 'Desactivado'}</Text>
              {!esUnoMismo && !esOtroAdmin ? (
                <View style={styles.botonAccion}>
                  <Button
                    title={item.activo ? 'Desactivar' : 'Desactivado'}
                    onPress={() => confirmarEliminacion(item)}
                    disabled={!puedeDesactivar}
                  />
                </View>
              ) : null}
            </View>
          );
        }}
        ListEmptyComponent={<Text style={styles.vacio}>No hay usuarios registrados</Text>}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  contenedor: { flex: 1, padding: 16, paddingTop: 40 },
  centrado: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  titulo: { fontSize: 20, fontWeight: 'bold', marginTop: 16, marginBottom: 16 },
  fila: { borderBottomWidth: 1, borderBottomColor: '#eee', paddingVertical: 12 },
  nombre: { fontSize: 15, fontWeight: '600' },
  detalle: { fontSize: 13, color: '#666', marginTop: 2 },
  botonAccion: { marginTop: 8 },
  vacio: { textAlign: 'center', color: '#999', marginTop: 40 },
  error: { color: '#c00', marginBottom: 12, fontSize: 13 },
});
