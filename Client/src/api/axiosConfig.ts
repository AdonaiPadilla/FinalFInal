import axios from 'axios';

const API_URL = 'https://api-libros-j8v0.onrender.com/api';

const api = axios.create({
  baseURL: API_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Normaliza errores de red para que la UI siempre reciba algo consistente.
api.interceptors.response.use(
  (respuesta) => respuesta,
  (error) => {
    if (__DEV__) {
      console.warn('[API]', error?.config?.url, error?.message);
    }
    return Promise.reject(error);
  }
);

export default api;
