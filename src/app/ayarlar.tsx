import Ionicons from '@expo/vector-icons/Ionicons';
import Constants from 'expo-constants';
import * as Notifications from 'expo-notifications';
import { useState } from 'react';
import { ActivityIndicator, Modal, Pressable, ScrollView, StyleSheet, Switch, Text, View } from 'react-native';

import { ReliabilityCard } from '@/components/reliability-card';
import { Btn, Card, Screen, SectionTitle } from '@/components/ui';
import { C, R, S } from '@/constants/theme';
import { LANGUAGES, type StringKey } from '@/i18n';
import { useAppState, useT } from '@/lib/app-state';
import { formatHijri } from '@/lib/hijri';
import { ensureNotificationPermission } from '@/lib/notifications';
import { METHOD_KEYS, methodForCountry, PRAYER_KEYS, type MethodKey } from '@/lib/prayer';

const REMIND = [0, 5, 10, 15, 30, 45];

export default function AyarlarScreen() {
  const { settings, update, refreshLocation, notifyStatus, lang, calc } = useAppState();
  const t = useT();
  const { place, notify, hijriOffset } = settings;
  const [locMsg, setLocMsg] = useState<StringKey | null>(null);
  const [busy, setBusy] = useState(false);
  const [testMsg, setTestMsg] = useState<StringKey | null>(null);
  const [picker, setPicker] = useState<'lang' | 'method' | null>(null);

  const locate = async () => {
    setBusy(true);
    setLocMsg(null);
    const r = await refreshLocation();
    setBusy(false);
    setLocMsg(r === 'ok' ? 'settings.locUpdated' : r === 'denied' ? 'settings.locDenied' : 'settings.locFailed');
  };

  const testNotify = async () => {
    if (!(await ensureNotificationPermission())) {
      setTestMsg('settings.notifDenied');
      return;
    }
    await Notifications.scheduleNotificationAsync({
      content: { title: t('settings.testTitle'), body: t('settings.testBody'), sound: 'default' },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
        seconds: 5,
        channelId: 'namaz-vakitleri',
      },
    });
    setTestMsg('settings.testSent');
  };

  const langName = LANGUAGES.find((l) => l.code === lang)?.name ?? lang;
  const autoMethod = t(`method.${methodForCountry(place.country ?? (place.auto ? null : 'TR'))}`);
  const methodLabel = settings.method === 'auto' ? t('settings.methodAuto', { method: autoMethod }) : t(`method.${calc.method}`);

  return (
    <Screen title={t('settings.title')} back>
      <Card>
        <SectionTitle icon="language-outline">{t('settings.language')}</SectionTitle>
        <Pressable style={st.selectRow} onPress={() => setPicker('lang')}>
          <Text style={st.value}>{langName}</Text>
          <Ionicons name="chevron-down" size={18} color={C.textMute} />
        </Pressable>
      </Card>

      <Card>
        <SectionTitle icon="location-outline">{t('settings.location')}</SectionTitle>
        <Text style={st.value}>{place.name}</Text>
        <Text style={st.small}>
          {place.auto ? t('settings.fromDevice') : t('settings.defaultLoc')} · {place.lat.toFixed(3)},{' '}
          {place.lng.toFixed(3)}
        </Text>
        {busy ? (
          <ActivityIndicator color={C.accent} />
        ) : (
          <Btn label={t('settings.findMe')} icon="locate" onPress={locate} />
        )}
        {locMsg ? <Text style={st.small}>{t(locMsg)}</Text> : null}
      </Card>

      <Card>
        <SectionTitle icon="calculator-outline">{t('settings.method')}</SectionTitle>
        <Pressable style={st.selectRow} onPress={() => setPicker('method')}>
          <Text style={[st.value, { flex: 1 }]}>{methodLabel}</Text>
          <Ionicons name="chevron-down" size={18} color={C.textMute} />
        </Pressable>
        <Text style={st.small}>{t('settings.methodHelp')}</Text>
      </Card>

      <ReliabilityCard />

      <Card>
        <SectionTitle icon="notifications-outline">{t('settings.notifications')}</SectionTitle>
        {PRAYER_KEYS.map((key) => (
          <View key={key} style={st.switchRow}>
            <Text style={st.label}>{t(`prayer.${key}`)}</Text>
            <Switch
              value={notify.enabled[key]}
              onValueChange={(v) => update({ notify: { ...notify, enabled: { ...notify.enabled, [key]: v } } })}
              trackColor={{ true: C.accent, false: C.cardSoft }}
              thumbColor={C.text}
            />
          </View>
        ))}
        <Text style={[st.label, { marginTop: S.sm }]}>{t('settings.remindBefore')}</Text>
        <View style={st.chips}>
          {REMIND.map((m) => (
            <Pressable
              key={m}
              onPress={() => update({ notify: { ...notify, remindBefore: m } })}
              style={[st.chip, notify.remindBefore === m && st.chipOn]}>
              <Text style={[st.chipText, notify.remindBefore === m && { color: C.bgDeep }]}>
                {m === 0 ? t('common.off') : t('common.minutes', { n: m })}
              </Text>
            </Pressable>
          ))}
        </View>
        {notifyStatus ? <Text style={[st.small, { color: C.danger }]}>{t(notifyStatus)}</Text> : null}
        <Btn label={t('settings.testNotif')} kind="ghost" icon="paper-plane-outline" onPress={testNotify} />
        {testMsg ? <Text style={st.small}>{t(testMsg)}</Text> : null}
      </Card>

      <Card>
        <SectionTitle icon="moon-outline">{t('settings.hijri')}</SectionTitle>
        <Text style={st.small}>{t('settings.hijriHelp')}</Text>
        <View style={st.stepper}>
          <Pressable style={st.stepBtn} onPress={() => update({ hijriOffset: Math.max(-2, hijriOffset - 1) })}>
            <Text style={st.stepText}>−</Text>
          </Pressable>
          <View style={{ flex: 1, alignItems: 'center' }}>
            <Text style={st.value}>{formatHijri(new Date(), hijriOffset, lang)}</Text>
            <Text style={st.small}>
              {hijriOffset === 0
                ? t('settings.noCorrection')
                : t('settings.days', { n: `${hijriOffset > 0 ? '+' : ''}${hijriOffset}` })}
            </Text>
          </View>
          <Pressable style={st.stepBtn} onPress={() => update({ hijriOffset: Math.min(2, hijriOffset + 1) })}>
            <Text style={st.stepText}>+</Text>
          </Pressable>
        </View>
      </Card>

      <Text style={st.footer}>
        {t('app.name')} · {t('settings.version', { v: Constants.expoConfig?.version ?? '' })}
      </Text>

      <Modal visible={picker != null} transparent animationType="fade" onRequestClose={() => setPicker(null)}>
        <Pressable style={st.backdrop} onPress={() => setPicker(null)}>
          <View style={st.sheet}>
            <Text style={st.sheetTitle}>{picker === 'lang' ? t('settings.language') : t('settings.method')}</Text>
            <ScrollView style={{ maxHeight: 460 }}>
              {picker === 'lang'
                ? LANGUAGES.map((l) => (
                    <Option
                      key={l.code}
                      label={l.name}
                      selected={l.code === lang}
                      onPress={() => {
                        update({ lang: l.code });
                        setPicker(null);
                      }}
                    />
                  ))
                : (['auto', ...METHOD_KEYS] as (MethodKey | 'auto')[]).map((m) => (
                    <Option
                      key={m}
                      label={m === 'auto' ? t('settings.methodAuto', { method: autoMethod }) : t(`method.${m}`)}
                      selected={settings.method === m}
                      onPress={() => {
                        update({ method: m });
                        setPicker(null);
                      }}
                    />
                  ))}
            </ScrollView>
          </View>
        </Pressable>
      </Modal>
    </Screen>
  );
}

function Option({ label, selected, onPress }: { label: string; selected: boolean; onPress: () => void }) {
  return (
    <Pressable style={st.option} onPress={onPress}>
      <Text style={[st.optionText, selected && { color: C.accent, fontWeight: '700' }]}>{label}</Text>
      {selected ? <Ionicons name="checkmark" size={20} color={C.accent} /> : null}
    </Pressable>
  );
}

const st = StyleSheet.create({
  value: { color: C.text, fontSize: 17, fontWeight: '700' },
  small: { color: C.textDim, fontSize: 13, lineHeight: 19 },
  label: { color: C.text, fontSize: 15 },
  selectRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: S.sm,
    backgroundColor: C.cardSoft,
    borderRadius: R.sm,
    paddingHorizontal: S.md,
    paddingVertical: 12,
  },
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
  backdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.55)', justifyContent: 'flex-end' },
  sheet: {
    backgroundColor: C.bgDeep,
    borderTopLeftRadius: R.lg,
    borderTopRightRadius: R.lg,
    padding: S.lg,
    paddingBottom: S.xl * 1.5,
  },
  sheetTitle: { color: C.text, fontSize: 18, fontWeight: '700', marginBottom: S.sm },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: C.border,
  },
  optionText: { color: C.text, fontSize: 16, flex: 1 },
});
