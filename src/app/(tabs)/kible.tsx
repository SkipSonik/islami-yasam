import Ionicons from '@expo/vector-icons/Ionicons';
import * as Haptics from 'expo-haptics';
import * as Location from 'expo-location';
import { useIsFocused } from 'expo-router';
import { memo, useEffect, useRef, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { Btn, Card, Screen } from '@/components/ui';
import { C, S } from '@/constants/theme';
import { locale } from '@/i18n';
import { useAppState, useT } from '@/lib/app-state';
import { qiblaDirection } from '@/lib/prayer';
import { useCompass } from '@/lib/use-compass';

const SIZE = 280;

export default function KibleScreen() {
  const focused = useIsFocused();
  const { settings, refreshLocation, lang } = useAppState();
  const t = useT();
  const { place } = settings;
  const qibla = qiblaDirection(place.lat, place.lng);

  const [perm, setPerm] = useState<'unknown' | 'granted' | 'denied'>('unknown');
  const wasAligned = useRef(false);

  useEffect(() => {
    if (!focused) return;
    Location.requestForegroundPermissionsAsync().then((p) => setPerm(p.status === 'granted' ? 'granted' : 'denied'));
  }, [focused]);

  const { heading, accuracy, interference, faceDown } = useCompass(focused && perm === 'granted');

  // Telefonun baktığı yön ile kıble arasındaki fark (-180..180)
  const diff = heading == null ? null : ((qibla - heading + 540) % 360) - 180;
  const aligned = diff != null && Math.abs(diff) < 4 && !faceDown;

  useEffect(() => {
    if (aligned && !wasAligned.current) Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    wasAligned.current = aligned;
  }, [aligned]);

  if (perm === 'denied') {
    return (
      <Screen title={t('qibla.title')}>
        <Card style={{ alignItems: 'center' }}>
          <Ionicons name="location-outline" size={40} color={C.gold} />
          <Text style={st.title}>{t('qibla.needPerm')}</Text>
          <Text style={st.text}>{t('qibla.needPermText')}</Text>
          <Btn
            label={t('common.grant')}
            icon="location"
            onPress={() => refreshLocation().then((r) => setPerm(r === 'denied' ? 'denied' : 'granted'))}
          />
        </Card>
      </Screen>
    );
  }

  const status =
    heading == null
      ? t('qibla.waiting')
      : faceDown
        ? t('qibla.faceDown')
        : aligned
          ? t('qibla.aligned')
          : diff! > 0
            ? t('qibla.turnRight', { deg: Math.round(diff!) })
            : t('qibla.turnLeft', { deg: Math.round(-diff!) });

  return (
    <Screen title={t('qibla.title')}>
      <View style={{ alignItems: 'center', gap: S.lg }}>
        <Ionicons name="caret-down" size={28} color={aligned ? C.accent : C.text} style={{ marginBottom: -S.md }} />
        <View style={[st.dial, aligned && { borderColor: C.accent }]}>
          <View style={[StyleSheet.absoluteFill, { transform: [{ rotate: `${-(heading ?? 0)}deg` }] }]}>
            <DialFace qibla={qibla} cardinals={locale(lang).cal.cardinals} />
          </View>
          <View style={st.hub} />
        </View>

        <View style={{ alignItems: 'center', gap: 4 }}>
          <Text style={[st.big, aligned && { color: C.accent }]}>{status}</Text>
          <Text style={st.text}>
            {t('qibla.angle', { q: Math.round(qibla), h: heading == null ? '–' : `${Math.round(heading)}°` })}
          </Text>
          <Text style={st.text}>{place.name}</Text>
        </View>

        {interference && heading != null ? (
          <Card style={{ alignSelf: 'stretch' }}>
            <Text style={st.warn}>{t('qibla.interference')}</Text>
          </Card>
        ) : accuracy < 2 && heading != null ? (
          <Card style={{ alignSelf: 'stretch' }}>
            <Text style={st.warn}>{t('qibla.lowAccuracy')}</Text>
          </Card>
        ) : null}

        <Text style={st.hint}>{t('qibla.hint')}</Text>
      </View>
    </Screen>
  );
}

// Kadran yüzü: çentikler, yön harfleri ve Kâbe işareti. Sadece kıble açısı
// değişince yeniden çizilir; dönme işi dış katmanda yapılır.
const DialFace = memo(function DialFace({ qibla, cardinals }: { qibla: number; cardinals: string[] }) {
  return (
    <>
      {Array.from({ length: 72 }, (_, i) => (
        <View key={i} style={[st.tickWrap, { transform: [{ rotate: `${i * 5}deg` }] }]}>
          <View style={[st.tick, i % 6 === 0 && st.tickMajor]} />
        </View>
      ))}
      {cardinals.map((l, i) => (
        <View key={i} style={[st.tickWrap, { transform: [{ rotate: `${i * 90}deg` }] }]}>
          <Text style={[st.cardinal, i === 0 && { color: C.danger }, l.length > 2 && { fontSize: 13 }]}>{l}</Text>
        </View>
      ))}
      <View style={[st.tickWrap, { transform: [{ rotate: `${qibla}deg` }] }]}>
        <View style={st.needle} />
        <View style={st.kaaba}>
          <Ionicons name="cube" size={22} color={C.gold} />
        </View>
      </View>
    </>
  );
});


const st = StyleSheet.create({
  dial: {
    width: SIZE,
    height: SIZE,
    borderRadius: SIZE / 2,
    borderWidth: 3,
    borderColor: C.border,
    backgroundColor: C.card,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tickWrap: { position: 'absolute', top: 0, left: 0, width: SIZE - 6, height: SIZE - 6, alignItems: 'center' },
  tick: { width: 1.5, height: 8, backgroundColor: C.textMute, marginTop: 4 },
  tickMajor: { width: 2.5, height: 14, backgroundColor: C.textDim },
  cardinal: { color: C.text, fontWeight: '800', fontSize: 18, marginTop: 22 },
  needle: { position: 'absolute', top: 50, width: 3, height: SIZE / 2 - 56, backgroundColor: C.gold, borderRadius: 2 },
  kaaba: {
    position: 'absolute',
    top: 18,
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: C.bgDeep,
    alignItems: 'center',
    justifyContent: 'center',
  },
  hub: { width: 16, height: 16, borderRadius: 8, backgroundColor: C.gold },
  big: { color: C.text, fontSize: 22, fontWeight: '800' },
  title: { color: C.text, fontSize: 18, fontWeight: '700' },
  text: { color: C.textDim, fontSize: 14, textAlign: 'center', lineHeight: 20 },
  warn: { color: C.gold, fontSize: 13, lineHeight: 19 },
  tiltWarn: { color: C.gold, fontSize: 14, fontWeight: '700' },
  hint: { color: C.textMute, fontSize: 12, textAlign: 'center', lineHeight: 18, paddingHorizontal: S.lg },
});
