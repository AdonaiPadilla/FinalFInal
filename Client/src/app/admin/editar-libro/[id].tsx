import React, { useEffect, useState } from 'react';
import { View, Text, TextInput, Button, StyleSheet, ScrollView, Alert, ActivityIndicator } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { obtenerLibroPorId, actualizarLibro, eliminarLibro } from '../../../api/booksApi';
import { useAuth } from '../../../context/AuthContext';

export default function EditarLibroScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams();
  const { usuario } = useAuth();
  const esAdmin = usuario?.rol === 'admin';
  const [cargando, setCargando] = useState(true);
  const [guardando, setGuardando] = useState(false);

  const [titulo, setTitulo] = useState('');
  const [autor, setAutor] = useState('');
  const [descripcion, setDescripcion] = useState('');
  const [categoria, setCategoria] = useState('');
  const [precioCompra, setPrecioCompra] = useState('');
  const [precioRenta, setPrecioRenta] = useState('');
  const [totalPaginas, setTotalPaginas] = useState('');
  const [duracionRentaDias, setDuracionRentaDias] = useState('');
  const [portada, setPortada] = useState('');

  useEffect(() => {
    const cargar = async () => {
      try {
        const libro = await obtenerLibroPorId(id as string);
        setTitulo(libro.titulo || '');
        setAutor(libro.autor || '');
        setDescripcion(libro.descripcion || '');
        setCategoria(libro.categoria || '');
        setPrecioCompra(String(libro.precioCompra ?? ''));
        setPrecioRenta(String(libro.precioRenta ?? ''));
        setTotalPaginas(String(libro.totalPaginas ?? ''));
        setDuracionRentaDias(String(libro.duracionRentaDias ?? ''));
        setPortada(libro.portada || '');
      } catch (error) {
        Alert.alert('Error', 'No se pudo cargar el libro');
      } finally {
        setCargando(false);
      }
    };
    cargar();
  }, [id]);

  const manejarGuardar = async () => {
    setGuardando(true);
    try {
      const datosActualizar: any = {
        titulo,
        autor,
        descripcion,
        categoria,
        totalPaginas: Number(totalPaginas),
        duracionRentaDias: Number(duracionRentaDias),
        portada,
      };

      if (esAdmin) {
        datosActualizar.precioCompra = Number(precioCompra);
        datosActualizar.precioRenta = Number(precioRenta);
      }

      await actualizarLibro(id as string, datosActualizar);
      Alert.alert('Listo', 'Libro actualizado');
      router.back();
    } catch (error) {
      const mensaje = error.response?.data?.message || 'No se pudo actualizar el libro';
      Alert.alert('Error', mensaje);
    } finally {
      setGuardando(false);
    }
  };

  const manejarEliminar = () => {
    Alert.alert('Confirmar', '¿Eliminar este libro?', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Eliminar',
        style: 'destructive',
        onPress: async () => {
          try {
            await eliminarLibro(id as string);
            Alert.alert('Listo', 'Libro eliminado');
            router.back();
          } catch (error) {
            Alert.alert('Error', 'No se pudo eliminar el libro');
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
    <ScrollView style={styles.contenedor}>
      <Button title="← Volver" onPress={() => router.back()} />
      <Text style={styles.tituloPantalla}>Editar libro</Text>

      <Text style={styles.label}>Título</Text>
      <TextInput style={styles.input} value={titulo} onChangeText={setTitulo} />

      <Text style={styles.label}>Autor</Text>
      <TextInput style={styles.input} value={autor} onChangeText={setAutor} />

      <Text style={styles.label}>Categoría</Text>
      <TextInput style={styles.input} value={categoria} onChangeText={setCategoria} />

      <Text style={styles.label}>Descripción</Text>
      <TextInput style={styles.input} value={descripcion} onChangeText={setDescripcion} multiline />

      {esAdmin ? (
        <>
          <Text style={styles.label}>Precio de compra</Text>
          <TextInput style={styles.input} value={precioCompra} onChangeText={setPrecioCompra} keyboardType="numeric" />

          <Text style={styles.label}>Precio de renta</Text>
          <TextInput style={styles.input} value={precioRenta} onChangeText={setPrecioRenta} keyboardType="numeric" />
        </>
      ) : null}

      <Text style={styles.label}>Total de páginas</Text>
      <TextInput style={styles.input} value={totalPaginas} onChangeText={setTotalPaginas} keyboardType="numeric" />

      <Text style={styles.label}>Duración de renta (días)</Text>
      <TextInput style={styles.input} value={duracionRentaDias} onChangeText={setDuracionRentaDias} keyboardType="numeric" />

      <Text style={styles.label}>URL de portada</Text>
      <TextInput style={styles.input} value={portada} onChangeText={setPortada} />

      <View style={{ marginTop: 20 }}>
        <Button title={guardando ? 'Guardando...' : 'Guardar cambios'} onPress={manejarGuardar} disabled={guardando} />
      </View>
      <View style={{ marginTop: 10, marginBottom: 40 }}>
        <Button title="Eliminar libro" color="#c00" onPress={manejarEliminar} />
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  contenedor: { flex: 1, padding: 16 },
  centrado: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  tituloPantalla: { fontSize: 20, fontWeight: 'bold', marginTop: 16, marginBottom: 16 },
  label: { fontSize: 13, fontWeight: '600', marginTop: 12, marginBottom: 4, color: '#444' },
  input: { borderWidth: 1, borderColor: '#ccc', borderRadius: 8, padding: 10 },
});