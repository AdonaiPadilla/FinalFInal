import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { WebView } from 'react-native-webview';
import { useLocalSearchParams, useRouter } from 'expo-router';
import * as FileSystem from 'expo-file-system/legacy';
import { obtenerUrlPreviewPdf } from '../../api/booksApi';

// HTML del visor de preview — igual al lector completo pero con un límite
// de páginas. El número de páginas permitidas llega por postMessage como
// JSON: { base64: "...", maxPaginas: 3 }
const HTML_PREVIEW = `
<!DOCTYPE html>
<html>
<head>
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=2.0" />
  <script src="https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js"><\/script>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { background: #1a1a2e; font-family: sans-serif; }
    #estado {
      color: #a0a8c0;
      text-align: center;
      padding: 32px 16px;
      font-size: 15px;
    }
    #paginas {
      display: flex;
      flex-direction: column;
      align-items: center;
      padding: 12px 0 80px;
      gap: 10px;
    }
    canvas {
      max-width: 100%;
      height: auto;
      box-shadow: 0 4px 20px rgba(0,0,0,0.6);
    }
    /* Degradado que cubre el final de la última página */
    #cortina {
      position: fixed;
      bottom: 0; left: 0; right: 0;
      height: 180px;
      background: linear-gradient(to bottom, transparent, #1a1a2e 80%);
      pointer-events: none;
    }
  </style>
</head>
<body>
  <div id="estado">Cargando vista previa...</div>
  <div id="paginas"></div>
  <div id="cortina"></div>
  <script>
    pdfjsLib.GlobalWorkerOptions.workerSrc =
      'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';

    const estado = document.getElementById('estado');
    const contenedor = document.getElementById('paginas');
    let yaRenderizado = false;

    async function renderizarPreview(payload) {
      if (yaRenderizado) return;
      yaRenderizado = true;
      try {
        const { base64, maxPaginas } = JSON.parse(payload);
        const binario = atob(base64);
        const bytes = new Uint8Array(binario.length);
        for (let i = 0; i < binario.length; i++) bytes[i] = binario.charCodeAt(i);

        const pdf = await pdfjsLib.getDocument({ data: bytes }).promise;
        estado.style.display = 'none';

        const totalRenderizar = Math.min(maxPaginas, pdf.numPages);
        const anchoPantalla = window.innerWidth;

        for (let num = 1; num <= totalRenderizar; num++) {
          const pagina = await pdf.getPage(num);
          const vpBase = pagina.getViewport({ scale: 1 });
          const escala = anchoPantalla / vpBase.width;
          const viewport = pagina.getViewport({ scale: escala });

          const canvas = document.createElement('canvas');
          canvas.width = viewport.width;
          canvas.height = viewport.height;
          contenedor.appendChild(canvas);

          await pagina.render({ canvasContext: canvas.getContext('2d'), viewport }).promise;
        }
      } catch (err) {
        estado.style.display = 'block';
        estado.textContent = 'Error al cargar la vista previa: ' + err.message;
        if (window.ReactNativeWebView && window.ReactNativeWebView.postMessage) {
          window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'ERROR', message: err.message }));
        }
      }
    }

    document.addEventListener('message', function(e) { renderizarPreview(e.data); });
    window.addEventListener('message', function(e) { renderizarPreview(e.data); });

    if (window.ReactNativeWebView && window.ReactNativeWebView.postMessage) {
      window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'READY' }));
    }
  <\/script>
</body>
</html>
`;

export default function PreviewScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const webViewRef = useRef<WebView>(null);
  const [datos, setDatos] = useState<{ base64: string; maxPaginas: number } | null>(null);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [webViewListo, setWebViewListo] = useState(false);

  useEffect(() => {
    let cancelado = false;

    const cargarPreview = async () => {
      try {
        const url = obtenerUrlPreviewPdf(id as string);
        const destino = `${FileSystem.cacheDirectory}preview-${id}.pdf`;

        // La descarga es pública (sin Authorization) — se lee el header
        // X-Preview-Pages para saber cuántas páginas mostrar.
        const resultado = await FileSystem.downloadAsync(url, destino);

        if (resultado.status !== 200) {
          throw new Error('No se pudo cargar la vista previa');
        }

        // El servidor manda X-Preview-Pages; si no viene, se usan 3 por defecto.
        const maxPaginas = parseInt(resultado.headers?.['x-preview-pages'] ?? '3', 10);

        const base64 = await FileSystem.readAsStringAsync(resultado.uri, {
          encoding: FileSystem.EncodingType.Base64,
        });
        await FileSystem.deleteAsync(resultado.uri, { idempotent: true });

        if (!cancelado) setDatos({ base64, maxPaginas });
      } catch (err: any) {
        if (!cancelado) setError(err.message || 'No se pudo cargar la vista previa');
      } finally {
        if (!cancelado) setCargando(false);
      }
    };

    cargarPreview();
    return () => { cancelado = true; };
  }, [id]);

  useEffect(() => {
    if (webViewListo && datos && webViewRef.current) {
      webViewRef.current.postMessage(JSON.stringify(datos));
    }
  }, [webViewListo, datos]);

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
      // No hacemos nada para mensajes no JSON.
    }
  };

  if (cargando) {
    return (
      <SafeAreaView style={styles.centrado}>
        <ActivityIndicator size="large" color="#6c63ff" />
        <Text style={styles.textoCarga}>Cargando vista previa...</Text>
      </SafeAreaView>
    );
  }

  if (error || !datos) {
    return (
      <SafeAreaView style={styles.centrado}>
        <Text style={styles.textoError}>{error || 'No se pudo cargar la vista previa'}</Text>
        <TouchableOpacity style={styles.botonVolver} onPress={() => router.back()}>
          <Text style={styles.botonVolverTexto}>← Volver</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  return (
    <View style={styles.contenedor}>
      {/* Barra superior */}
      <SafeAreaView style={styles.barra}>
        <TouchableOpacity onPress={() => router.back()} style={styles.btnVolver}>
          <Text style={styles.btnVolverTexto}>← Volver</Text>
        </TouchableOpacity>
        <Text style={styles.barraTitulo}>Vista previa</Text>
        <View style={{ width: 80 }} />
      </SafeAreaView>

      {/* Visor de PDF */}
      <WebView
        ref={webViewRef}
        source={{ html: HTML_PREVIEW }}
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
        onError={(e) => setError(`Error del visor: ${e.nativeEvent.description}`)}
      />

      {/* Banner CTA fijo en la parte inferior */}
      <View style={styles.bannerCta}>
        <View style={styles.bannerContenido}>
          <Text style={styles.bannerTitulo}>📖 Vista previa — {datos.maxPaginas} páginas</Text>
          <Text style={styles.bannerSubtitulo}>
            Renta o compra el libro para leerlo completo
          </Text>
          <TouchableOpacity
            style={styles.botonAccion}
            onPress={() => router.replace(`/libro/${id}`)}
          >
            <Text style={styles.botonAccionTexto}>Ver opciones de acceso</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  contenedor: { flex: 1, backgroundColor: '#1a1a2e' },
  centrado: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#1a1a2e',
    padding: 24,
  },
  textoCarga: { marginTop: 14, color: '#a0a8c0', fontSize: 15 },
  textoError: {
    color: '#ff6b6b',
    textAlign: 'center',
    marginBottom: 20,
    fontSize: 14,
    lineHeight: 20,
  },
  botonVolver: {
    backgroundColor: '#6c63ff',
    paddingHorizontal: 24,
    paddingVertical: 10,
    borderRadius: 8,
  },
  botonVolverTexto: { color: '#fff', fontWeight: '700', fontSize: 14 },

  // Barra superior
  barra: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#12122a',
    paddingHorizontal: 12,
    paddingTop: 44,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(108,99,255,0.3)',
  },
  btnVolver: { width: 80, paddingVertical: 6 },
  btnVolverTexto: { color: '#6c63ff', fontSize: 15, fontWeight: '600' },
  barraTitulo: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 0.5,
  },

  // Banner CTA
  bannerCta: {
    backgroundColor: '#12122a',
    borderTopWidth: 1,
    borderTopColor: 'rgba(108,99,255,0.4)',
    paddingBottom: 24,
    paddingTop: 14,
    paddingHorizontal: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 12,
  },
  bannerContenido: { alignItems: 'center', gap: 6 },
  bannerTitulo: {
    color: '#e0e0f0',
    fontSize: 14,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  bannerSubtitulo: {
    color: '#7a7a9a',
    fontSize: 12,
    textAlign: 'center',
  },
  botonAccion: {
    marginTop: 10,
    backgroundColor: '#6c63ff',
    paddingHorizontal: 32,
    paddingVertical: 12,
    borderRadius: 10,
    shadowColor: '#6c63ff',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.5,
    shadowRadius: 8,
    elevation: 6,
  },
  botonAccionTexto: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 14,
    letterSpacing: 0.5,
  },
});
