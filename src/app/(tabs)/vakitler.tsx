import { useMemo } from 'react';
import { FlatList, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { C, R, S } from '@/constants/theme';
import { useAppState } from '@/lib/app-state';
import { addDays, DAYS_SHORT, formatShort, startOfDay } from '@/lib/dates';
import { toHijri } from '@/lib/hijri';
import { fmtTime, getDayTimes, PRAYERS } from '@/lib/prayer';
import { useNow } from '@/lib/use-now';

const DAYS = 30;

export default function VakitlerScreen() {
  const insets = useSafeAreaInsets();
  const { settings } = useAppState();
  const { place, hijriOffset } = settings;
  const now = useNow(60_000);
  const today = startOfDay(now).getTime();

  const rows = useMemo(() => {
    const start = new Date(today);
    return Array.from({ length: DAYS }, (_, i) => {
      const d = addDays(start, i);
      return { d, t: getDayTimes(place.lat, place.lng, d), h: toHijri(d, hijriOffset) };
    });
  }, [today, place.lat, place.lng, hijriOffset]);

  return (
    <View style={[st.root, { paddingTop: insets.top }]}>
      <View style={st.head}>
        <Text style={st.title}>Namaz Vakitleri</Text>
        <Text style={st.sub}>{place.name} · Önümüzdeki {DAYS} gün</Text>
      </View>

      <View style={[st.row, st.headerRow]}>
        <Text style={[st.dateCol, st.hText]}>Tarih</Text>
        {PRAYERS.map((p) => (
          <Text key={p.key} style={[st.cell, st.hText]}>
            {p.label}
          </Text>
        ))}
      </View>

      <FlatList
        data={rows}
        keyExtractor={(r) => String(r.d.getTime())}
        contentContainerStyle={{ paddingHorizontal: S.md, paddingBottom: 24 }}
        renderItem={({ item, index }) => {
          const isToday = index === 0;
          return (
            <View style={[st.row, isToday && st.todayRow, index % 2 === 1 && !isToday && st.altRow]}>
              <View style={st.dateCol}>
                <Text style={[st.date, isToday && st.todayText]}>
                  {formatShort(item.d)} {DAYS_SHORT[item.d.getDay()]}
                </Text>
                <Text style={[st.hijri, isToday && st.todayText]}>
                  {item.h.day} {item.h.monthName}
                </Text>
              </View>
              {PRAYERS.map((p) => (
                <Text key={p.key} style={[st.cell, st.time, isToday && st.todayText]}>
                  {fmtTime(item.t[p.key])}
                </Text>
              ))}
            </View>
          );
        }}
        ListFooterComponent={
          <Text style={st.note}>
            Vakitler Diyanet İşleri Başkanlığı'nın kullandığı yöntemle (imsak 18°, yatsı 17°, temkin
            süreleriyle) bulunduğun konuma göre hesaplanır. Resmî takvimle 1 dakikalık fark olabilir.
          </Text>
        }
      />
    </View>
  );
}

const st = StyleSheet.create({
  root: { flex: 1, backgroundColor: C.bg },
  head: { paddingHorizontal: S.lg, paddingTop: S.md, paddingBottom: S.md, gap: 4 },
  title: { color: C.text, fontSize: 22, fontWeight: '700' },
  sub: { color: C.textDim, fontSize: 13 },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: S.sm,
    borderRadius: R.sm,
  },
  headerRow: { marginHorizontal: S.md, backgroundColor: C.bgDeep },
  altRow: { backgroundColor: C.card },
  todayRow: { backgroundColor: C.accent },
  todayText: { color: C.bgDeep, fontWeight: '700' },
  hText: { color: C.textDim, fontSize: 11, fontWeight: '700' },
  dateCol: { width: 78 },
  date: { color: C.text, fontSize: 12, fontWeight: '600' },
  hijri: { color: C.textMute, fontSize: 10, marginTop: 1 },
  cell: { flex: 1, textAlign: 'center' },
  time: { color: C.text, fontSize: 12.5, fontVariant: ['tabular-nums'] },
  note: { color: C.textMute, fontSize: 12, lineHeight: 18, marginTop: S.lg, paddingHorizontal: S.sm },
});
