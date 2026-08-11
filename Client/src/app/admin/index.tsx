import React from 'react';
import { View, Text, Button, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '../../context/AuthContext';

export default function PanelAdminScreen() {
  const router = useRouter();
  const { usuario } = useAuth();
  const esGerente = usuario?.rol === 'gerente';

  return (
    <View style={styles.contenedor}>
      <Button title="← Volver" onPress={() => router.back()} />
      <Text style={styles.titulo}>{esGerente ? 'Panel de gerente' : 'Panel de administración'}</Text>
      {esGerente ? (
        <Text style={styles.subtitulo}>Puedes gestionar libros y revisar movimientos, pero no se muestran reportes de ingresos.</Text>
      ) : null}

      <View style={styles.boton}>
        <Button title="+ Agregar libro" onPress={() => router.push('/admin/nuevo-libro')} />
      </View>
      <View style={styles.boton}>
        <Button title="Ver rentas activas" onPress={() => router.push('/admin/rentas')} />
      </View>
      <View style={styles.boton}>
        <Button title="Ver compras" onPress={() => router.push('/admin/compras')} />
      </View>
      <View style={styles.boton}>
        <Button title="Gestionar usuarios" onPress={() => router.push('/admin/usuarios')} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  contenedor: { flex: 1, padding: 16, paddingTop: 40 },
  titulo: { fontSize: 22, fontWeight: 'bold', marginTop: 20, marginBottom: 12 },
  subtitulo: { fontSize: 14, color: '#666', marginBottom: 20 },
  boton: { marginBottom: 12 },
});