import Ionicons from '@expo/vector-icons/Ionicons';
import { router, useLocalSearchParams } from 'expo-router';
import { useCallback, useEffect, useRef, useState } from 'react';
import { ActivityIndicator, FlatList, Modal, Pressable, StyleSheet, Text, View } from 'react-native';

import { MiniPlayer } from '@/components/mini-player';
import { Btn, Screen } from '@/components/ui';
import { C, R, S } from '@/constants/theme';
import { surahName, SURAHS } from '@/data/surahs';
import { MEAL_EDITIONS } from '@/i18n';
import { useAppState, useT } from '@/lib/app-state';
import { BASMALA, getSurah, type Ayah, type Surah } from '@/lib/quran';
import { reciterName, RECITERS, useQuranPlayer } from '@/lib/quran-player';
import { loadValue, saveJSON } from '@/lib/storage';

type Mode = 'ikisi' | 'arapca' | 'meal';

export default function SurahScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const n = Math.min(114, Math.max(1, Number(id) || 1));
  const meta = SURAHS[n - 1];
  const { lang } = useAppState();
  const t = useT();
  const name = surahName(n, lang);
  const player = useQuranPlayer();
  const isThis = player.surah === n;
  const currentAyah = isThis ? player.ayah : null;

  const [surah, setSurah] = useState<Surah | null>(null);
  const [error, setError] = useState(false);
  const [mode, setMode] = useState<Mode>('ikisi');
  const [pickReciter, setPickReciter] = useState(false);
  const [follow, setFollow] = useState(true);
  const listRef = useRef<FlatList<Ayah>>(null);

  const load = useCallback(() => {
    setError(false);
    setSurah(null);
    getSurah(n).then(setSurah).catch(() => setError(true));
  }, [n, lang]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(load, [load]);
  useEffect(() => {
    loadValue<Mode>('kuran-gorunum', 'ikisi').then(setMode);
  }, []);

  // Okunan ayeti ekranda tut.
  useEffect(() => {
    if (!follow || !surah || currentAyah == null || currentAyah < 1) return;
    listRef.current?.scrollToIndex({ index: currentAyah - 1, viewPosition: 0.3, animated: true });
  }, [currentAyah, follow, surah]);

  const pick = (m: Mode) => {
    setMode(m);
    saveJSON('kuran-gorunum', m);
  };

  const headerPlay = (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 14 }}>
      <Pressable hitSlop={10} onPress={() => router.push(`/mushaf?sure=${n}`)}>
        <Ionicons name="book-outline" size={22} color={C.text} />
      </Pressable>
    <Pressable
      hitSlop={10}
      onPress={() => (isThis ? player.toggle() : player.playSurah(n, 1))}
      style={st.headerPlay}>
      <Ionicons name={isThis && player.playing ? 'pause' : 'play'} size={18} color={C.bgDeep} />
    </Pressable>
    </View>
  );

  return (
    <Screen title={t('quran.surahTitle', { name })} back scroll={false} right={headerPlay}>
      <View style={st.toggle}>
        {(
          [
            ['ikisi', t('quran.modeBoth')],
            ['arapca', t('quran.modeArabic')],
            ['meal', t('quran.modeMeal')],
          ] as [Mode, string][]
        ).map(([k, label]) => (
          <Pressable key={k} onPress={() => pick(k)} style={[st.tBtn, mode === k && st.tBtnOn]}>
            <Text style={[st.tText, mode === k && { color: C.bgDeep }]}>{label}</Text>
          </Pressable>
        ))}
      </View>

      <Pressable style={st.reciterRow} onPress={() => setPickReciter(true)}>
        <Ionicons name="mic-outline" size={16} color={C.accent} />
        <Text style={st.reciterText} numberOfLines={1}>
          {t('quran.reciter', { name: reciterName(player.reciter, lang) })}
        </Text>
        <Ionicons name="chevron-down" size={16} color={C.textMute} />
      </Pressable>

      {error ? (
        <View style={st.center}>
          <Text style={st.msg}>{t('quran.loadFail')}</Text>
          <Btn label={t('common.retry')} icon="refresh" onPress={load} />
        </View>
      ) : !surah ? (
        <View style={st.center}>
          <ActivityIndicator color={C.accent} size="large" />
        </View>
      ) : (
        <FlatList
          ref={listRef}
          data={surah.ayahs}
          keyExtractor={(a) => String(a.n)}
          contentContainerStyle={{ gap: S.md, paddingBottom: 40 }}
          onScrollBeginDrag={() => setFollow(false)}
          onMomentumScrollEnd={() => setFollow(true)}
          onScrollToIndexFailed={(e) => {
            listRef.current?.scrollToOffset({ offset: e.averageItemLength * e.index, animated: true });
          }}
          ListHeaderComponent={
            <View style={st.banner}>
              <Text style={st.bannerName}>{name}</Text>
              <Text style={st.bannerMeta}>{t('quran.ayahCount', { n: meta.ayahs })}</Text>
              {n !== 1 && n !== 9 && mode !== 'meal' ? (
                <Text style={[st.basmala, currentAyah === 0 && { color: C.accent }]}>{BASMALA}</Text>
              ) : null}
            </View>
          }
          renderItem={({ item }) => {
            const active = currentAyah === item.n;
            return (
              <View style={[st.ayah, active && st.ayahActive]}>
                <View style={st.ayahTop}>
                  <View style={[st.badge, active && { backgroundColor: C.accent }]}>
                    <Text style={[st.badgeText, active && { color: C.bgDeep }]}>{item.n}</Text>
                  </View>
                  <Pressable
                    hitSlop={10}
                    onPress={() => (active ? player.toggle() : player.playSurah(n, item.n))}>
                    <Ionicons
                      name={active && player.playing ? 'pause-circle' : 'play-circle-outline'}
                      size={28}
                      color={C.accent}
                    />
                  </Pressable>
                </View>
                {mode !== 'meal' ? <Text style={st.ar}>{item.ar}</Text> : null}
                {mode !== 'arapca' ? <Text style={st.tr}>{item.tr}</Text> : null}
              </View>
            );
          }}
          ListFooterComponent={<Text style={st.src}>{t('quran.mealSource', { source: MEAL_EDITIONS[lang].source })}</Text>}
        />
      )}

      <View style={{ marginHorizontal: -S.lg, marginBottom: -S.lg }}>
        <MiniPlayer hideLink />
      </View>

      <Modal visible={pickReciter} transparent animationType="fade" onRequestClose={() => setPickReciter(false)}>
        <Pressable style={st.backdrop} onPress={() => setPickReciter(false)}>
          <View style={st.sheet}>
            <Text style={st.sheetTitle}>{t('quran.pickReciter')}</Text>
            {RECITERS.map((r) => (
              <Pressable
                key={r.id}
                style={st.sheetRow}
                onPress={() => {
                  player.setReciter(r.id);
                  setPickReciter(false);
                }}>
                <Text style={st.sheetText}>{reciterName(r.id, lang)}</Text>
                {player.reciter === r.id ? <Ionicons name="checkmark" size={20} color={C.accent} /> : null}
              </Pressable>
            ))}
          </View>
        </Pressable>
      </Modal>
    </Screen>
  );
}

const st = StyleSheet.create({
  headerPlay: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: C.accent,
    alignItems: 'center',
    justifyContent: 'center',
  },
  toggle: { flexDirection: 'row', backgroundColor: C.card, borderRadius: R.md, padding: 4, gap: 4 },
  tBtn: { flex: 1, paddingVertical: 8, borderRadius: R.sm, alignItems: 'center' },
  tBtnOn: { backgroundColor: C.accent },
  tText: { color: C.textDim, fontSize: 13, fontWeight: '600' },
  reciterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: S.sm,
    backgroundColor: C.card,
    borderRadius: R.md,
    paddingVertical: 10,
    paddingHorizontal: S.md,
  },
  reciterText: { flex: 1, color: C.text, fontSize: 14 },
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
  ayah: { backgroundColor: C.card, borderRadius: R.md, padding: S.lg, gap: S.md, borderWidth: 1.5, borderColor: 'transparent' },
  ayahActive: { borderColor: C.accent, backgroundColor: C.cardSoft },
  ayahTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  badge: {
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
  backdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.55)', justifyContent: 'flex-end' },
  sheet: {
    backgroundColor: C.bgDeep,
    borderTopLeftRadius: R.lg,
    borderTopRightRadius: R.lg,
    padding: S.lg,
    paddingBottom: S.xl * 1.5,
    gap: 2,
  },
  sheetTitle: { color: C.text, fontSize: 18, fontWeight: '700', marginBottom: S.sm },
  sheetRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: C.border,
  },
  sheetText: { color: C.text, fontSize: 16 },
});
