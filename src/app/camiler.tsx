import Ionicons from '@expo/vector-icons/Ionicons';
import * as Location from 'expo-location';
import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, FlatList, Linking, Platform, Pressable, StyleSheet, Text, View } from 'react-native';

import { Btn, Screen } from '@/components/ui';
import { C, R, S } from '@/constants/theme';
import { useAppState } from '@/lib/app-state';
import {
  directionName,
  findNearbyMosques,
  formatDistance,
  loadCachedMosques,
  walkMinutes,
  type Mosque,
} from '@/lib/mosques';

type Status = 'loading' | 'ok' | 'error' | 'empty';

export default function CamilerScreen() {
  const { settings } = useAppState();
  const [list, setList] = useState<Mosque[]>([]);
  const [status, setStatus] = useState<Status>('loading');
  const [note, setNote] = useState<string | null>(null);

  const load = useCallback(async () => {
    setStatus('loading');
    setNote(null);

    // Camiler için en güncel konum gerekir; alınamazsa kayıtlı konum kullanılır.
    let lat = settings.place.lat;
    let lng = settings.place.lng;
    try {
      const perm = await Location.getForegroundPermissionsAsync();
      if (perm.granted) {
        const pos = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.High });
        lat = pos.coords.latitude;
        lng = pos.coords.longitude;
      } else {
        setNote(`Konum izni yok, ${settings.place.name} çevresi gösteriliyor.`);
      }
    } catch {
      setNote('Anlık konum alınamadı, kayıtlı konum kullanılıyor.');
    }

    try {
      const res = await findNearbyMosques(lat, lng);
      setList(res);
      setStatus(res.length ? 'ok' : 'empty');
    } catch {
      const cached = await loadCachedMosques();
      if (cached?.list.length) {
        setList(cached.list);
        setStatus('ok');
        setNote('İnternete bağlanılamadı, en son bulunan camiler gösteriliyor.');
      } else {
        setStatus('error');
      }
    }
  }, [settings.place.lat, settings.place.lng, settings.place.name]);

  useEffect(() => {
    load();
  }, [load]);

  const refreshBtn = (
    <Pressable hitSlop={10} onPress={load}>
      <Ionicons name="refresh" size={22} color={C.text} />
    </Pressable>
  );

  return (
    <Screen title="Yakındaki Camiler" back scroll={false} right={refreshBtn}>
      {note ? <Text style={st.note}>{note}</Text> : null}

      {status === 'loading' ? (
        <View style={st.center}>
          <ActivityIndicator color={C.accent} size="large" />
          <Text style={st.msg}>Çevrendeki camiler aranıyor…</Text>
        </View>
      ) : status === 'error' ? (
        <View style={st.center}>
          <Ionicons name="cloud-offline-outline" size={40} color={C.textMute} />
          <Text style={st.msg}>Camiler yüklenemedi. İnternet bağlantını kontrol edip tekrar dene.</Text>
          <Btn label="Tekrar dene" icon="refresh" onPress={load} />
        </View>
      ) : status === 'empty' ? (
        <View style={st.center}>
          <Ionicons name="search-outline" size={40} color={C.textMute} />
          <Text style={st.msg}>6 km içinde haritada kayıtlı cami bulunamadı.</Text>
        </View>
      ) : (
        <FlatList
          data={list}
          keyExtractor={(m) => m.id}
          contentContainerStyle={{ gap: S.sm, paddingBottom: 30 }}
          renderItem={({ item, index }) => <MosqueRow m={item} nearest={index === 0} />}
          ListFooterComponent={
            <Text style={st.src}>Veriler: © OpenStreetMap katkıcıları. Uzaklıklar kuş uçuşudur.</Text>
          }
        />
      )}
    </Screen>
  );
}

function MosqueRow({ m, nearest }: { m: Mosque; nearest: boolean }) {
  const openDirections = () => {
    const label = encodeURIComponent(m.name);
    const web = `https://www.google.com/maps/dir/?api=1&destination=${m.lat},${m.lng}&travelmode=walking`;
    const native =
      Platform.OS === 'android' ? `geo:0,0?q=${m.lat},${m.lng}(${label})` : `maps:?daddr=${m.lat},${m.lng}&q=${label}`;
    // Google Haritalar bağlantısı yüklüyse uygulamada, değilse tarayıcıda açılır.
    Linking.openURL(web).catch(() => Linking.openURL(native).catch(() => {}));
  };

  return (
    <Pressable
      onPress={openDirections}
      style={({ pressed }) => [st.row, nearest && st.rowNearest, pressed && { opacity: 0.8 }]}>
      <View style={st.icon}>
        <Ionicons name="moon" size={20} color={C.gold} />
      </View>
      <View style={{ flex: 1, gap: 2 }}>
        <Text style={st.name} numberOfLines={2}>
          {m.name}
        </Text>
        {m.address ? (
          <Text style={st.addr} numberOfLines={1}>
            {m.address}
          </Text>
        ) : null}
        <Text style={st.meta}>
          {formatDistance(m.distance)} · {directionName(m.bearing)} · yürüyerek ~{walkMinutes(m.distance)} dk
        </Text>
      </View>
      <View style={st.go}>
        <Ionicons name="navigate" size={18} color={C.bgDeep} />
      </View>
    </Pressable>
  );
}

const st = StyleSheet.create({
  note: { color: C.gold, fontSize: 13 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: S.lg, padding: S.xl },
  msg: { color: C.textDim, textAlign: 'center', fontSize: 15, lineHeight: 22 },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: S.md,
    backgroundColor: C.card,
    borderRadius: R.md,
    padding: S.md,
    borderWidth: 1.5,
    borderColor: 'transparent',
  },
  rowNearest: { borderColor: C.accent },
  icon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: C.cardSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  name: { color: C.text, fontSize: 16, fontWeight: '700' },
  addr: { color: C.textDim, fontSize: 12.5 },
  meta: { color: C.accent, fontSize: 12.5, fontWeight: '600' },
  go: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: C.accent,
    alignItems: 'center',
    justifyContent: 'center',
  },
  src: { color: C.textMute, fontSize: 11.5, textAlign: 'center', marginTop: S.md },
});
