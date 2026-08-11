import React from 'react';
import { Stack, useRouter, useSegments } from 'expo-router';
import { AuthProvider, useAuth } from '../context/AuthContext';

function Navegacion() {
  const { usuario, token, cargando } = useAuth();
  const segments = useSegments();
  const router = useRouter();

  // Mismo criterio de rol que usa el resto del cliente (home.tsx, CatalogoLibros.tsx).
  const esAdmin = usuario?.rol === 'admin' || usuario?.rol === 'gerente';

  React.useEffect(() => {
    if (cargando) return;

    const enPantallaAuth = segments.length === 0 || segments[0] === 'register';
    const enZonaAdmin = segments[0] === 'admin';

    if (!token && !enPantallaAuth) {
      router.replace('/');
    } else if (token && enPantallaAuth) {
      router.replace('/home');
    } else if (token && enZonaAdmin && !esAdmin) {
      // Defensa en profundidad: el servidor ya rechaza estas peticiones con 403,
      // pero un usuario normal no debería ni poder cargar estas pantallas.
      router.replace('/home');
    }
  }, [token, cargando, segments, esAdmin]);

  if (cargando) return null;

  // Evita el "flash" de la pantalla admin mientras el redirect del efecto anterior
  // se resuelve (los efectos corren después del primer render).
  if (token && segments[0] === 'admin' && !esAdmin) return null;

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="register" />
      <Stack.Screen name="home" />
      <Stack.Screen name="libro/[id]" />
      <Stack.Screen name="lector/[id]" />
      <Stack.Screen name="biblioteca/rentas" />
      <Stack.Screen name="biblioteca/compras" />
      <Stack.Screen name="admin/index" />
      <Stack.Screen name="admin/nuevo-libro" />
      <Stack.Screen name="admin/editar-libro/[id]" />
      <Stack.Screen name="admin/rentas" />
      <Stack.Screen name="admin/compras" />
    </Stack>
  );
}

export default function RootLayout() {
  return (
    <AuthProvider>
      <Navegacion />
    </AuthProvider>
  );
}