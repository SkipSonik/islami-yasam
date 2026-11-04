import { memo, useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';

import { t } from '@/i18n';
import { BASMALA } from '@/lib/quran';
import {
  arabicDigits,
  loadPageText,
  pageLayout,
  surahArabicName,
  type MushafTheme,
  type PageText,
} from '@/lib/mushaf';

export const QURAN_FONT = 'AmiriQuran_400Regular';

const BASE = 24; // ölçüm için kullanılan yazı boyutu
const LINE_RATIO = 1.92; // satır yüksekliği / yazı boyutu
const SLOTS = 15; // Medine mushafında sayfa başına satır

// Sayfa başına hesaplanan yazı boyutu ve satır genişlikleri (tekrar ölçmemek için)
const sizeCache = new Map<string, { fontSize: number; narrow: boolean[] }>();

type Props = {
  page: number;
  width: number;
  height: number;
  theme: MushafTheme;
  highlight: { surah: number; ayah: number } | null;
  onAyahPress: (surah: number, ayah: number, text: PageText) => void;
};

export const MushafPage = memo(function MushafPage({ page, width, height, theme, highlight, onAyahPress }: Props) {
  const layout = pageLayout(page);
  const [text, setText] = useState<PageText | null>(null);
  const [failed, setFailed] = useState(false);
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    let alive = true;
    setFailed(false);
    loadPageText(page)
      .then((t) => alive && setText(t))
      .catch(() => alive && setFailed(true));
    return () => {
      alive = false;
    };
  }, [page, attempt]);

  // Çerçeve içindeki kullanılabilir alan
  const frameW = width - 20;
  const innerW = frameW - 28;
  const innerH = height - 20 - 28 - 26; // dış boşluk, çerçeve, sayfa numarası

  const cacheKey = `${page}:${Math.round(innerW)}:${Math.round(innerH)}`;
  const [measured, setMeasured] = useState(() => sizeCache.get(cacheKey) ?? null);

  // Ölçülecek satır metinleri
  const lineTexts = useMemo(() => {
    if (!text) return null;
    return layout.l.map((ln) => {
      if (!('w' in ln)) return null;
      const parts: string[] = [];
      for (const [s, a, from, to, ends] of ln.w) {
        const words = text.words(s, a);
        for (let i = from; i <= to; i++) if (words[i]) parts.push(words[i]);
        if (ends) parts.push(marker(a));
      }
      return parts.join(' ');
    });
  }, [text, layout]);

  const widths = useMemo(() => new Map<number, number>(), [lineTexts]); // eslint-disable-line react-hooks/exhaustive-deps

  const onMeasure = (i: number, w: number) => {
    if (measured || !lineTexts) return;
    widths.set(i, w);
    const need = lineTexts.filter((t) => t != null).length;
    if (widths.size < need) return;
    const max = Math.max(...widths.values());
    const byWidth = (BASE * innerW * 0.97) / max;
    const byHeight = innerH / (SLOTS * LINE_RATIO);
    const fontSize = Math.max(12, Math.min(byWidth, byHeight));
    const narrow = lineTexts.map((t, idx) => t != null && (widths.get(idx) ?? max) < max * 0.72);
    const m = { fontSize, narrow };
    sizeCache.set(cacheKey, m);
    setMeasured(m);
  };

  const centered = layout.c === 1;

  return (
    <View style={{ width, height, backgroundColor: theme.bg, padding: 10 }}>
      <View style={[st.frame, { borderColor: theme.frame, backgroundColor: theme.page }]}>
        <View style={[st.frameInner, { borderColor: theme.frameInner }]}>
          {failed ? (
            <View style={st.center}>
              <Text style={[st.msg, { color: theme.dim }]}>{t('mushaf.pageFail')}</Text>
              <Pressable onPress={() => setAttempt((x) => x + 1)} style={[st.retry, { borderColor: theme.frame }]}>
                <Text style={{ color: theme.headerText, fontWeight: '700' }}>{t('common.retry')}</Text>
              </Pressable>
            </View>
          ) : !text || !lineTexts || !measured ? (
            <View style={st.center}>
              <ActivityIndicator color={theme.frame} />
            </View>
          ) : (
            <View style={[st.lines, centered && { justifyContent: 'center', gap: measured.fontSize * 0.6 }]}>
              {layout.l.map((ln, i) => {
                const fs = measured.fontSize;
                const lh = fs * LINE_RATIO;
                if ('h' in ln) {
                  return (
                    <View key={i} style={{ height: lh, justifyContent: 'center' }}>
                      <View style={[st.header, { borderColor: theme.frame, backgroundColor: theme.header, height: lh * 0.82 }]}>
                        <View style={[st.headerDot, { backgroundColor: theme.frame }]} />
                        <Text
                          style={[
                            st.headerText,
                            { color: theme.headerText, fontSize: fs * 0.95, lineHeight: lh * 0.8, fontFamily: QURAN_FONT },
                          ]}>
                          سُورَةُ {surahArabicName(ln.h)}
                        </Text>
                        <View style={[st.headerDot, { backgroundColor: theme.frame }]} />
                      </View>
                    </View>
                  );
                }
                if ('b' in ln) {
                  // Besmele, hemen üstündeki sure başlığına aittir; hafız onu okurken vurgula.
                  const prev = layout.l[i - 1];
                  const owner = prev && 'h' in prev ? prev.h : null;
                  const on = highlight?.ayah === 0 && highlight.surah === owner;
                  return (
                    <View key={i} style={{ height: lh, justifyContent: 'center', alignItems: 'center' }}>
                      <Text
                        style={[
                          st.basmala,
                          {
                            color: on ? theme.hlText : theme.text,
                            backgroundColor: on ? theme.hlBg : 'transparent',
                            fontSize: fs * 1.02,
                            fontFamily: QURAN_FONT,
                          },
                        ]}>
                        {BASMALA}
                      </Text>
                    </View>
                  );
                }
                const spread = !centered && !measured.narrow[i];
                return (
                  <View
                    key={i}
                    style={[
                      st.line,
                      { height: lh },
                      spread ? { justifyContent: 'space-between' } : { justifyContent: 'center', gap: fs * 0.3 },
                    ]}>
                    {ln.w.flatMap(([s, a, from, to, ends]) => {
                      const words = text.words(s, a);
                      const active = highlight?.surah === s && highlight.ayah === a;
                      const press = () => onAyahPress(s, a, text);
                      const color = active ? theme.hlText : theme.text;
                      const bg = active ? theme.hlBg : 'transparent';
                      const items = [];
                      for (let w = from; w <= to; w++) {
                        if (!words[w]) continue;
                        items.push(
                          <Text
                            key={`${s}:${a}:${w}`}
                            onPress={press}
                            style={{ fontFamily: QURAN_FONT, fontSize: fs, color, backgroundColor: bg, lineHeight: lh }}>
                            {words[w]}
                          </Text>,
                        );
                      }
                      if (ends) {
                        items.push(
                          <Text
                            key={`${s}:${a}:end`}
                            onPress={press}
                            style={{
                              fontFamily: QURAN_FONT,
                              fontSize: fs,
                              color: active ? theme.hlText : theme.marker,
                              backgroundColor: bg,
                              lineHeight: lh,
                            }}>
                            {marker(a)}
                          </Text>,
                        );
                      }
                      return items;
                    })}
                  </View>
                );
              })}
            </View>
          )}

          {/* Görünmez ölçüm katmanı: satırların doğal genişliğini bulur */}
          {lineTexts && !measured ? (
            <View style={st.measure} pointerEvents="none">
              {lineTexts.map((t, i) =>
                t == null ? null : (
                  <Text
                    key={i}
                    style={{ fontFamily: QURAN_FONT, fontSize: BASE, alignSelf: 'flex-start' }}
                    onLayout={(e) => onMeasure(i, e.nativeEvent.layout.width)}>
                    {t}
                  </Text>
                ),
              )}
            </View>
          ) : null}
        </View>
      </View>
      <Text style={[st.pageNo, { color: theme.dim }]}>{arabicDigits(page)}</Text>
    </View>
  );
});

function marker(ayah: number) {
  return `۝${arabicDigits(ayah)}`;
}

const st = StyleSheet.create({
  frame: { flex: 1, borderWidth: 3, borderRadius: 6, padding: 4 },
  frameInner: { flex: 1, borderWidth: 1, borderRadius: 3, paddingHorizontal: 10, paddingVertical: 8, overflow: 'hidden' },
  lines: { flex: 1, justifyContent: 'space-evenly' },
  line: { flexDirection: 'row-reverse', alignItems: 'center' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1.5,
    borderRadius: 10,
    paddingHorizontal: 12,
  },
  headerDot: { width: 8, height: 8, borderRadius: 4, transform: [{ rotate: '45deg' }] },
  headerText: { textAlign: 'center', flex: 1 },
  basmala: { textAlign: 'center' },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 16, padding: 20 },
  msg: { textAlign: 'center', fontSize: 15, lineHeight: 22 },
  retry: { borderWidth: 1.5, borderRadius: 10, paddingHorizontal: 16, paddingVertical: 8 },
  measure: { position: 'absolute', top: 0, left: 0, width: 4000, opacity: 0 },
  pageNo: { textAlign: 'center', fontSize: 12, marginTop: 6, height: 16 },
});
