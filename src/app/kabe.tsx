import { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Linking, Pressable, StyleSheet, Text, View } from 'react-native';
import { WebView } from 'react-native-webview';

import { Btn, Screen } from '@/components/ui';
import { R, S, useColors, makeStyles } from '@/constants/theme';
import { useT } from '@/lib/app-state';

// Suudi Arabistan resmî yayınları (Kur'an kanalı: Mescid-i Haram, Sünnet kanalı: Mescid-i Nebevî)
const STREAMS = {
  mecca: { channel: 'UCos52azQNBgW63_9uDJoPDA', handle: 'saudiqurantv' },
  medina: { channel: 'UCROKYPep-UuODNwyipe6JMw', handle: 'saudisunnahtv' },
} as const;
type Key = keyof typeof STREAMS;

const ORIGIN = 'https://mix.gen.tr';

/** Kanalın o anki canlı yayınının video kimliğini bulur. */
async function liveVideoId(channel: string): Promise<string | null> {
  try {
    const res = await fetch(`https://www.youtube.com/channel/${channel}/live`, {
      headers: { 'Accept-Language': 'en' },
    });
    const html = await res.text();
    const m =
      html.match(/<link rel="canonical" href="https:\/\/www\.youtube\.com\/watch\?v=([\w-]{11})"/) ??
      html.match(/"videoDetails":\{"videoId":"([\w-]{11})"/) ??
      html.match(/watch\?v=([\w-]{11})/);
    return m ? m[1] : null;
  } catch {
    return null;
  }
}

// YouTube IFrame oynatıcısı; hata olursa ya da 15 sn'de hazır olmazsa uygulamaya haber verir.
const embedHtml = (id: string) => `<!doctype html><html><head>
<meta name="viewport" content="width=device-width,initial-scale=1,maximum-scale=1">
<style>html,body{margin:0;height:100%;background:#000;overflow:hidden}#p{position:absolute;inset:0;width:100%;height:100%}</style>
</head><body><div id="p"></div>
<script>
var ready=false;function post(m){window.ReactNativeWebView&&window.ReactNativeWebView.postMessage(m)}
setTimeout(function(){if(!ready)post('error:timeout')},15000);
function onYouTubeIframeAPIReady(){new YT.Player('p',{width:'100%',height:'100%',videoId:'${id}',
playerVars:{autoplay:1,playsinline:1,rel:0,modestbranding:1,origin:'${ORIGIN}'},
events:{onReady:function(e){ready=true;e.target.playVideo()},onError:function(e){post('error:'+e.data)}}})}
</script><script src="https://www.youtube.com/iframe_api"></script></body></html>`;

type Mode = 'loading' | 'embed' | 'page';

export default function KabeScreen() {
  const C = useColors();
  const st = useSt();
  const t = useT();
  const [which, setWhich] = useState<Key>('mecca');
  const [videoId, setVideoId] = useState<string | null>(null);
  const [mode, setMode] = useState<Mode>('loading');
  const run = useRef(0);
  const s = STREAMS[which];

  useEffect(() => {
    const id = ++run.current;
    setMode('loading');
    setVideoId(null);
    liveVideoId(s.channel).then((v) => {
      if (id !== run.current) return;
      setVideoId(v);
      setMode(v ? 'embed' : 'page');
    });
  }, [s.channel]);

  // Gömülü oynatıcı çalışmazsa YouTube'un mobil sayfası uygulama içinde açılır.
  const pageUrl = videoId ? `https://m.youtube.com/watch?v=${videoId}` : `https://m.youtube.com/channel/${s.channel}/live`;
  const ytUrl = videoId ? `https://www.youtube.com/watch?v=${videoId}` : `https://www.youtube.com/@${s.handle}/live`;

  return (
    <Screen title={t('kabe.title')} back scroll={false}>
      <View style={st.tabs}>
        {(Object.keys(STREAMS) as Key[]).map((k) => (
          <Pressable key={k} onPress={() => setWhich(k)} style={[st.tab, which === k && st.tabOn]}>
            <Text style={[st.tabText, which === k && { color: C.onAccent }]}>{t(`kabe.${k}`)}</Text>
          </Pressable>
        ))}
      </View>

      <View style={[st.player, mode === 'page' && st.playerTall]}>
        {mode === 'loading' ? (
          <ActivityIndicator color={C.accent} size="large" style={{ flex: 1 }} />
        ) : mode === 'embed' && videoId ? (
          <WebView
            key={`e-${videoId}`}
            source={{ html: embedHtml(videoId), baseUrl: ORIGIN }}
            style={{ backgroundColor: '#000' }}
            allowsInlineMediaPlayback
            allowsFullscreenVideo
            mediaPlaybackRequiresUserAction={false}
            javaScriptEnabled
            domStorageEnabled
            setSupportMultipleWindows={false}
            onMessage={(e) => {
              if (e.nativeEvent.data.startsWith('error')) setMode('page');
            }}
            onShouldStartLoadWithRequest={(req) => {
              if (req.isTopFrame === false) return true;
              if (req.url.startsWith(ORIGIN) || req.url === 'about:blank') return true;
              Linking.openURL(req.url).catch(() => {});
              return false;
            }}
          />
        ) : (
          <WebView
            key={`p-${pageUrl}`}
            source={{ uri: pageUrl }}
            style={{ backgroundColor: '#000' }}
            allowsInlineMediaPlayback
            allowsFullscreenVideo
            mediaPlaybackRequiresUserAction={false}
            javaScriptEnabled
            domStorageEnabled
            setSupportMultipleWindows={false}
            onShouldStartLoadWithRequest={(req) => {
              const host = req.url.match(/^https?:\/\/([^/]+)/)?.[1] ?? '';
              if (/(^|\.)(youtube\.com|google\.com|gstatic\.com|ytimg\.com|googlevideo\.com)$/.test(host) || req.url === 'about:blank') return true;
              Linking.openURL(req.url).catch(() => {});
              return false;
            }}
          />
        )}
      </View>

      <Btn label={t('kabe.openYt')} kind="ghost" icon="logo-youtube" onPress={() => Linking.openURL(ytUrl).catch(() => {})} />
      <Text style={st.note}>{t('kabe.note')}</Text>
    </Screen>
  );
}

const useSt = makeStyles((C) => ({
  tabs: { flexDirection: 'row', gap: S.sm },
  tab: { flex: 1, paddingVertical: 10, borderRadius: R.md, backgroundColor: C.card, alignItems: 'center' },
  tabOn: { backgroundColor: C.accent },
  tabText: { color: C.text, fontWeight: '700', fontSize: 15 },
  player: { width: '100%', aspectRatio: 16 / 9, borderRadius: R.md, overflow: 'hidden', backgroundColor: '#000' },
  playerTall: { aspectRatio: undefined, flex: 1, minHeight: 260 },
  note: { color: C.textMute, fontSize: 12.5, lineHeight: 19 },
}));
