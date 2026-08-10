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
import { Link, useLocalSearchParams } from 'expo-router';
import { useAuth } from '../context/AuthContext';
import {
  validarEmail,
  validarPassword,
  contienePatronSospechoso,
  obtenerMensajeError,
} from '../utils/validation';

export default function LoginScreen() {
  const { emailRegistrado } = useLocalSearchParams<{ emailRegistrado?: string }>();
  const [email, setEmail] = useState(emailRegistrado ?? '');
  const [password, setPassword] = useState('');
  const [errores, setErrores] = useState<{ email?: string; password?: string; general?: string }>({});
  const [enviando, setEnviando] = useState(false);
  const [mostrarPassword, setMostrarPassword] = useState(false);
  const { login } = useAuth();

  const validarFormulario = (): boolean => {
    const nuevosErrores: typeof errores = {};

    const resultadoEmail = validarEmail(email);
    if (!resultadoEmail.valido) {
      nuevosErrores.email = resultadoEmail.errores[0];
    }

    // En login solo pedimos que no venga vacío / con patrones sospechosos;
    // no aplicamos reglas de complejidad (eso es cosa del registro).
    if (!password) {
      nuevosErrores.password = 'La contraseña es obligatoria.';
    } else if (contienePatronSospechoso(password)) {
      nuevosErrores.password = 'La contraseña contiene caracteres no permitidos.';
    }

    setErrores(nuevosErrores);
    return Object.keys(nuevosErrores).length === 0;
  };

  const manejarLogin = async () => {
    if (enviando) return;
    setErrores({});

    if (!validarFormulario()) return;

    setEnviando(true);
    try {
      await login(email, password);
    } catch (error) {
      setErrores({ general: obtenerMensajeError(error) });
    } finally {
      setEnviando(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView contentContainerStyle={styles.contenedor} keyboardShouldPersistTaps="handled">
        <Text style={styles.titulo}>Iniciar sesión</Text>

        {errores.general ? (
          <View style={styles.bannerError}>
            <Text style={styles.bannerErrorTexto}>{errores.general}</Text>
          </View>
        ) : null}

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
            placeholder="••••••••"
            value={password}
            onChangeText={(texto) => {
              setPassword(texto);
              if (errores.password) setErrores((prev) => ({ ...prev, password: undefined }));
            }}
            secureTextEntry={!mostrarPassword}
            autoCapitalize="none"
            autoCorrect={false}
            textContentType="password"
            editable={!enviando}
            maxLength={72}
          />
          <Pressable onPress={() => setMostrarPassword((v) => !v)} style={styles.botonOjo}>
            <Text style={styles.botonOjoTexto}>{mostrarPassword ? 'Ocultar' : 'Ver'}</Text>
          </Pressable>
        </View>
        {errores.password ? <Text style={styles.textoError}>{errores.password}</Text> : null}

        <Pressable
          style={[styles.boton, enviando && styles.botonDeshabilitado]}
          onPress={manejarLogin}
          disabled={enviando}
        >
          {enviando ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.botonTexto}>Entrar</Text>
          )}
        </Pressable>

        <Link href="/register" style={styles.link}>
          ¿No tienes cuenta? Regístrate
        </Link>
      </ScrollView>
    </KeyboardAvoidingView>
  );
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
  textoError: { color: '#D92D20', fontSize: 12, marginBottom: 10, marginTop: 2 },
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
