import * as Notifications from 'expo-notifications';
import { useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Switch, Text, View } from 'react-native';

import { Btn, Card, Screen, SectionTitle } from '@/components/ui';
import { C, R, S } from '@/constants/theme';
import { useAppState } from '@/lib/app-state';
import { formatHijri } from '@/lib/hijri';
import { ensureNotificationPermission } from '@/lib/notifications';
import { PRAYERS } from '@/lib/prayer';

const REMIND = [0, 5, 10, 15, 30, 45];

export default function AyarlarScreen() {
  const { settings, update, refreshLocation, notifyStatus } = useAppState();
  const { place, notify, hijriOffset } = settings;
  const [locMsg, setLocMsg] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [testMsg, setTestMsg] = useState<string | null>(null);

  const locate = async () => {
    setBusy(true);
    setLocMsg(null);
    const r = await refreshLocation();
    setBusy(false);
    setLocMsg(
      r === 'ok'
        ? 'Konum güncellendi.'
        : r === 'denied'
          ? 'Konum izni verilmedi. Telefon ayarlarından izin verebilirsin.'
          : 'Konum alınamadı. GPS açık mı?',
    );
  };

  const testNotify = async () => {
    if (!(await ensureNotificationPermission())) {
      setTestMsg('Bildirim izni verilmedi.');
      return;
    }
    await Notifications.scheduleNotificationAsync({
      content: { title: 'Deneme bildirimi', body: 'Namaz vakti bildirimleri bu şekilde gelecek.', sound: 'default' },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
        seconds: 5,
        channelId: 'namaz-vakitleri',
      },
    });
    setTestMsg('5 saniye içinde bir bildirim gelecek.');
  };

  return (
    <Screen title="Ayarlar" back>
      <Card>
        <SectionTitle icon="location-outline">Konum</SectionTitle>
        <Text style={st.value}>{place.name}</Text>
        <Text style={st.small}>
          {place.auto ? 'Cihaz konumundan alındı' : 'Varsayılan konum (konum izni verilmedi)'} ·{' '}
          {place.lat.toFixed(3)}, {place.lng.toFixed(3)}
        </Text>
        {busy ? <ActivityIndicator color={C.accent} /> : <Btn label="Konumumu bul" icon="locate" onPress={locate} />}
        {locMsg ? <Text style={st.small}>{locMsg}</Text> : null}
      </Card>

      <Card>
        <SectionTitle icon="notifications-outline">Vakit bildirimleri</SectionTitle>
        {PRAYERS.map((p) => (
          <View key={p.key} style={st.switchRow}>
            <Text style={st.label}>{p.label}</Text>
            <Switch
              value={notify.enabled[p.key]}
              onValueChange={(v) => update({ notify: { ...notify, enabled: { ...notify.enabled, [p.key]: v } } })}
              trackColor={{ true: C.accent, false: C.cardSoft }}
              thumbColor={C.text}
            />
          </View>
        ))}
        <Text style={[st.label, { marginTop: S.sm }]}>Vakitten önce hatırlat</Text>
        <View style={st.chips}>
          {REMIND.map((m) => (
            <Pressable
              key={m}
              onPress={() => update({ notify: { ...notify, remindBefore: m } })}
              style={[st.chip, notify.remindBefore === m && st.chipOn]}>
              <Text style={[st.chipText, notify.remindBefore === m && { color: C.bgDeep }]}>
                {m === 0 ? 'Kapalı' : `${m} dk`}
              </Text>
            </Pressable>
          ))}
        </View>
        {notifyStatus ? <Text style={[st.small, { color: C.danger }]}>{notifyStatus}</Text> : null}
        <Btn label="Deneme bildirimi gönder" kind="ghost" icon="paper-plane-outline" onPress={testNotify} />
        {testMsg ? <Text style={st.small}>{testMsg}</Text> : null}
      </Card>

      <Card>
        <SectionTitle icon="moon-outline">Hicri tarih düzeltmesi</SectionTitle>
        <Text style={st.small}>
          Hicri tarih hesapla bulunur. Diyanet takvimiyle 1 gün fark görürsen buradan düzelt.
        </Text>
        <View style={st.stepper}>
          <Pressable style={st.stepBtn} onPress={() => update({ hijriOffset: Math.max(-2, hijriOffset - 1) })}>
            <Text style={st.stepText}>−</Text>
          </Pressable>
          <View style={{ flex: 1, alignItems: 'center' }}>
            <Text style={st.value}>{formatHijri(new Date(), hijriOffset)}</Text>
            <Text style={st.small}>{hijriOffset === 0 ? 'Düzeltme yok' : `${hijriOffset > 0 ? '+' : ''}${hijriOffset} gün`}</Text>
          </View>
          <Pressable style={st.stepBtn} onPress={() => update({ hijriOffset: Math.min(2, hijriOffset + 1) })}>
            <Text style={st.stepText}>+</Text>
          </Pressable>
        </View>
      </Card>

      <Text style={st.footer}>İslami Yaşam · sürüm 0.1</Text>
    </Screen>
  );
}

const st = StyleSheet.create({
  value: { color: C.text, fontSize: 17, fontWeight: '700' },
  small: { color: C.textDim, fontSize: 13, lineHeight: 19 },
  label: { color: C.text, fontSize: 15 },
  switchRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: S.sm },
  chip: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 18, backgroundColor: C.cardSoft },
  chipOn: { backgroundColor: C.accent },
  chipText: { color: C.text, fontWeight: '600', fontSize: 13 },
  stepper: { flexDirection: 'row', alignItems: 'center', gap: S.md },
  stepBtn: {
    width: 44,
    height: 44,
    borderRadius: R.md,
    backgroundColor: C.cardSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepText: { color: C.text, fontSize: 22, fontWeight: '700' },
  footer: { color: C.textMute, fontSize: 12, textAlign: 'center' },
});
