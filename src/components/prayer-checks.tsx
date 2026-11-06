import Ionicons from '@expo/vector-icons/Ionicons';
import * as Haptics from 'expo-haptics';
import { Pressable, Text, View } from 'react-native';

import { R, makeStyles, useColors } from '@/constants/theme';
import { useT } from '@/lib/app-state';
import { FARZ, isPrayed, togglePrayer, trackerStore, type Farz } from '@/lib/tracker';

/** Bir günün beş vakti için "kıldım" düğmeleri. */
export function PrayerChecks({
  day,
  isFuture,
  compact,
}: {
  day: Date;
  /** Henüz vakti girmemiş namaz işaretlenemez */
  isFuture?: (f: Farz) => boolean;
  compact?: boolean;
}) {
  const C = useColors();
  const st = useSt();
  const t = useT();
  const data = trackerStore.useValue();
  return (
    <View style={st.row}>
      {FARZ.map((f) => {
        const done = isPrayed(data, day, f);
        const future = isFuture?.(f) ?? false;
        return (
          <Pressable
            key={f}
            disabled={future && !done}
            onPress={() => {
              Haptics.impactAsync(done ? Haptics.ImpactFeedbackStyle.Light : Haptics.ImpactFeedbackStyle.Medium);
              togglePrayer(day, f);
            }}
            style={({ pressed }) => [st.item, pressed && { opacity: 0.7 }, future && !done && { opacity: 0.35 }]}>
            <View style={[st.circle, compact && st.circleSm, done && st.circleOn]}>
              {done ? <Ionicons name="checkmark" size={compact ? 16 : 20} color={C.onAccent} /> : null}
            </View>
            <Text style={[st.label, done && { color: C.text }]} numberOfLines={1}>
              {t(`tracker.${f}`)}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const useSt = makeStyles((C) => ({
  row: { flexDirection: 'row', justifyContent: 'space-between' },
  item: { alignItems: 'center', gap: 5, flex: 1 },
  circle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: C.border,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: C.bgDeep,
  },
  circleSm: { width: 32, height: 32, borderRadius: R.lg },
  circleOn: { backgroundColor: C.accent, borderColor: C.accent },
  label: { color: C.textDim, fontSize: 12, fontWeight: '600' },
}));
