import React from 'react';
import { View, Text, Button, StyleSheet } from 'react-native';
import { router } from 'expo-router';
import { useAuth } from '../context/AuthContext';
import CatalogoLibros from '../components/CatalogoLibros';

export default function HomeScreen() {
  const { usuario, logout } = useAuth();

  return (
    <View style={styles.contenedor}>
      <View style={styles.encabezado}>
        <Text style={styles.titulo}>¡Bienvenido, {usuario?.nombre}!</Text>
        <Button title="Cerrar sesión" onPress={logout} color="red" />
        {usuario?.rol === 'admin' || usuario?.rol === 'gerente' ? (
        <Button title="Panel Admin" onPress={() => router.push('/admin')} />        ) : null}
      </View>
      <CatalogoLibros />
    </View>
  );
}

const styles = StyleSheet.create({
  contenedor: { flex: 1, paddingTop: 50 },
  encabezado: { paddingHorizontal: 16, marginBottom: 16 },
  titulo: { fontSize: 20, fontWeight: 'bold', marginBottom: 12 },
});