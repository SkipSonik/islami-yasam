import Ionicons from '@expo/vector-icons/Ionicons';
import { router } from 'expo-router';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';

import { C, R, S } from '@/constants/theme';
import { SURAHS } from '@/data/surahs';
import { RECITERS, useQuranPlayer } from '@/lib/quran-player';

// Kur'an çalarken ekranın altında duran küçük çalar.
export function MiniPlayer({ hideLink }: { hideLink?: boolean }) {
  const p = useQuranPlayer();
  if (p.surah == null) return null;
  const meta = SURAHS[p.surah - 1];
  const reciter = RECITERS.find((r) => r.id === p.reciter)?.name;

  return (
    <View style={st.wrap}>
      <Pressable
        style={{ flex: 1 }}
        disabled={hideLink}
        onPress={() => router.push(`/kuran/${p.surah}`)}>
        <Text style={st.title} numberOfLines={1}>
          {meta.name} · {p.ayah === 0 ? 'Besmele' : `${p.ayah}. ayet`}
        </Text>
        <Text style={st.sub} numberOfLines={1}>
          {reciter}
        </Text>
      </Pressable>
      <Btn icon="play-skip-back" onPress={p.previous} />
      <Pressable onPress={p.toggle} style={st.play} hitSlop={8}>
        {p.buffering && !p.playing ? (
          <ActivityIndicator color={C.bgDeep} />
        ) : (
          <Ionicons name={p.playing ? 'pause' : 'play'} size={22} color={C.bgDeep} />
        )}
      </Pressable>
      <Btn icon="play-skip-forward" onPress={p.next} />
      <Btn icon="close" onPress={p.stop} />
    </View>
  );
}

function Btn({ icon, onPress }: { icon: any; onPress: () => void }) {
  return (
    <Pressable onPress={onPress} hitSlop={8} style={st.btn}>
      <Ionicons name={icon} size={20} color={C.text} />
    </Pressable>
  );
}

const st = StyleSheet.create({
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
});
