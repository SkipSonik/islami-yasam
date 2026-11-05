import Ionicons from '@expo/vector-icons/Ionicons';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { R, S, THEME_IDS, THEMES, useColors, type ThemeId } from '@/constants/theme';
import { useAppState, useT } from '@/lib/app-state';

/** Temaları küçük önizleme kartlarıyla gösterir. */
export function ThemePicker() {
  const C = useColors();
  const { settings, update } = useAppState();
  const t = useT();

  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: S.md, paddingVertical: 2 }}>
      {THEME_IDS.map((id: ThemeId) => {
        const p = THEMES[id];
        const on = settings.theme === id;
        return (
          <Pressable key={id} onPress={() => update({ theme: id })} style={{ alignItems: 'center', gap: 6 }}>
            <View style={[st.preview, { backgroundColor: p.bg, borderColor: on ? C.accent : C.border }]}>
              {/* süs: üstte küçük hilal ve yıldız */}
              <View style={st.topRow}>
                <Ionicons name="moon" size={13} color={p.ornament} />
                <View style={[st.dot, { backgroundColor: p.gold }]} />
              </View>
              <View style={[st.card, { backgroundColor: p.card }]}>
                <View style={[st.line, { backgroundColor: p.text, width: '70%' }]} />
                <View style={[st.line, { backgroundColor: p.textDim, width: '45%' }]} />
              </View>
              <View style={[st.cardSmall, { backgroundColor: p.cardSoft }]}>
                <View style={[st.line, { backgroundColor: p.textMute, width: '55%' }]} />
              </View>
              <View style={[st.btn, { backgroundColor: p.accent }]}>
                <View style={[st.line, { backgroundColor: p.onAccent, width: '40%', opacity: 0.85 }]} />
              </View>
              {on ? (
                <View style={[st.check, { backgroundColor: C.accent }]}>
                  <Ionicons name="checkmark" size={13} color={C.onAccent} />
                </View>
              ) : null}
            </View>
            <Text style={{ color: on ? C.accent : C.textDim, fontWeight: on ? '800' : '600', fontSize: 13 }}>
              {t(`theme.${id}`)}
            </Text>
          </Pressable>
        );
      })}
    </ScrollView>
  );
}

const st = StyleSheet.create({
  preview: { width: 84, height: 132, borderRadius: R.md, borderWidth: 2, padding: 8, gap: 6, overflow: 'hidden' },
  topRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  dot: { width: 6, height: 6, borderRadius: 3 },
  card: { borderRadius: 6, padding: 6, gap: 4 },
  cardSmall: { borderRadius: 6, padding: 6 },
  line: { height: 4, borderRadius: 2 },
  btn: { borderRadius: 8, paddingVertical: 6, alignItems: 'center', marginTop: 'auto' },
  check: {
    position: 'absolute',
    top: 6,
    right: 6,
    width: 20,
    height: 20,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
