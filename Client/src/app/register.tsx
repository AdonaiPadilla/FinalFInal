import React, { useState } from 'react';
import {
  View,
  TextInput,
  Text,
  StyleSheet,
  Pressable,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { Link } from 'expo-router';
import { useAuth } from '../context/AuthContext';
import {
  validarEmail,
  validarPassword,
  validarNombre,
  validarConfirmacionPassword,
  obtenerMensajeError,
} from '../utils/validation';

type CamposError = {
  nombre?: string;
  email?: string;
  password?: string;
  confirmacion?: string;
  general?: string;
};

export default function RegisterScreen() {
  const [nombre, setNombre] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmacion, setConfirmacion] = useState('');
  const [errores, setErrores] = useState<CamposError>({});
  const [enviando, setEnviando] = useState(false);
  const [mostrarPassword, setMostrarPassword] = useState(false);
  const { registro } = useAuth();

  const validarFormulario = (): boolean => {
    const nuevosErrores: CamposError = {};

    const resNombre = validarNombre(nombre);
    if (!resNombre.valido) nuevosErrores.nombre = resNombre.errores[0];

    const resEmail = validarEmail(email);
    if (!resEmail.valido) nuevosErrores.email = resEmail.errores[0];

    const resPassword = validarPassword(password);
    if (!resPassword.valido) nuevosErrores.password = resPassword.errores[0];

    const resConfirmacion = validarConfirmacionPassword(password, confirmacion);
    if (!resConfirmacion.valido) nuevosErrores.confirmacion = resConfirmacion.errores[0];

    setErrores(nuevosErrores);
    return Object.keys(nuevosErrores).length === 0;
  };

  const manejarRegistro = async () => {
    if (enviando) return;
    setErrores({});

    if (!validarFormulario()) return;

    setEnviando(true);
    try {
      await registro(nombre, email, password);
    } catch (error) {
      setErrores({ general: obtenerMensajeError(error) });
    } finally {
      setEnviando(false);
    }
  };

  const fortalezaPassword = calcularFortaleza(password);

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView contentContainerStyle={styles.contenedor} keyboardShouldPersistTaps="handled">
        <Text style={styles.titulo}>Crear cuenta</Text>

        {errores.general ? (
          <View style={styles.bannerError}>
            <Text style={styles.bannerErrorTexto}>{errores.general}</Text>
          </View>
        ) : null}

        <Text style={styles.etiqueta}>Nombre</Text>
        <TextInput
          style={[styles.input, errores.nombre && styles.inputError]}
          placeholder="Tu nombre completo"
          value={nombre}
          onChangeText={(texto) => {
            setNombre(texto);
            if (errores.nombre) setErrores((prev) => ({ ...prev, nombre: undefined }));
          }}
          autoCapitalize="words"
          textContentType="name"
          editable={!enviando}
          maxLength={60}
        />
        {errores.nombre ? <Text style={styles.textoError}>{errores.nombre}</Text> : null}

        <Text style={styles.etiqueta}>Email</Text>
        <TextInput
          style={[styles.input, errores.email && styles.inputError]}
          placeholder="tu@correo.com"
          value={email}
          onChangeText={(texto) => {
            setEmail(texto);
            if (errores.email) setErrores((prev) => ({ ...prev, email: undefined }));
          }}
          autoCapitalize="none"
          autoCorrect={false}
          keyboardType="email-address"
          textContentType="emailAddress"
          editable={!enviando}
          maxLength={254}
        />
        {errores.email ? <Text style={styles.textoError}>{errores.email}</Text> : null}

        <Text style={styles.etiqueta}>Contraseña</Text>
        <View style={styles.filaPassword}>
          <TextInput
            style={[styles.input, styles.inputPassword, errores.password && styles.inputError]}
            placeholder="Mínimo 8 caracteres"
            value={password}
            onChangeText={(texto) => {
              setPassword(texto);
              if (errores.password) setErrores((prev) => ({ ...prev, password: undefined }));
            }}
            secureTextEntry={!mostrarPassword}
            autoCapitalize="none"
            autoCorrect={false}
            textContentType="newPassword"
            editable={!enviando}
            maxLength={72}
          />
          <Pressable onPress={() => setMostrarPassword((v) => !v)} style={styles.botonOjo}>
            <Text style={styles.botonOjoTexto}>{mostrarPassword ? 'Ocultar' : 'Ver'}</Text>
          </Pressable>
        </View>
        {password.length > 0 && !errores.password ? (
          <View style={styles.barraFortalezaContenedor}>
            <View
              style={[
                styles.barraFortaleza,
                {
                  width: `${fortalezaPassword.porcentaje}%`,
                  backgroundColor: fortalezaPassword.color,
                },
              ]}
            />
          </View>
        ) : null}
        {errores.password ? (
          <Text style={styles.textoError}>{errores.password}</Text>
        ) : (
          <Text style={styles.textoAyuda}>
            Usa mayúsculas, minúsculas, un número y un símbolo.
          </Text>
        )}

        <Text style={styles.etiqueta}>Confirmar contraseña</Text>
        <TextInput
          style={[styles.input, errores.confirmacion && styles.inputError]}
          placeholder="Repite tu contraseña"
          value={confirmacion}
          onChangeText={(texto) => {
            setConfirmacion(texto);
            if (errores.confirmacion) setErrores((prev) => ({ ...prev, confirmacion: undefined }));
          }}
          secureTextEntry={!mostrarPassword}
          autoCapitalize="none"
          autoCorrect={false}
          editable={!enviando}
          maxLength={72}
        />
        {errores.confirmacion ? (
          <Text style={styles.textoError}>{errores.confirmacion}</Text>
        ) : null}

        <Pressable
          style={[styles.boton, enviando && styles.botonDeshabilitado]}
          onPress={manejarRegistro}
          disabled={enviando}
        >
          {enviando ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.botonTexto}>Registrarme</Text>
          )}
        </Pressable>

        <Link href="/" style={styles.link}>
          ¿Ya tienes cuenta? Inicia sesión
        </Link>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

function calcularFortaleza(password: string): { porcentaje: number; color: string } {
  if (!password) return { porcentaje: 0, color: '#D92D20' };

  let puntos = 0;
  if (password.length >= 8) puntos++;
  if (password.length >= 12) puntos++;
  if (/[a-z]/.test(password) && /[A-Z]/.test(password)) puntos++;
  if (/[0-9]/.test(password)) puntos++;
  if (/[^a-zA-Z0-9]/.test(password)) puntos++;

  const porcentaje = Math.min((puntos / 5) * 100, 100);
  let color = '#D92D20';
  if (puntos >= 4) color = '#12B76A';
  else if (puntos >= 2) color = '#F79009';

  return { porcentaje, color };
}

const styles = StyleSheet.create({
  contenedor: { flexGrow: 1, justifyContent: 'center', padding: 24 },
  titulo: { fontSize: 24, fontWeight: 'bold', marginBottom: 24, textAlign: 'center' },
  etiqueta: { fontSize: 13, fontWeight: '600', marginBottom: 6, color: '#333' },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    padding: 12,
    marginBottom: 4,
    backgroundColor: '#fff',
  },
  inputError: { borderColor: '#D92D20' },
  inputPassword: { flex: 1, marginBottom: 0 },
  filaPassword: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  botonOjo: { paddingHorizontal: 10, paddingVertical: 12 },
  botonOjoTexto: { color: '#2563EB', fontWeight: '600', fontSize: 13 },
  barraFortalezaContenedor: {
    height: 4,
    backgroundColor: '#EEE',
    borderRadius: 2,
    marginTop: 6,
    overflow: 'hidden',
  },
  barraFortaleza: { height: 4, borderRadius: 2 },
  textoError: { color: '#D92D20', fontSize: 12, marginBottom: 10, marginTop: 4 },
  textoAyuda: { color: '#888', fontSize: 12, marginBottom: 10, marginTop: 4 },
  bannerError: {
    backgroundColor: '#FEE4E2',
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
  },
  bannerErrorTexto: { color: '#B42318', fontSize: 13 },
  boton: {
    backgroundColor: '#2563EB',
    borderRadius: 8,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 16,
  },
  botonDeshabilitado: { opacity: 0.6 },
  botonTexto: { color: '#fff', fontWeight: '700', fontSize: 16 },
  link: { marginTop: 20, textAlign: 'center', color: '#2563EB' },
});
