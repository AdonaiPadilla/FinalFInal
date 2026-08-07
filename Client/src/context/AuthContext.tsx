import React, { createContext, useState, useEffect, useContext } from 'react';
import * as SecureStore from 'expo-secure-store';
import api from '../api/axiosConfig';

const AuthContext = createContext(undefined);

export const AuthProvider = ({ children }) => {
  const [usuario, setUsuario] = useState(null);
  const [token, setToken] = useState(null);
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    const cargarSesion = async () => {
      const tokenGuardado = await SecureStore.getItemAsync('token');
      if (tokenGuardado) {
        setToken(tokenGuardado);
        api.defaults.headers.common['Authorization'] = `Bearer ${tokenGuardado}`;
      }
      setCargando(false);
    };
    cargarSesion();
  }, []);

  const login = async (email, password) => {
    const respuesta = await api.post('/auth/login', { email, password });
    const { token, usuario } = respuesta.data;

    await SecureStore.setItemAsync('token', token);
    api.defaults.headers.common['Authorization'] = `Bearer ${token}`;

    setToken(token);
    setUsuario(usuario);
  };

  const registro = async (nombre, email, password) => {
    const respuesta = await api.post('/auth/register', { nombre, email, password });
    const { token, usuario } = respuesta.data;

    await SecureStore.setItemAsync('token', token);
    api.defaults.headers.common['Authorization'] = `Bearer ${token}`;

    setToken(token);
    setUsuario(usuario);
  };

  const logout = async () => {
    await SecureStore.deleteItemAsync('token');
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