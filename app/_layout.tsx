import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import 'react-native-reanimated';
import { useFonts, Lexend_400Regular, Lexend_600SemiBold, Lexend_700Bold } from '@expo-google-fonts/lexend';
import { CourierPrime_400Regular, CourierPrime_700Bold } from '@expo-google-fonts/courier-prime';
import { FunnelSans_400Regular, FunnelSans_700Bold } from '@expo-google-fonts/funnel-sans';
import { Sansita_400Regular, Sansita_700Bold } from '@expo-google-fonts/sansita';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect } from 'react';

import { useColorScheme } from '@/hooks/use-color-scheme';

export const unstable_settings = {
  anchor: 'index',
};

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const colorScheme = useColorScheme();

  const [loaded] = useFonts({
    Lexend: Lexend_400Regular,
    LexendSemiBold: Lexend_600SemiBold,
    LexendBold: Lexend_700Bold,
    CourierPrime: CourierPrime_400Regular,
    CourierPrimeBold: CourierPrime_700Bold,
    FunnelSans: FunnelSans_400Regular,
    FunnelSansBold: FunnelSans_700Bold,
    Sansation: Sansita_400Regular,
    SansationBold: Sansita_700Bold,
  });

  useEffect(() => {
    if (loaded) {
      SplashScreen.hideAsync();
    }
  }, [loaded]);

  if (!loaded) {
    return null;
  }

  return (
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      <Stack>
        <Stack.Screen name="index" options={{ headerShown: false }} />
        <Stack.Screen name="roles" options={{ headerShown: false, animation: 'fade' }} />
        <Stack.Screen name="pin" options={{ headerShown: false, animation: 'slide_from_right' }} />
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="kitchen"  options={{ headerShown: false, animation: 'fade' }} />
        <Stack.Screen name="manager"  options={{ headerShown: false, animation: 'fade' }} />
        <Stack.Screen name="cashier"  options={{ headerShown: false, animation: 'fade' }} />
        <Stack.Screen name="modal" options={{ presentation: 'modal', title: 'Modal' }} />
      </Stack>
      <StatusBar style="auto" />
    </ThemeProvider>
  );
}
