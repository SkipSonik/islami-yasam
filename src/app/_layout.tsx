import '@/lib/crash-guard';
import { AmiriQuran_400Regular, useFonts } from '@expo-google-fonts/amiri-quran';
import { DarkTheme, Stack, ThemeProvider } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { Pressable, ScrollView, Text } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { C } from '@/constants/theme';
import { t } from '@/i18n';
import { AppStateProvider, useAppState } from '@/lib/app-state';
import { QuranPlayerProvider } from '@/lib/quran-player';

SplashScreen.preventAutoHideAsync();

// Ekran çizilirken oluşan hatayı uygulamayı kapatmadan göster.
export function ErrorBoundary({ error, retry }: { error: Error; retry: () => Promise<void> }) {
  useEffect(() => {
    SplashScreen.hideAsync().catch(() => {});
  }, []);
  return (
    <ScrollView style={{ flex: 1, backgroundColor: C.bg }} contentContainerStyle={{ padding: 24, paddingTop: 64, gap: 14 }}>
      <Text style={{ color: C.text, fontSize: 20, fontWeight: '800' }}>{t('err.occurred')}</Text>
      <Text style={{ color: C.textDim, fontSize: 14 }}>{t('err.screenshot')}</Text>
      <Text selectable style={{ color: C.gold, fontSize: 13, fontFamily: 'monospace' }}>
        {error.name}: {error.message}
        {'\n\n'}
        {String(error.stack ?? '').slice(0, 1500)}
      </Text>
      <Pressable onPress={retry} style={{ backgroundColor: C.accent, padding: 14, borderRadius: 12, alignItems: 'center' }}>
        <Text style={{ color: C.bgDeep, fontWeight: '800' }}>{t('common.retry')}</Text>
      </Pressable>
    </ScrollView>
  );
}

const theme = {
  ...DarkTheme,
  colors: { ...DarkTheme.colors, background: C.bg, card: C.bgDeep, primary: C.accent, text: C.text },
};

function Root() {
  const { ready } = useAppState();
  // Kur'an metni için Amiri Quran fontu (SIL Açık Font Lisansı).
  const [fontsLoaded, fontError] = useFonts({ AmiriQuran_400Regular });
  const fontsDone = fontsLoaded || fontError != null;
  useEffect(() => {
    if (ready && fontsDone) SplashScreen.hideAsync();
  }, [ready, fontsDone]);

  return (
    <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: C.bg } }}>
      <Stack.Screen name="(tabs)" />
      <Stack.Screen name="kuran/[id]" />
      <Stack.Screen name="zikirmatik" />
      <Stack.Screen name="kaza" />
      <Stack.Screen name="ayarlar" />
      <Stack.Screen name="camiler" />
      <Stack.Screen name="mushaf" />
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
