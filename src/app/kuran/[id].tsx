import { useLocalSearchParams } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, FlatList, Pressable, StyleSheet, Text, View } from 'react-native';

import { Btn, Screen } from '@/components/ui';
import { C, R, S } from '@/constants/theme';
import { SURAHS } from '@/data/surahs';
import { loadValue, saveJSON } from '@/lib/storage';
import { BASMALA, getSurah, type Surah } from '@/lib/quran';

type View3 = 'ikisi' | 'arapca' | 'meal';

export default function SurahScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const n = Math.min(114, Math.max(1, Number(id) || 1));
  const meta = SURAHS[n - 1];

  const [surah, setSurah] = useState<Surah | null>(null);
  const [error, setError] = useState(false);
  const [mode, setMode] = useState<View3>('ikisi');

  const load = useCallback(() => {
    setError(false);
    setSurah(null);
    getSurah(n).then(setSurah).catch(() => setError(true));
  }, [n]);

  useEffect(load, [load]);
  useEffect(() => {
    loadValue<View3>('kuran-gorunum', 'ikisi').then(setMode);
  }, []);

  const pick = (m: View3) => {
    setMode(m);
    saveJSON('kuran-gorunum', m);
  };

  return (
    <Screen title={`${meta.name} Suresi`} back scroll={false}>
      <View style={st.toggle}>
        {(
          [
            ['ikisi', 'Arapça + Meal'],
            ['arapca', 'Arapça'],
            ['meal', 'Meal'],
          ] as [View3, string][]
        ).map(([k, label]) => (
          <Pressable key={k} onPress={() => pick(k)} style={[st.tBtn, mode === k && st.tBtnOn]}>
            <Text style={[st.tText, mode === k && { color: C.bgDeep }]}>{label}</Text>
          </Pressable>
        ))}
      </View>

      {error ? (
        <View style={st.center}>
          <Text style={st.msg}>Sure yüklenemedi. İlk açılışta internet bağlantısı gerekiyor.</Text>
          <Btn label="Tekrar dene" icon="refresh" onPress={load} />
        </View>
      ) : !surah ? (
        <View style={st.center}>
          <ActivityIndicator color={C.accent} size="large" />
        </View>
      ) : (
        <FlatList
          data={surah.ayahs}
          keyExtractor={(a) => String(a.n)}
          contentContainerStyle={{ gap: S.md, paddingBottom: 40 }}
          ListHeaderComponent={
            <View style={st.banner}>
              <Text style={st.bannerName}>{meta.name}</Text>
              <Text style={st.bannerMeta}>{meta.ayahs} ayet</Text>
              {n !== 1 && n !== 9 && mode !== 'meal' ? <Text style={st.basmala}>{BASMALA}</Text> : null}
            </View>
          }
          renderItem={({ item }) => (
            <View style={st.ayah}>
              <View style={st.badge}>
                <Text style={st.badgeText}>{item.n}</Text>
              </View>
              {mode !== 'meal' ? <Text style={st.ar}>{item.ar}</Text> : null}
              {mode !== 'arapca' ? <Text style={st.tr}>{item.tr}</Text> : null}
            </View>
          )}
          ListFooterComponent={<Text style={st.src}>Meal: Diyanet İşleri Başkanlığı</Text>}
        />
      )}
    </Screen>
  );
}

const st = StyleSheet.create({
  toggle: { flexDirection: 'row', backgroundColor: C.card, borderRadius: R.md, padding: 4, gap: 4 },
  tBtn: { flex: 1, paddingVertical: 8, borderRadius: R.sm, alignItems: 'center' },
  tBtnOn: { backgroundColor: C.accent },
  tText: { color: C.textDim, fontSize: 13, fontWeight: '600' },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: S.lg, padding: S.xl },
  msg: { color: C.textDim, textAlign: 'center', fontSize: 15 },
  banner: {
    backgroundColor: C.cardActive,
    borderRadius: R.lg,
    padding: S.xl,
    alignItems: 'center',
    gap: 4,
    marginBottom: S.xs,
  },
  bannerName: { color: C.gold, fontSize: 24, fontWeight: '800' },
  bannerMeta: { color: C.textDim, fontSize: 13 },
  basmala: { color: C.text, fontSize: 26, marginTop: S.md, textAlign: 'center' },
  ayah: { backgroundColor: C.card, borderRadius: R.md, padding: S.lg, gap: S.md },
  badge: {
    alignSelf: 'flex-start',
    minWidth: 30,
    height: 30,
    borderRadius: 15,
    paddingHorizontal: 8,
    backgroundColor: C.cardSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeText: { color: C.accent, fontWeight: '700', fontSize: 13 },
  ar: { color: C.text, fontSize: 26, lineHeight: 50, textAlign: 'right', writingDirection: 'rtl' },
  tr: { color: C.textDim, fontSize: 15.5, lineHeight: 24 },
  src: { color: C.textMute, fontSize: 12, textAlign: 'center', marginTop: S.md },
});
