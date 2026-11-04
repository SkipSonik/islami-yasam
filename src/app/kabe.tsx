import { useState } from 'react';
import { Linking, Pressable, StyleSheet, Text, View } from 'react-native';
import { WebView } from 'react-native-webview';

import { Btn, Screen } from '@/components/ui';
import { C, R, S } from '@/constants/theme';
import { useT } from '@/lib/app-state';

// Suudi Arabistan resmî yayınları (Kur'an kanalı: Mescid-i Haram, Sünnet kanalı: Mescid-i Nebevî)
const STREAMS = {
  mecca: { channel: 'UCos52azQNBgW63_9uDJoPDA', handle: 'saudiqurantv' },
  medina: { channel: 'UCROKYPep-UuODNwyipe6JMw', handle: 'saudisunnahtv' },
} as const;
type Key = keyof typeof STREAMS;

// YouTube gömülü oynatıcı bir kaynak adresi (referrer) ister; sayfa bir https adresinden
// açılıyormuş gibi yüklenir.
const html = (channel: string) => `<!doctype html><html><head>
<meta name="viewport" content="width=device-width,initial-scale=1,maximum-scale=1">
<style>html,body{margin:0;height:100%;background:#000}iframe{position:absolute;inset:0;width:100%;height:100%;border:0}</style>
</head><body>
<iframe src="https://www.youtube.com/embed/live_stream?channel=${channel}&autoplay=1&mute=0&playsinline=1&rel=0"
 allow="autoplay; encrypted-media; picture-in-picture; fullscreen" allowfullscreen referrerpolicy="strict-origin-when-cross-origin"></iframe>
</body></html>`;

export default function KabeScreen() {
  const t = useT();
  const [which, setWhich] = useState<Key>('mecca');
  const s = STREAMS[which];

  return (
    <Screen title={t('kabe.title')} back scroll={false}>
      <View style={st.tabs}>
        {(Object.keys(STREAMS) as Key[]).map((k) => (
          <Pressable key={k} onPress={() => setWhich(k)} style={[st.tab, which === k && st.tabOn]}>
            <Text style={[st.tabText, which === k && { color: C.bgDeep }]}>{t(`kabe.${k}`)}</Text>
          </Pressable>
        ))}
      </View>

      <View style={st.player}>
        <WebView
          key={which}
          source={{ html: html(s.channel), baseUrl: 'https://mix.gen.tr' }}
          style={{ backgroundColor: '#000' }}
          allowsInlineMediaPlayback
          allowsFullscreenVideo
          mediaPlaybackRequiresUserAction={false}
          javaScriptEnabled
          domStorageEnabled
          setSupportMultipleWindows={false}
          onShouldStartLoadWithRequest={(req) => {
            // Oynatıcı içinden YouTube'a çıkan bağlantılar uygulama dışında açılsın
            if (req.url.startsWith('https://www.youtube.com/embed') || req.url.startsWith('https://mix.gen.tr') || req.url === 'about:blank') return true;
            if (req.isTopFrame === false) return true;
            Linking.openURL(req.url).catch(() => {});
            return false;
          }}
        />
      </View>

      <Btn
        label={t('kabe.openYt')}
        kind="ghost"
        icon="logo-youtube"
        onPress={() => Linking.openURL(`https://www.youtube.com/@${s.handle}/live`).catch(() => {})}
      />
      <Text style={st.note}>{t('kabe.note')}</Text>
    </Screen>
  );
}

const st = StyleSheet.create({
  tabs: { flexDirection: 'row', gap: S.sm },
  tab: { flex: 1, paddingVertical: 10, borderRadius: R.md, backgroundColor: C.card, alignItems: 'center' },
  tabOn: { backgroundColor: C.accent },
  tabText: { color: C.text, fontWeight: '700', fontSize: 15 },
  player: { width: '100%', aspectRatio: 16 / 9, borderRadius: R.md, overflow: 'hidden', backgroundColor: '#000' },
  note: { color: C.textMute, fontSize: 12.5, lineHeight: 19 },
});
