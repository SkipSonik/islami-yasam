import { DarkTheme, Stack, ThemeProvider } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { C } from '@/constants/theme';
import { AppStateProvider, useAppState } from '@/lib/app-state';
import { QuranPlayerProvider } from '@/lib/quran-player';

SplashScreen.preventAutoHideAsync();

const theme = {
  ...DarkTheme,
  colors: { ...DarkTheme.colors, background: C.bg, card: C.bgDeep, primary: C.accent, text: C.text },
};

function Root() {
  const { ready } = useAppState();
  useEffect(() => {
    if (ready) SplashScreen.hideAsync();
  }, [ready]);

  return (
    <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: C.bg } }}>
      <Stack.Screen name="(tabs)" />
      <Stack.Screen name="kuran/[id]" />
      <Stack.Screen name="zikirmatik" />
      <Stack.Screen name="kaza" />
      <Stack.Screen name="ayarlar" />
    </Stack>
  );
}

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <ThemeProvider value={theme}>
        <AppStateProvider>
          <QuranPlayerProvider>
            <StatusBar style="light" />
            <Root />
          </QuranPlayerProvider>
        </AppStateProvider>
      </ThemeProvider>
    </SafeAreaProvider>
  );
}
