import '@/lib/crash-guard';
import { AmiriQuran_400Regular, useFonts } from '@expo-google-fonts/amiri-quran';
import { DarkTheme, DefaultTheme, router, Stack, ThemeProvider } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useMemo, type ReactNode } from 'react';
import { Pressable, ScrollView, Text } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { THEMES, ThemeContext, useColors } from '@/constants/theme';
import { t } from '@/i18n';
import { AppStateProvider, useAppState } from '@/lib/app-state';
import { AdsBootstrap } from '@/lib/ads';
import { IS_TV } from '@/lib/layout';
import { PremiumProvider } from '@/lib/premium';
import { QuranPlayerProvider } from '@/lib/quran-player';

SplashScreen.preventAutoHideAsync();

// Ekran çizilirken oluşan hatayı uygulamayı kapatmadan göster.
export function ErrorBoundary({ error, retry }: { error: Error; retry: () => Promise<void> }) {
  const C = useColors();
  useEffect(() => {
    SplashScreen.hideAsync().catch(() => {});
  }, []);
  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: C.bg }}
      contentContainerStyle={{ padding: 24, paddingTop: 64, gap: 14 }}>
      <Text style={{ color: C.text, fontSize: 20, fontWeight: '800' }}>{t('err.occurred')}</Text>
      <Text style={{ color: C.textDim, fontSize: 14 }}>{t('err.screenshot')}</Text>
      <Text selectable style={{ color: C.gold, fontSize: 13, fontFamily: 'monospace' }}>
        {error.name}: {error.message}
        {'\n\n'}
        {String(error.stack ?? '').slice(0, 1500)}
      </Text>
      <Pressable
        onPress={retry}
        style={{
          backgroundColor: C.accent,
          padding: 14,
          borderRadius: 12,
          alignItems: 'center',
        }}>
        <Text style={{ color: C.onAccent, fontWeight: '800' }}>{t('common.retry')}</Text>
      </Pressable>
    </ScrollView>
  );
}

// Seçili temayı hem uygulamaya hem gezinme çubuklarına uygular.
function Themed({ children }: { children: ReactNode }) {
  const { settings } = useAppState();
  const C = THEMES[settings.theme] ?? THEMES.zumrut;
  const nav = useMemo(() => {
    const base = C.dark ? DarkTheme : DefaultTheme;
    return {
      ...base,
      colors: {
        ...base.colors,
        background: C.bg,
        card: C.bgDeep,
        primary: C.accent,
        text: C.text,
        border: C.border,
      },
    };
  }, [C]);
  return (
    <ThemeContext.Provider value={C}>
      <ThemeProvider value={nav}>
        <StatusBar style={C.dark ? 'light' : 'dark'} />
        {children}
      </ThemeProvider>
    </ThemeContext.Provider>
  );
}

function Root() {
  const C = useColors();
  const { ready } = useAppState();
  // Kur'an metni için Amiri Quran fontu (SIL Açık Font Lisansı).
  const [fontsLoaded, fontError] = useFonts({ AmiriQuran_400Regular });
  const fontsDone = fontsLoaded || fontError != null;
  useEffect(() => {
    if (ready && fontsDone) {
      SplashScreen.hideAsync();
      // Televizyonda büyük vakit panosuyla aç
      if (IS_TV) router.replace('/tv');
    }
  }, [ready, fontsDone]);

  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: C.bg },
      }}>
      <Stack.Screen name="(tabs)" />
      <Stack.Screen name="kuran/[id]" />
      <Stack.Screen name="zikirmatik" />
      <Stack.Screen name="kaza" />
      <Stack.Screen name="ayarlar" />
      <Stack.Screen name="camiler" />
      <Stack.Screen name="mushaf" />
      <Stack.Screen name="dini-gunler" />
      <Stack.Screen name="imsakiye" />
      <Stack.Screen name="esma" />
      <Stack.Screen name="zekat" />
      <Stack.Screen name="hatim" />
      <Stack.Screen name="ortak-hatim/[kod]" />
      <Stack.Screen name="kabe" />
      <Stack.Screen name="rehber" />
      <Stack.Screen name="premium" />
      <Stack.Screen name="namaz-takip" />
      <Stack.Screen name="rozetler" />
      <Stack.Screen name="tesbihat" />
      <Stack.Screen name="dualar" />
      <Stack.Screen name="ramazan" />
      <Stack.Screen name="okuma-plani" />
      <Stack.Screen name="mesajlar" />
      <Stack.Screen name="sehir" />
      <Stack.Screen name="gun" />
      <Stack.Screen name="tv" />
    </Stack>
  );
}

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <AppStateProvider>
        <Themed>
          <PremiumProvider>
            <QuranPlayerProvider>
              <AdsBootstrap />
              <Root />
            </QuranPlayerProvider>
          </PremiumProvider>
        </Themed>
      </AppStateProvider>
    </SafeAreaProvider>
  );
}
