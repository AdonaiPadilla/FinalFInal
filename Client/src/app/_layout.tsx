import React from 'react';
import { Stack, useRouter, useSegments } from 'expo-router';
import { AuthProvider, useAuth } from '../context/AuthContext';

function Navegacion() {
  const { token, cargando } = useAuth();
  const segments = useSegments();
  const router = useRouter();

  React.useEffect(() => {
    if (cargando) return;

    const enPantallaAuth = segments.length === 0 || segments[0] === 'register';

    if (!token && !enPantallaAuth) {
      router.replace('/');
    } else if (token && enPantallaAuth) {
      router.replace('/home');
    }
  }, [token, cargando, segments]);

  if (cargando) return null;

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="register" />
      <Stack.Screen name="home" />
      <Stack.Screen name="libro/[id]" />
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