import Ionicons from '@expo/vector-icons/Ionicons';
import * as Location from 'expo-location';
import { useCallback, useEffect, useRef, useState } from 'react';
import { ActivityIndicator, FlatList, Linking, Platform, Pressable, StyleSheet, Text, View } from 'react-native';

import { Btn, Screen } from '@/components/ui';
import { C, R, S } from '@/constants/theme';
import { directionName, type StringKey } from '@/i18n';
import { useAppState, useT } from '@/lib/app-state';
import {
  distanceM,
  findNearbyMosques,
  formatDistance,
  loadCachedMosques,
  walkMinutes,
  type Mosque,
} from '@/lib/mosques';

type Status = 'loading' | 'ok' | 'error' | 'empty';

export default function CamilerScreen() {
  const { settings, lang } = useAppState();
  const t = useT();
  const [list, setList] = useState<Mosque[]>([]);
  const [status, setStatus] = useState<Status>('loading');
  const [refreshing, setRefreshing] = useState(false);
  const [note, setNote] = useState<{ key: StringKey; place?: string } | null>(null);
  const runId = useRef(0);

  const load = useCallback(async () => {
    const id = ++runId.current;
    setNote(null);

    // Son bulunan liste varsa beklemeden göster, arka planda tazele.
    const cached = await loadCachedMosques();
    const hasCache = !!cached?.list.length;
    if (hasCache) {
      setList(cached!.list);
      setStatus('ok');
      setRefreshing(true);
    } else {
      setStatus('loading');
    }

    // Camiler için en güncel konum gerekir; alınamazsa kayıtlı konum kullanılır.
    let lat = settings.place.lat;
    let lng = settings.place.lng;
    try {
      const perm = await Location.getForegroundPermissionsAsync();
      if (perm.granted) {
        const pos =
          (await Location.getLastKnownPositionAsync({ maxAge: 2 * 60 * 1000, requiredAccuracy: 200 })) ??
          (await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced }));
        lat = pos.coords.latitude;
        lng = pos.coords.longitude;
      } else {
        setNote({ key: 'mosques.noPerm', place: settings.place.name });
      }
    } catch {
      setNote({ key: 'mosques.noFix' });
    }

    // Önbellekteki liste yeni konuma göre yeniden sıralansın (yer değiştiyse)
    if (hasCache) {
      setList(
        cached!.list
          .map((m) => ({ ...m, distance: distanceM(lat, lng, m.lat, m.lng) }))
          .sort((a, b) => a.distance - b.distance),
      );
    }

    try {
      const res = await findNearbyMosques(lat, lng);
      if (id !== runId.current) return;
      setList(res);
      setStatus(res.length ? 'ok' : 'empty');
    } catch {
      if (id !== runId.current) return;
      if (hasCache) setNote({ key: 'mosques.offline' });
      else setStatus('error');
    } finally {
      if (id === runId.current) setRefreshing(false);
    }
  }, [settings.place.lat, settings.place.lng, settings.place.name]);

  useEffect(() => {
    load();
  }, [load]);

  const refreshBtn = (
    <Pressable hitSlop={10} onPress={load} disabled={refreshing || status === 'loading'}>
      {refreshing ? <ActivityIndicator color={C.text} /> : <Ionicons name="refresh" size={22} color={C.text} />}
    </Pressable>
  );

  return (
    <Screen title={t('mosques.title')} back scroll={false} right={refreshBtn}>
      {note ? <Text style={st.note}>{t(note.key, { place: note.place ?? '' })}</Text> : null}
      {refreshing ? <Text style={st.updating}>{t('mosques.updating')}</Text> : null}

      {status === 'loading' ? (
        <View style={st.center}>
          <ActivityIndicator color={C.accent} size="large" />
          <Text style={st.msg}>{t('mosques.searching')}</Text>
          <Text style={st.sub}>{t('mosques.slow')}</Text>
        </View>
      ) : status === 'error' ? (
        <View style={st.center}>
          <Ionicons name="cloud-offline-outline" size={40} color={C.textMute} />
          <Text style={st.msg}>{t('mosques.fail')}</Text>
          <Btn label={t('common.retry')} icon="refresh" onPress={load} />
        </View>
      ) : status === 'empty' ? (
        <View style={st.center}>
          <Ionicons name="search-outline" size={40} color={C.textMute} />
          <Text style={st.msg}>{t('mosques.empty')}</Text>
        </View>
      ) : (
        <FlatList
          data={list}
          keyExtractor={(m) => m.id}
          contentContainerStyle={{ gap: S.sm, paddingBottom: 30 }}
          renderItem={({ item, index }) => (
            <MosqueRow
              m={item}
              nearest={index === 0}
              meta={t('mosques.meta', {
                dist: formatDistance(item.distance),
                dir: directionName(item.bearing, lang),
                min: walkMinutes(item.distance),
              })}
            />
          )}
          ListFooterComponent={<Text style={st.src}>{t('mosques.source')}</Text>}
        />
      )}
    </Screen>
  );
}

function MosqueRow({ m, nearest, meta }: { m: Mosque; nearest: boolean; meta: string }) {
  const openDirections = () => {
    const label = encodeURIComponent(m.name);
    const web = `https://www.google.com/maps/dir/?api=1&destination=${m.lat},${m.lng}&travelmode=walking`;
    const native =
      Platform.OS === 'android' ? `geo:0,0?q=${m.lat},${m.lng}(${label})` : `maps:?daddr=${m.lat},${m.lng}&q=${label}`;
    // Google Haritalar yüklüyse uygulamada, değilse tarayıcıda açılır.
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
        <Text style={st.meta}>{meta}</Text>
      </View>
      <View style={st.go}>
        <Ionicons name="navigate" size={18} color={C.bgDeep} />
      </View>
    </Pressable>
  );
}

const st = StyleSheet.create({
  note: { color: C.gold, fontSize: 13 },
  updating: { color: C.textDim, fontSize: 12 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: S.lg, padding: S.xl },
  msg: { color: C.textDim, textAlign: 'center', fontSize: 15, lineHeight: 22 },
  sub: { color: C.textMute, textAlign: 'center', fontSize: 13, lineHeight: 19, marginTop: -S.sm },
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
