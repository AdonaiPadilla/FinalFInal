import React from 'react';
import { View, Text, Button, StyleSheet } from 'react-native';
import { router } from 'expo-router';
import { useAuth } from '../context/AuthContext';
import CatalogoLibros from '../components/CatalogoLibros';

export default function HomeScreen() {
  const { usuario, logout } = useAuth();
  const esGerente = usuario?.rol === 'gerente';

  return (
    <View style={styles.contenedor}>
      <View style={styles.encabezado}>
        <Text style={styles.titulo}>¡Bienvenido, {usuario?.nombre}!</Text>
        <Button title="Cerrar sesión" onPress={logout} color="red" />
        <View style={styles.filaBotones}>
          <View style={styles.botonMitad}>
            <Button title="Mis rentas" onPress={() => router.push('/biblioteca/rentas')} />
          </View>
          <View style={[styles.botonMitad, styles.botonSeparado]}>
            <Button title="Mis compras" onPress={() => router.push('/biblioteca/compras')} />
          </View>
        </View>
        {usuario?.rol === 'admin' || usuario?.rol === 'gerente' ? (
          <View style={styles.panelAdminContainer}>
            <Button title={esGerente ? 'Panel Gerente' : 'Panel Admin'} onPress={() => router.push('/admin')} />
          </View>
        ) : null}
      </View>
      <CatalogoLibros />
    </View>
  );
}

const styles = StyleSheet.create({
  contenedor: { flex: 1, paddingTop: 50 },
  encabezado: { paddingHorizontal: 16, marginBottom: 16 },
  titulo: { fontSize: 20, fontWeight: 'bold', marginBottom: 12 },
  filaBotones: { flexDirection: 'row', gap: 10, marginTop: 10 },
  botonMitad: { flex: 1 },
  botonSeparado: { marginLeft: 8 },
  panelAdminContainer: { marginTop: 12 },
});