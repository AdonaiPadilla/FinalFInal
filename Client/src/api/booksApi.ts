import api from './axiosConfig';

export const obtenerLibros = async () => {
  const response = await api.get('/books/libros', { timeout: 5000 });
  return response.data;
};

export const obtenerLibroPorId = async (id: string) => {
  const response = await api.get(`/books/libros/${id}`, { timeout: 5000 });
  return response.data;
};

export const rentarLibro = async (libroId: string) => {
  const response = await api.post('/rentals', { libroId });
  return response.data;
};

export const comprarLibro = async (libroId: string) => {
  const response = await api.post('/purchases', { libroId });
  return response.data;
};

export const crearLibro = async (datos: any) => {
  const response = await api.post('/books', datos);
  return response.data;
};

export const actualizarLibro = async (id: string, datos: any) => {
  const response = await api.put(`/books/${id}`, datos);
  return response.data;
};

export const eliminarLibro = async (id: string) => {
  const response = await api.delete(`/books/${id}`);
  return response.data;
};

export const subirPdf = async (uri: string, name: string) => {
  const formData = new FormData();
  formData.append('pdf', { uri, name, type: 'application/pdf' } as any);

  try {
    const response = await api.post('/books/upload-pdf', formData);
    return response.data.archivoPdf;
  } catch (error) {
    console.error('Error al subir PDF:', error.message);
    if (error.response) {
      console.error('Respuesta del servidor:', error.response.status, error.response.data);
    } else if (error.request) {
      console.error('No hubo respuesta del servidor (problema de red)');
    }
    throw error;
  }
};

//admin
export const obtenerTodasLasRentas = async () => {
  const response = await api.get('/rentals');
  return response.data;
};

export const obtenerTodasLasCompras = async () => {
  const response = await api.get('/purchases');
  return response.data;
};