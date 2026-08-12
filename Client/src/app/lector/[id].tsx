import React, { useEffect, useRef, useState } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, Button } from 'react-native';
import { WebView } from 'react-native-webview';
import { useLocalSearchParams, useRouter } from 'expo-router';
import * as FileSystem from 'expo-file-system/legacy';
import { useAuth } from '../../context/AuthContext';
import { obtenerUrlLecturaPdf } from '../../api/booksApi';
import { descargarPdfProtegido } from '../../utils/pdfAccess';

// El WebView de Android no trae un visor de PDF integrado, así que
// dibujamos el PDF nosotros con PDF.js (JS puro) sobre <canvas>, una
// página abajo de otra. pdf.js se trae de un CDN, así que hace falta
// internet la primera vez que se abre un libro.
//
// IMPORTANTE: El base64 del PDF NO se incrusta dentro del HTML porque
// con libros grandes (varios MB) el string JS del template puede
// superar el límite del puente nativo y el WebView queda en blanco sin
// avisar. En cambio se usa postMessage() para enviarlo una vez que el
// WebView ya está cargado.
const HTML_LECTOR = `
<!DOCTYPE html>
<html>
<head>
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=3.0" />
  <script src="https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js"><\/script>
  <style>
    * { box-sizing: border-box; }
    body { margin: 0; background: #525659; }
    #estado { color: #eee; text-align: center; padding: 24px; font-family: sans-serif; font-size: 15px; }
    #paginas { display: flex; flex-direction: column; align-items: center; padding: 10px 0; }
    canvas { max-width: 100%; height: auto; margin-bottom: 10px; box-shadow: 0 0 8px rgba(0,0,0,0.5); }
  </style>
</head>
<body>
  <div id="estado">Cargando libro...</div>
  <div id="paginas"></div>
  <script>
    pdfjsLib.GlobalWorkerOptions.workerSrc =
      'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';

    const estado = document.getElementById('estado');
    const contenedor = document.getElementById('paginas');
    let yaRenderizado = false;

    async function renderizarPdf(base64) {
      if (yaRenderizado) return;
      yaRenderizado = true;
      try {
        const binario = atob(base64);
        const bytes = new Uint8Array(binario.length);
        for (let i = 0; i < binario.length; i++) bytes[i] = binario.charCodeAt(i);

        const pdf = await pdfjsLib.getDocument({ data: bytes }).promise;
        estado.style.display = 'none';
        const anchoPantalla = window.innerWidth;

        for (let numPagina = 1; numPagina <= pdf.numPages; numPagina++) {
          const pagina = await pdf.getPage(numPagina);
          const viewportBase = pagina.getViewport({ scale: 1 });
          const escala = anchoPantalla / viewportBase.width;
          const viewport = pagina.getViewport({ scale: escala });

          const canvas = document.createElement('canvas');
          canvas.width = viewport.width;
          canvas.height = viewport.height;
          contenedor.appendChild(canvas);

          await pagina.render({ canvasContext: canvas.getContext('2d'), viewport }).promise;
        }
      } catch (err) {
        estado.style.display = 'block';
        estado.textContent = 'Error al mostrar el PDF: ' + err.message;
        if (window.ReactNativeWebView && window.ReactNativeWebView.postMessage) {
          window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'ERROR', message: err.message }));
        }
      }
    }

    document.addEventListener('message', function(e) { renderizarPdf(e.data); });
    window.addEventListener('message', function(e) { renderizarPdf(e.data); });

    if (window.ReactNativeWebView && window.ReactNativeWebView.postMessage) {
      window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'READY' }));
    }
  <\/script>
</body>
</html>
`;

export default function LectorScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const { token } = useAuth();
  const webViewRef = useRef<WebView>(null);
  const [base64, setBase64] = useState<string | null>(null);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [webViewListo, setWebViewListo] = useState(false);

  useEffect(() => {
    let cancelado = false;

    const abrirLibro = async () => {
      if (!token) return;
      try {
        // /leer da acceso con compra O renta vigente.
        const { uri } = await descargarPdfProtegido(
          obtenerUrlLecturaPdf(id as string),
          token,
          `leer-${id}.pdf`
        );

        const b64 = await FileSystem.readAsStringAsync(uri, {
          encoding: FileSystem.EncodingType.Base64,
        });
        await FileSystem.deleteAsync(uri, { idempotent: true });

        if (!cancelado) setBase64(b64);
      } catch (err: any) {
        if (!cancelado) setError(err.message || 'No se pudo abrir el libro');
      } finally {
        if (!cancelado) setCargando(false);
      }
    };

    abrirLibro();
    return () => {
      cancelado = true;
    };
  }, [id, token]);

  // Una vez que el WebView termine de cargar el HTML, le enviamos el base64
  // vía postMessage. Así el PDF nunca pasa por el puente JS<->nativo dentro
  // de una prop de React (que tiene un límite de tamaño) sino como un
  // mensaje explícito que el WebView maneja de forma asíncrona.
  useEffect(() => {
    if (webViewListo && base64 && webViewRef.current) {
      webViewRef.current.postMessage(base64);
    }
  }, [webViewListo, base64]);

  const handleLoad = () => {
    setWebViewListo(true);
  };

  const handleWebViewMessage = (event: any) => {
    try {
      const mensaje = JSON.parse(event.nativeEvent.data);
      if (mensaje?.type === 'READY') {
        setWebViewListo(true);
        return;
      }
      if (mensaje?.type === 'ERROR') {
        setError(`Error interno del visor: ${mensaje.message}`);
      }
    } catch {
      // Mensajes no JSON ignorados.
    }
  };

  if (cargando) {
    return (
      <View style={styles.centrado}>
        <ActivityIndicator size="large" />
        <Text style={styles.textoCarga}>Abriendo libro...</Text>
      </View>
    );
  }

  if (error || !base64) {
    return (
      <View style={styles.centrado}>
        <Text style={styles.textoError}>{error || 'No se pudo abrir el libro'}</Text>
        <Button title="Volver" onPress={() => router.back()} />
      </View>
    );
  }

  return (
    <View style={{ flex: 1 }}>
      <View style={styles.barraSuperior}>
        <Button title="← Volver" onPress={() => router.back()} />
      </View>
      <WebView
        ref={webViewRef}
        source={{ html: HTML_LECTOR }}
        style={{ flex: 1 }}
        originWhitelist={['*']}
        javaScriptEnabled
        domStorageEnabled
        allowFileAccess
        allowUniversalAccessFromFileURLs
        allowFileAccessFromFileURLs
        mixedContentMode="always"
        onLoad={handleLoad}
        onMessage={handleWebViewMessage}
        onError={(evento) => setError(`Error del visor: ${evento.nativeEvent.description}`)}
        onHttpError={(evento) => setError(`Error HTTP del visor: ${evento.nativeEvent.statusCode}`)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  centrado: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24 },
  textoCarga: { marginTop: 12, color: '#666' },
  textoError: { color: '#c00', textAlign: 'center', marginBottom: 16, fontSize: 14 },
  barraSuperior: { paddingTop: 40, paddingHorizontal: 8, paddingBottom: 4 },
});
