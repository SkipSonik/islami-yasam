import Ionicons from '@expo/vector-icons/Ionicons';
import { router, useLocalSearchParams } from 'expo-router';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  FlatList,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
  type ListViewToken,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { MiniPlayer } from '@/components/mini-player';
import { MushafPage, QURAN_FONT } from '@/components/mushaf-page';
import { R, S } from '@/constants/theme';
import { SURAHS } from '@/data/surahs';
import {
  firstAyahOnPage,
  juzOf,
  MUSHAF_THEMES,
  pageLayout,
  pageOf,
  TOTAL_PAGES,
  type MushafTheme,
  type PageText,
} from '@/lib/mushaf';
import { useQuranPlayer } from '@/lib/quran-player';
import { loadValue, saveJSON } from '@/lib/storage';

const PAGES = Array.from({ length: TOTAL_PAGES }, (_, i) => i + 1);
export const LAST_PAGE_KEY = 'mushaf-son-sayfa';

type Selected = { surah: number; ayah: number; meal: string; words: string };

export default function MushafScreen() {
  const params = useLocalSearchParams<{ sayfa?: string; sure?: string; ayet?: string }>();
  const insets = useSafeAreaInsets();
  const { width, height } = useWindowDimensions();
  const player = useQuranPlayer();

  const startPage = useMemo(() => {
    if (params.sure) return pageOf(Number(params.sure), Number(params.ayet) || 1);
    if (params.sayfa) return Math.min(TOTAL_PAGES, Math.max(1, Number(params.sayfa) || 1));
    return null; // son kalınan sayfa yüklenecek
  }, [params.sure, params.ayet, params.sayfa]);

  const [page, setPage] = useState<number | null>(startPage);
  const [themeId, setThemeId] = useState<MushafTheme['id']>('krem');
  const [follow, setFollow] = useState(true);
  const [selected, setSelected] = useState<Selected | null>(null);
  const [showThemes, setShowThemes] = useState(false);
  const listRef = useRef<FlatList<number>>(null);
  const theme = MUSHAF_THEMES.find((t) => t.id === themeId) ?? MUSHAF_THEMES[0];

  useEffect(() => {
    loadValue<MushafTheme['id']>('mushaf-tema', 'krem').then(setThemeId);
    if (startPage == null) loadValue<number>(LAST_PAGE_KEY, 1).then((p) => setPage(p || 1));
  }, [startPage]);

  const headerH = 56;
  const playerH = player.surah != null ? 64 : 0;
  const pageH = height - insets.top - insets.bottom - headerH - playerH;

  // Belirli bir ayetle açıldıysa (ör. günün ayeti) o ayet, dinleme başlayana kadar vurgulu kalır.
  const linked = params.sure && params.ayet ? { surah: Number(params.sure), ayah: Number(params.ayet) } : null;
  // Okunan ayet başka bir sayfadaysa oraya geç.
  const playing = player.surah != null && player.ayah != null ? { surah: player.surah, ayah: player.ayah } : null;
  const hl = playing ?? linked;
  const hlPage = playing ? pageOf(playing.surah, Math.max(1, playing.ayah)) : null;
  useEffect(() => {
    if (!follow || hlPage == null || page == null || hlPage === page) return;
    listRef.current?.scrollToIndex({ index: hlPage - 1, animated: true });
  }, [hlPage, follow]); // eslint-disable-line react-hooks/exhaustive-deps

  const onViewable = useRef(({ viewableItems }: { viewableItems: ListViewToken[] }) => {
    const v = viewableItems[0]?.item;
    if (typeof v === 'number') {
      setPage(v);
      saveJSON(LAST_PAGE_KEY, v);
    }
  }).current;

  const onAyahPress = useCallback((surah: number, ayah: number, text: PageText) => {
    setSelected({ surah, ayah, meal: text.meal(surah, ayah), words: text.words(surah, ayah).filter(Boolean).join(' ') });
  }, []);

  const playFromPage = () => {
    if (page == null) return;
    if (player.surah != null && hlPage === page) return player.toggle();
    const first = firstAyahOnPage(page);
    if (first) {
      setFollow(true);
      player.playSurah(first.surah, first.ayah, true);
    }
  };

  const firstOnPage = page ? firstAyahOnPage(page) : null;
  const surahName = firstOnPage ? SURAHS[firstOnPage.surah - 1].name : '';
  // Sayfada başlayan bir sure varsa onun adını göster
  const headerSurah = (() => {
    if (!page) return surahName;
    const h = pageLayout(page).l.find((l) => 'h' in l) as { h: number } | undefined;
    return h ? SURAHS[h.h - 1].name : surahName;
  })();

  const playingHere = player.surah != null && player.playing && hlPage === page;

  if (page == null) return <View style={{ flex: 1, backgroundColor: theme.bg }} />;

  return (
    <View style={{ flex: 1, backgroundColor: theme.bg, paddingTop: insets.top, paddingBottom: insets.bottom }}>
      <View style={[st.header, { height: headerH, borderBottomColor: theme.frame }]}>
        <Pressable hitSlop={12} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={22} color={theme.headerText} />
        </Pressable>
        <View style={{ flex: 1 }}>
          <Text style={[st.title, { color: theme.headerText }]} numberOfLines={1}>
            {headerSurah} Suresi
          </Text>
          <Text style={[st.sub, { color: theme.dim }]}>
            Sayfa {page} · {juzOf(page)}. cüz
          </Text>
        </View>
        {!follow && player.surah != null ? (
          <Pressable hitSlop={8} onPress={() => setFollow(true)} style={[st.chip, { borderColor: theme.frame }]}>
            <Text style={{ color: theme.headerText, fontSize: 12, fontWeight: '700' }}>Takip et</Text>
          </Pressable>
        ) : null}
        <Pressable hitSlop={10} onPress={() => setShowThemes(true)}>
          <Ionicons name="color-palette-outline" size={22} color={theme.headerText} />
        </Pressable>
        <Pressable hitSlop={10} onPress={playFromPage} style={[st.play, { backgroundColor: theme.frameInner }]}>
          <Ionicons name={playingHere ? 'pause' : 'play'} size={18} color="#fff" />
        </Pressable>
      </View>

      <FlatList
        ref={listRef}
        data={PAGES}
        keyExtractor={(p) => String(p)}
        horizontal
        inverted // sağdan sola: sonraki sayfa solda, kitap gibi
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        initialScrollIndex={page - 1}
        getItemLayout={(_, i) => ({ length: width, offset: width * i, index: i })}
        windowSize={3}
        initialNumToRender={1}
        maxToRenderPerBatch={2}
        onScrollBeginDrag={() => setFollow(false)}
        onViewableItemsChanged={onViewable}
        viewabilityConfig={{ itemVisiblePercentThreshold: 60 }}
        renderItem={({ item }) => (
          <MushafPage
            page={item}
            width={width}
            height={pageH}
            theme={theme}
            highlight={hl}
            onAyahPress={onAyahPress}
          />
        )}
      />

      <MiniPlayer hideLink />

      {/* Ayete dokununca: meal ve dinleme */}
      <Modal visible={selected != null} transparent animationType="slide" onRequestClose={() => setSelected(null)}>
        <Pressable style={st.backdrop} onPress={() => setSelected(null)}>
          <Pressable style={[st.sheet, { backgroundColor: theme.page, borderColor: theme.frame }]} onPress={() => {}}>
            {selected ? (
              <>
                <Text style={[st.sheetTitle, { color: theme.headerText }]}>
                  {SURAHS[selected.surah - 1].name} Suresi, {selected.ayah}. ayet
                </Text>
                <ScrollView style={{ maxHeight: height * 0.45 }} contentContainerStyle={{ gap: S.md }}>
                  <Text style={[st.sheetAr, { color: theme.text, fontFamily: QURAN_FONT }]}>{selected.words}</Text>
                  <Text style={[st.sheetTr, { color: theme.text }]}>
                    {selected.meal || 'Meal yüklenemedi.'}
                  </Text>
                  <Text style={[st.src, { color: theme.dim }]}>Meal: Diyanet İşleri Başkanlığı</Text>
                </ScrollView>
                <View style={st.sheetBtns}>
                  <Pressable
                    style={[st.sheetBtn, { backgroundColor: theme.frameInner }]}
                    onPress={() => {
                      setFollow(true);
                      player.playSurah(selected.surah, selected.ayah, true);
                      setSelected(null);
                    }}>
                    <Ionicons name="play" size={18} color="#fff" />
                    <Text style={st.sheetBtnText}>Buradan dinle</Text>
                  </Pressable>
                  <Pressable
                    style={[st.sheetBtn, { backgroundColor: 'transparent', borderWidth: 1.5, borderColor: theme.frame }]}
                    onPress={() => setSelected(null)}>
                    <Text style={[st.sheetBtnText, { color: theme.headerText }]}>Kapat</Text>
                  </Pressable>
                </View>
              </>
            ) : null}
          </Pressable>
        </Pressable>
      </Modal>

      {/* Tema seçimi */}
      <Modal visible={showThemes} transparent animationType="fade" onRequestClose={() => setShowThemes(false)}>
        <Pressable style={st.backdrop} onPress={() => setShowThemes(false)}>
          <View style={[st.sheet, { backgroundColor: theme.page, borderColor: theme.frame }]}>
            <Text style={[st.sheetTitle, { color: theme.headerText }]}>Sayfa teması</Text>
            <View style={{ flexDirection: 'row', gap: S.md }}>
              {MUSHAF_THEMES.map((t) => (
                <Pressable
                  key={t.id}
                  onPress={() => {
                    setThemeId(t.id);
                    saveJSON('mushaf-tema', t.id);
                    setShowThemes(false);
                  }}
                  style={[
                    st.themeCard,
                    { backgroundColor: t.page, borderColor: t.id === theme.id ? t.frameInner : t.frame },
                    t.id === theme.id && { borderWidth: 3 },
                  ]}>
                  <Text style={{ fontFamily: QURAN_FONT, fontSize: 22, color: t.text }}>بِسْمِ ٱللَّهِ</Text>
                  <Text style={{ color: t.headerText, fontWeight: '700', marginTop: 4 }}>{t.name}</Text>
                </Pressable>
              ))}
            </View>
          </View>
        </Pressable>
      </Modal>
    </View>
  );
}

const st = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: S.md,
    paddingHorizontal: S.lg,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  title: { fontSize: 17, fontWeight: '800' },
  sub: { fontSize: 12, marginTop: 1 },
  chip: { borderWidth: 1.5, borderRadius: 14, paddingHorizontal: 10, paddingVertical: 4 },
  play: { width: 34, height: 34, borderRadius: 17, alignItems: 'center', justifyContent: 'center' },
  backdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.45)', justifyContent: 'flex-end' },
  sheet: {
    borderTopLeftRadius: R.lg,
    borderTopRightRadius: R.lg,
    borderTopWidth: 2,
    padding: S.lg,
    paddingBottom: S.xl * 1.5,
    gap: S.md,
  },
  sheetTitle: { fontSize: 17, fontWeight: '800' },
  sheetAr: { fontSize: 26, lineHeight: 50, textAlign: 'right', writingDirection: 'rtl' },
  sheetTr: { fontSize: 16, lineHeight: 24 },
  src: { fontSize: 12 },
  sheetBtns: { flexDirection: 'row', gap: S.md },
  sheetBtn: {
    flex: 1,
    flexDirection: 'row',
    gap: S.sm,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 13,
    borderRadius: R.md,
  },
  sheetBtnText: { color: '#fff', fontWeight: '700', fontSize: 15 },
  themeCard: { flex: 1, alignItems: 'center', paddingVertical: S.lg, borderRadius: R.md, borderWidth: 1.5 },
});
