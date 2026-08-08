import React, { createContext, useState, useEffect, useContext } from 'react';
import * as SecureStore from 'expo-secure-store';
import api from '../api/axiosConfig';
import { limpiarTexto } from '../utils/validation';

interface Usuario {
  id?: string;
  nombre: string;
  email: string;
  rol?: string;
  [key: string]: any;
}

interface AuthContextType {
  usuario: Usuario | null;
  token: string | null;
  cargando: boolean;
  login: (email: string, password: string) => Promise<void>;
  registro: (nombre: string, email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [usuario, setUsuario] = useState<Usuario | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    const cargarSesion = async () => {
      try {
        const tokenGuardado = await SecureStore.getItemAsync('token');
        const usuarioGuardado = await SecureStore.getItemAsync('usuario');

        if (tokenGuardado) {
          setToken(tokenGuardado);
          api.defaults.headers.common['Authorization'] = `Bearer ${tokenGuardado}`;
        }

        if (usuarioGuardado) {
          setUsuario(JSON.parse(usuarioGuardado));
        }
      } catch (error) {
        console.error('Error al cargar la sesión:', error);
        // Si algo está corrupto, no dejamos el estado a medias.
        await SecureStore.deleteItemAsync('token').catch(() => { });
        await SecureStore.deleteItemAsync('usuario').catch(() => { });
      } finally {
        setCargando(false);
      }
    };
    cargarSesion();
  }, []);

  const guardarSesion = async (nuevoToken: string, nuevoUsuario: Usuario) => {
    await SecureStore.setItemAsync('token', nuevoToken);
    await SecureStore.setItemAsync('usuario', JSON.stringify(nuevoUsuario));
    api.defaults.headers.common['Authorization'] = `Bearer ${nuevoToken}`;
    setToken(nuevoToken);
    setUsuario(nuevoUsuario);
  };

  const login = async (email: string, password: string) => {
    // Nunca confiamos en el input tal cual: se limpia antes de enviarlo.
    const emailLimpio = limpiarTexto(email).toLowerCase();

    if (!emailLimpio || !password) {
      throw new Error('Correo y contraseña son obligatorios.');
    }

    const respuesta = await api.post('/auth/login', {
      email: emailLimpio,
      password,
    });
    const { token: nuevoToken, usuario: nuevoUsuario } = respuesta.data;

    if (!nuevoToken || !nuevoUsuario) {
      throw new Error('Respuesta inválida del servidor.');
    }

    await guardarSesion(nuevoToken, nuevoUsuario);
  };

  const registro = async (nombre: string, email: string, password: string) => {
    const nombreLimpio = limpiarTexto(nombre);
    const emailLimpio = limpiarTexto(email).toLowerCase();

    if (!nombreLimpio || !emailLimpio || !password) {
      throw new Error('Todos los campos son obligatorios.');
    }

    const respuesta = await api.post('/auth/register', {
      nombre: nombreLimpio,
      email: emailLimpio,
      password,
    });
    const { token: nuevoToken, usuario: nuevoUsuario } = respuesta.data;

    if (!nuevoToken || !nuevoUsuario) {
      throw new Error('Respuesta inválida del servidor.');
    }

    await guardarSesion(nuevoToken, nuevoUsuario);
  };

  const logout = async () => {
    await SecureStore.deleteItemAsync('token');
    await SecureStore.deleteItemAsync('usuario');
    delete api.defaults.headers.common['Authorization'];
    setToken(null);
    setUsuario(null);
  };

  return (
    <AuthContext.Provider value={{ usuario, token, cargando, login, registro, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth debe usarse dentro de un AuthProvider');
  return context;
};
