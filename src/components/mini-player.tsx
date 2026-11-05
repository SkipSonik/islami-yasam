import Ionicons from '@expo/vector-icons/Ionicons';
import { router } from 'expo-router';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';

import { R, S, useColors, makeStyles } from '@/constants/theme';
import { surahName } from '@/data/surahs';
import { useAppState, useT } from '@/lib/app-state';
import { reciterName, useQuranPlayer } from '@/lib/quran-player';

// Kur'an çalarken ekranın altında duran küçük çalar.
export function MiniPlayer({ hideLink }: { hideLink?: boolean }) {
  const C = useColors();
  const st = useSt();
  const p = useQuranPlayer();
  const { lang } = useAppState();
  const t = useT();
  if (p.surah == null) return null;
  const reciter = reciterName(p.reciter, lang);

  return (
    <View style={st.wrap}>
      <Pressable
        style={{ flex: 1 }}
        disabled={hideLink}
        onPress={() => router.push(`/kuran/${p.surah}`)}>
        <Text style={st.title} numberOfLines={1}>
          {surahName(p.surah, lang)} · {p.ayah === 0 ? t('quran.basmala') : t('quran.ayahN', { n: p.ayah ?? 1 })}
        </Text>
        <Text style={st.sub} numberOfLines={1}>
          {reciter}
        </Text>
      </Pressable>
      <Btn icon="play-skip-back" onPress={p.previous} />
      <Pressable onPress={p.toggle} style={st.play} hitSlop={8}>
        {p.buffering && !p.playing ? (
          <ActivityIndicator color={C.onAccent} />
        ) : (
          <Ionicons name={p.playing ? 'pause' : 'play'} size={22} color={C.onAccent} />
        )}
      </Pressable>
      <Btn icon="play-skip-forward" onPress={p.next} />
      <Btn icon="close" onPress={p.stop} />
    </View>
  );
}

function Btn({ icon, onPress }: { icon: any; onPress: () => void }) {
  const C = useColors();
  const st = useSt();
  return (
    <Pressable onPress={onPress} hitSlop={8} style={st.btn}>
      <Ionicons name={icon} size={20} color={C.text} />
    </Pressable>
  );
}

const useSt = makeStyles((C) => ({
  wrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: S.sm,
    backgroundColor: C.cardActive,
    borderRadius: R.md,
    marginHorizontal: S.sm,
    marginBottom: S.sm,
    paddingVertical: S.sm,
    paddingLeft: S.md,
    paddingRight: S.sm,
  },
  title: { color: C.text, fontSize: 14, fontWeight: '700' },
  sub: { color: C.textDim, fontSize: 12, marginTop: 1 },
  btn: { width: 34, height: 34, alignItems: 'center', justifyContent: 'center' },
  play: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: C.accent,
    alignItems: 'center',
    justifyContent: 'center',
  },
}));
