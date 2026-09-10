import 'react-native-gesture-handler';
import {
  useFonts,
  PlusJakartaSans_400Regular,
  PlusJakartaSans_500Medium,
  PlusJakartaSans_600SemiBold,
  PlusJakartaSans_700Bold,
} from '@expo-google-fonts/plus-jakarta-sans';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect } from 'react';
import 'react-native-reanimated';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

// Core routing layout
export {
  // Catch any errors thrown by the Layout component.
  ErrorBoundary,
} from 'expo-router';

export const unstable_settings = {
  // Set initial route to the root index.
  initialRouteName: 'index',
};

// Prevent the splash screen from auto-hiding before asset loading is complete.
SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [loaded, error] = useFonts({
    PlusJakartaSans_400Regular,
    PlusJakartaSans_500Medium,
    PlusJakartaSans_600SemiBold,
    PlusJakartaSans_700Bold,
  });

  // Expo Router uses Error Boundaries to catch errors in the navigation tree.
  useEffect(() => {
    if (error) throw error;
  }, [error]);

  useEffect(() => {
    if (loaded) {
      SplashScreen.hideAsync();
    }
  }, [loaded]);

  if (!loaded) {
    return null;
  }

  return <RootLayoutNav />;
}

import { AuthProvider, useAuth } from '../src/features/auth/context/AuthContext';
import { useRouter, useSegments } from 'expo-router';

function RootLayoutNav() {
  return (
    <AuthProvider>
      <GestureHandlerRootView style={{ flex: 1 }}>
        <MainLayout />
      </GestureHandlerRootView>
    </AuthProvider>
  );
}

function MainLayout() {
  const { isAuthenticated, isLoading, user } = useAuth();
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    if (isLoading) return;

    const rootSegment = segments[0];
    const isAuthGroup = rootSegment === '(auth)';
    const isCustomerGroup = rootSegment === '(customer)';
    const isProviderGroup = rootSegment === '(provider)';
    
    if (!isAuthenticated) {
      if (!isAuthGroup) {
        // Redirect to login if trying to access protected routes
        router.replace('/(auth)/login');
      }
    } else {
      // Authenticated users
      const role = user?.role;
      
      if (role === 'CUSTOMER') {
        if (isAuthGroup || isProviderGroup || !rootSegment) {
          router.replace('/(customer)' as any);
        }
      } else if (role === 'PROVIDER') {
        if (isAuthGroup || isCustomerGroup || !rootSegment) {
          router.replace('/(provider)' as any);
        }
      }
    }
  }, [isAuthenticated, isLoading, segments, router, user?.role]);

  return (
    <Stack>
      <Stack.Screen name="index" options={{ headerShown: false }} />
      <Stack.Screen name="(auth)" options={{ headerShown: false }} />
      <Stack.Screen name="(customer)" options={{ headerShown: false }} />
      <Stack.Screen name="(provider)" options={{ headerShown: false }} />
    </Stack>
  );
}
