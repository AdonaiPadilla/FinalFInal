import React from 'react';
import { View, Text, Button, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';

export default function PanelAdminScreen() {
  const router = useRouter();

  return (
    <View style={styles.contenedor}>
      <Button title="← Volver" onPress={() => router.back()} />
      <Text style={styles.titulo}>Panel de administración</Text>

      <View style={styles.boton}>
        <Button title="+ Agregar libro" onPress={() => router.push('/admin/nuevo-libro')} />
      </View>
      <View style={styles.boton}>
        <Button title="Ver rentas activas" onPress={() => router.push('/admin/rentas')} />
      </View>
      <View style={styles.boton}>
        <Button title="Ver compras" onPress={() => router.push('/admin/compras')} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  contenedor: { flex: 1, padding: 16, paddingTop: 40 },
  titulo: { fontSize: 22, fontWeight: 'bold', marginTop: 20, marginBottom: 24 },
  boton: { marginBottom: 12 },
});