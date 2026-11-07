import Ionicons from '@expo/vector-icons/Ionicons';
import { router } from 'expo-router';
import { useMemo, useState } from 'react';
import { ActivityIndicator, FlatList, Pressable, Text, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { FocusPressable } from '@/components/focus-pressable';
import { R, S, makeStyles, useColors } from '@/constants/theme';
import { CITIES, type City } from '@/data/cities';
import { useAppState, useT } from '@/lib/app-state';
import { IS_TV } from '@/lib/layout';

// Türkçe karakterleri sadeleştirip arar (ör. "istanbul" → İstanbul, "cankiri" → Çankırı)
const norm = (s: string) =>
  s
    .toLocaleLowerCase('tr')
    .replace(
      /[çğıöşüâîû]/g,
      (c) =>
        ({
          ç: 'c',
          ğ: 'g',
          ı: 'i',
          ö: 'o',
          ş: 's',
          ü: 'u',
          â: 'a',
          î: 'i',
          û: 'u',
        })[c] ?? c,
    )
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '');

const INDEX = CITIES.map((c) => ({ c, key: norm(c[0]) }));

export default function SehirScreen() {
  const C = useColors();
  const st = useSt();
  const t = useT();
  const insets = useSafeAreaInsets();
  const { update, refreshLocation, settings } = useAppState();
  const [q, setQ] = useState('');
  const [busy, setBusy] = useState(false);

  const list = useMemo(() => {
    const n = norm(q.trim());
    if (!n) return CITIES.slice(0, 120);
    return INDEX.filter((x) => x.key.includes(n))
      .sort((a, b) => Number(!a.key.startsWith(n)) - Number(!b.key.startsWith(n)))
      .slice(0, 120)
      .map((x) => x.c);
  }, [q]);

  const choose = (c: City) => {
    update({
      place: { name: c[0], country: c[1], lat: c[2], lng: c[3], auto: false },
      hasLocated: true,
    });
    router.back();
  };

  const useDevice = async () => {
    setBusy(true);
    const r = await refreshLocation();
    setBusy(false);
    if (r === 'ok') router.back();
  };

  return (
    <View
      style={[
        st.root,
        {
          paddingTop: insets.top,
          paddingLeft: insets.left,
          paddingRight: insets.right,
        },
      ]}>
      <View style={st.frame}>
        <View style={st.header}>
          <Pressable hitSlop={12} onPress={() => router.back()} style={st.back}>
            <Ionicons name="arrow-back" size={22} color={C.text} />
          </Pressable>
          <Text style={st.title}>{t('city.title')}</Text>
        </View>
        <View style={st.search}>
          <Ionicons name="search" size={18} color={C.textMute} />
          <TextInput
            value={q}
            onChangeText={setQ}
            placeholder={t('city.search')}
            placeholderTextColor={C.textMute}
            style={st.input}
            autoFocus={!IS_TV}
          />
        </View>
        <FocusPressable onPress={useDevice} style={st.device} focusStyle={st.focus}>
          {busy ? <ActivityIndicator color={C.accent} /> : <Ionicons name="locate" size={20} color={C.accent} />}
          <Text style={st.deviceText}>{t('city.useDevice')}</Text>
        </FocusPressable>
        <FlatList
          data={list}
          keyExtractor={(c) => `${c[0]}-${c[1]}-${c[2]}`}
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={{
            gap: S.sm,
            paddingBottom: insets.bottom + 24,
          }}
          renderItem={({ item }) => {
            const on = settings.place.name === item[0] && settings.place.lat === item[2];
            return (
              <FocusPressable
                onPress={() => choose(item)}
                style={[st.row, on && { borderColor: C.accent }]}
                focusStyle={st.focus}>
                <Text style={st.name}>{item[0]}</Text>
                <Text style={st.country}>{item[1]}</Text>
              </FocusPressable>
            );
          }}
        />
      </View>
    </View>
  );
}

const useSt = makeStyles((C) => ({
  root: { flex: 1, backgroundColor: C.bg },
  frame: {
    flex: 1,
    width: '100%',
    maxWidth: 760,
    alignSelf: 'center',
    paddingHorizontal: S.lg,
    gap: S.md,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: S.md,
    paddingVertical: S.md,
  },
  back: { minWidth: 32, alignItems: 'center' },
  title: { color: C.text, fontSize: 22, fontWeight: '700', flex: 1 },
  search: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: S.sm,
    backgroundColor: C.card,
    borderRadius: R.md,
    paddingHorizontal: S.md,
  },
  input: { flex: 1, color: C.text, fontSize: 16, paddingVertical: 12 },
  device: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: S.sm,
    padding: S.md,
    borderRadius: R.md,
    backgroundColor: C.cardSoft,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  deviceText: { color: C.text, fontWeight: '700', fontSize: 15 },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: S.md,
    borderRadius: R.md,
    backgroundColor: C.card,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  focus: { borderColor: C.gold, backgroundColor: C.cardActive },
  name: { color: C.text, fontSize: 16, fontWeight: '600', flex: 1 },
  country: { color: C.textMute, fontSize: 13, fontWeight: '700' },
}));
