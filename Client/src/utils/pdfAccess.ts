import * as FileSystem from 'expo-file-system/legacy';

interface ResultadoDescarga {
  uri: string;
}

// Lee el cuerpo de una respuesta de error (el servidor manda JSON tipo
// { message: '...' }) que quedó escrito en el archivo local, para poder
// mostrarle al usuario el motivo real (ej. "primero debes comprarlo")
// en vez de un error genérico.
const leerMensajeError = async (uriLocal: string): Promise<string> => {
  try {
    const contenido = await FileSystem.readAsStringAsync(uriLocal);
    const data = JSON.parse(contenido);
    return data?.message || 'No se pudo acceder al archivo';
  } catch {
    return 'No se pudo acceder al archivo';
  } finally {
    await FileSystem.deleteAsync(uriLocal, { idempotent: true });
  }
};

// Descarga un PDF protegido (endpoint /leer o /download) mandando el
// token en el header Authorization -- necesario porque Linking.openURL
// o un <a href> normal no pueden mandar headers personalizados.
export const descargarPdfProtegido = async (
  url: string,
  token: string,
  nombreArchivo: string,
  carpeta: string = FileSystem.cacheDirectory || ''
): Promise<ResultadoDescarga> => {
  const destino = `${carpeta}${nombreArchivo}`;

  const resultado = await FileSystem.downloadAsync(url, destino, {
    headers: { Authorization: `Bearer ${token}` },
  });

  if (resultado.status !== 200) {
    const mensaje = await leerMensajeError(resultado.uri);
    throw new Error(mensaje);
  }

  return { uri: resultado.uri };
};
