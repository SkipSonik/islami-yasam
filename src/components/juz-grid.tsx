import Ionicons from '@expo/vector-icons/Ionicons';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { R, useColors, makeStyles } from '@/constants/theme';

export type JuzCell = { state: 'free' | 'taken' | 'mine' | 'done'; caption?: string };

/** 30 cüzlük ızgara: okundu, okunuyor, senin, boş */
export function JuzGrid({
  cells,
  onPress,
  onLongPress,
}: {
  cells: JuzCell[];
  onPress: (juz: number) => void;
  onLongPress?: (juz: number) => void;
}) {
  const C = useColors();
  const st = useSt();
  return (
    <View style={st.grid}>
      {[0, 1, 2, 3, 4, 5].map((row) => (
        <View key={row} style={st.row}>
          {cells.slice(row * 5, row * 5 + 5).map((c, k) => {
        const i = row * 5 + k;
        const juz = i + 1;
        const bg =
          c.state === 'done' ? C.accent : c.state === 'mine' ? C.gold : c.state === 'taken' ? C.cardActive : C.bgDeep;
        const fg = c.state === 'done' || c.state === 'mine' ? C.onAccent : C.text;
        return (
          <Pressable
            key={juz}
            onPress={() => onPress(juz)}
            onLongPress={onLongPress ? () => onLongPress(juz) : undefined}
            style={({ pressed }) => [st.cell, { backgroundColor: bg, opacity: pressed ? 0.75 : 1 }]}>
            {c.state === 'done' ? (
              <Ionicons name="checkmark" size={14} color={fg} style={st.check} />
            ) : null}
            <Text style={[st.num, { color: fg }]}>{juz}</Text>
            {c.caption ? (
              <Text style={[st.cap, { color: fg }]} numberOfLines={1}>
                {c.caption}
              </Text>
            ) : null}
          </Pressable>
        );
          })}
        </View>
      ))}
    </View>
  );
}

const useSt = makeStyles((C) => ({
  grid: { gap: 6 },
  row: { flexDirection: 'row', gap: 6 },
  cell: {
    flex: 1,
    aspectRatio: 1,
    borderRadius: R.sm,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 2,
  },
  check: { position: 'absolute', top: 3, right: 4 },
  num: { fontSize: 18, fontWeight: '800' },
  cap: { fontSize: 9.5, fontWeight: '600', marginTop: 1 },
}));
