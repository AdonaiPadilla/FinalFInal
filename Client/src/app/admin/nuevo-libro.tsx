import React, { useState } from 'react';
import { View, Text, TextInput, Button, StyleSheet, ScrollView, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import * as DocumentPicker from 'expo-document-picker';
import { crearLibro, subirPdf } from '../../api/booksApi';

export default function NuevoLibroScreen() {
  const router = useRouter();
  const [titulo, setTitulo] = useState('');
  const [autor, setAutor] = useState('');
  const [descripcion, setDescripcion] = useState('');
  const [categoria, setCategoria] = useState('');
  const [precioCompra, setPrecioCompra] = useState('');
  const [precioRenta, setPrecioRenta] = useState('');
  const [totalPaginas, setTotalPaginas] = useState('');
  const [duracionRentaDias, setDuracionRentaDias] = useState('7');
  const [archivoPdf, setArchivoPdf] = useState('');
  const [portada, setPortada] = useState('');
  const [guardando, setGuardando] = useState(false);
  const [subiendoPdf, setSubiendoPdf] = useState(false);

  const seleccionarPdf = async () => {
    const resultado = await DocumentPicker.getDocumentAsync({ type: 'application/pdf' });
    if (resultado.canceled) return;
    const archivo = resultado.assets[0];
    setSubiendoPdf(true);
    try {
      const ruta = await subirPdf(archivo.uri, archivo.name);
      setArchivoPdf(ruta);
    } catch (error) {
      Alert.alert('Error', 'No se pudo subir el PDF');
    } finally {
      setSubiendoPdf(false);
    }
  };

  const manejarGuardar = async () => {
    if (!titulo || !autor || !categoria || !archivoPdf || !precioCompra || !precioRenta || !totalPaginas) {
      Alert.alert('Faltan datos', 'Completa todos los campos obligatorios');
      return;
    }

    setGuardando(true);
    try {
      await crearLibro({
        titulo,
        autor,
        descripcion,
        categoria,
        precioCompra: Number(precioCompra),
        precioRenta: Number(precioRenta),
        totalPaginas: Number(totalPaginas),
        duracionRentaDias: Number(duracionRentaDias),
        archivoPdf,
        portada,
      });
      Alert.alert('Listo', 'Libro creado correctamente');
      router.back();
    } catch (error) {
      const mensaje = error.response?.data?.message || 'No se pudo crear el libro';
      Alert.alert('Error', mensaje);
    } finally {
      setGuardando(false);
    }
  };

  return (
    <ScrollView style={styles.contenedor}>
      <Button title="← Volver" onPress={() => router.back()} />
      <Text style={styles.tituloPantalla}>Agregar libro</Text>

      <Text style={styles.label}>Título *</Text>
      <TextInput style={styles.input} value={titulo} onChangeText={setTitulo} />

      <Text style={styles.label}>Autor *</Text>
      <TextInput style={styles.input} value={autor} onChangeText={setAutor} />

      <Text style={styles.label}>Categoría *</Text>
      <TextInput style={styles.input} value={categoria} onChangeText={setCategoria} />

      <Text style={styles.label}>Descripción</Text>
      <TextInput style={styles.input} value={descripcion} onChangeText={setDescripcion} multiline />

      <Text style={styles.label}>Precio de compra *</Text>
      <TextInput style={styles.input} value={precioCompra} onChangeText={setPrecioCompra} keyboardType="numeric" />

      <Text style={styles.label}>Precio de renta *</Text>
      <TextInput style={styles.input} value={precioRenta} onChangeText={setPrecioRenta} keyboardType="numeric" />

      <Text style={styles.label}>Total de páginas *</Text>
      <TextInput style={styles.input} value={totalPaginas} onChangeText={setTotalPaginas} keyboardType="numeric" />

      <Text style={styles.label}>Duración de renta (días)</Text>
      <TextInput style={styles.input} value={duracionRentaDias} onChangeText={setDuracionRentaDias} keyboardType="numeric" />

      <Text style={styles.label}>Archivo PDF *</Text>
      <Button
        title={subiendoPdf ? 'Subiendo...' : archivoPdf ? 'Cambiar PDF' : 'Seleccionar PDF'}
        onPress={seleccionarPdf}
        disabled={subiendoPdf}
      />
      {archivoPdf ? <Text style={{ marginTop: 6, color: '#666' }}>{archivoPdf}</Text> : null}

      <Text style={styles.label}>URL de portada</Text>
      <TextInput style={styles.input} value={portada} onChangeText={setPortada} />

      <View style={{ marginTop: 20, marginBottom: 40 }}>
        <Button title={guardando ? 'Guardando...' : 'Guardar libro'} onPress={manejarGuardar} disabled={guardando} />
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  contenedor: { flex: 1, padding: 16 },
  tituloPantalla: { fontSize: 20, fontWeight: 'bold', marginTop: 16, marginBottom: 16 },
  label: { fontSize: 13, fontWeight: '600', marginTop: 12, marginBottom: 4, color: '#444' },
  input: { borderWidth: 1, borderColor: '#ccc', borderRadius: 8, padding: 10 },
});