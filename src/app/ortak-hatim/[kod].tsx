import Ionicons from '@expo/vector-icons/Ionicons';
import * as Haptics from 'expo-haptics';
import { router, useFocusEffect, useLocalSearchParams } from 'expo-router';
import { useCallback, useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Alert, Pressable, RefreshControl, ScrollView, Share, StyleSheet, Text, View } from 'react-native';

import { JuzGrid, type JuzCell } from '@/components/juz-grid';
import { Btn, Card, Screen } from '@/components/ui';
import { C, S } from '@/constants/theme';
import { useT } from '@/lib/app-state';
import {
  errorKey,
  finishJuz,
  forgetHatim,
  getHatim,
  loadName,
  normalizeCode,
  rememberHatim,
  releaseJuz,
  takeJuz,
  type HatimView,
} from '@/lib/hatim';
import { juzStartPage } from '@/lib/mushaf';

export default function OrtakHatimScreen() {
  const t = useT();
  const { kod } = useLocalSearchParams<{ kod: string }>();
  const code = normalizeCode(String(kod ?? ''));
  const [view, setView] = useState<HatimView | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [name, setName] = useState('');
  const busy = useRef(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const v = await getHatim(code);
      setView(v);
      setError(null);
      rememberHatim({ code: v.hatim.code, title: v.hatim.title });
    } catch (e) {
      setError(t(errorKey(e)));
    } finally {
      setLoading(false);
    }
  }, [code, t]);

  useEffect(() => {
    loadName().then(setName);
  }, []);

  // Ekran açıkken 20 saniyede bir tazele: başkalarının aldığı cüzler görünsün
  useFocusEffect(
    useCallback(() => {
      load();
      const id = setInterval(load, 20000);
      return () => clearInterval(id);
    }, [load]),
  );

  const act = async (fn: () => Promise<HatimView>) => {
    if (busy.current) return;
    busy.current = true;
    try {
      const v = await fn();
      setView(v);
      if (v.finished) {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        Alert.alert(v.hatim.title, t('hatim.finished'));
      }
    } catch (e) {
      Alert.alert(t('hatim.title'), t(errorKey(e)));
      load();
    } finally {
      busy.current = false;
    }
  };

  const openMushaf = (juz: number) =>
    router.push({ pathname: '/mushaf', params: { sayfa: String(juzStartPage(juz)) } });

  const onJuz = (juz: number) => {
    const part = view?.parts[juz - 1];
    if (!part) return;
    const title = t('hatim.juz', { n: juz });
    if (part.status === 0) {
      Alert.alert(title, undefined, [
        { text: t('common.cancel'), style: 'cancel' },
        { text: t('hatim.take'), onPress: () => act(() => takeJuz(code, juz, name)) },
      ]);
    } else if (part.status === 1 && part.mine) {
      Alert.alert(
        title,
        undefined,
        [
          { text: t('hatim.release'), style: 'destructive', onPress: () => act(() => releaseJuz(code, juz)) },
          { text: t('hatim.openMushaf'), onPress: () => openMushaf(juz) },
          { text: t('hatim.markDone'), onPress: () => act(() => finishJuz(code, juz)) },
        ],
        { cancelable: true },
      );
    } else {
      const who = part.name || t('hatim.anon');
      Alert.alert(title, `${part.status === 2 ? t('hatim.done') : ''} ${who}`.trim(), [
        { text: t('common.close'), style: 'cancel' },
        { text: t('hatim.openMushaf'), onPress: () => openMushaf(juz) },
      ]);
    }
  };

  const invite = () => {
    if (!view) return;
    Share.share({ message: t('hatim.shareText', { title: view.hatim.title, code: view.hatim.code }) });
  };

  const remove = () =>
    Alert.alert(t('hatim.remove'), t('hatim.removeAsk'), [
      { text: t('common.cancel'), style: 'cancel' },
      {
        text: t('hatim.remove'),
        style: 'destructive',
        onPress: async () => {
          await forgetHatim(code);
          router.back();
        },
      },
    ]);

  const parts = view?.parts ?? [];
  const cells: JuzCell[] = parts.map((p) => ({
    state: p.status === 2 ? 'done' : p.status === 1 ? (p.mine ? 'mine' : 'taken') : 'free',
    caption: p.status === 1 ? (p.mine ? t('hatim.yours') : p.name || t('hatim.anon')) : p.status === 2 ? p.name : undefined,
  }));
  const count = (s: number) => parts.filter((p) => p.status === s).length;

  return (
    <Screen
      title={view?.hatim.title ?? t('hatim.shared')}
      back
      scroll={false}
      right={
        <Pressable hitSlop={10} onPress={invite} disabled={!view}>
          <Ionicons name="share-social-outline" size={22} color={C.text} />
        </Pressable>
      }>
      <ScrollView
        contentContainerStyle={{ gap: S.lg, paddingBottom: 40 }}
        refreshControl={<RefreshControl refreshing={loading && !!view} onRefresh={load} tintColor={C.accent} />}>
        {!view && !error ? <ActivityIndicator color={C.accent} size="large" style={{ marginTop: 60 }} /> : null}
        {error && !view ? (
          <View style={{ gap: S.md, marginTop: 40 }}>
            <Text style={st.error}>{error}</Text>
            <Btn label={t('common.retry')} icon="refresh" onPress={load} />
          </View>
        ) : null}

        {view ? (
          <>
            <Card>
              {view.hatim.niyet ? <Text style={st.niyet}>{view.hatim.niyet}</Text> : null}
              <View style={st.metaRow}>
                <Text style={st.meta}>{t('hatim.code', { code: view.hatim.code })}</Text>
                <Text style={st.meta}>{t('hatim.round', { n: view.hatim.round })}</Text>
              </View>
              {view.hatim.creatorName ? <Text style={st.meta}>{t('hatim.by', { name: view.hatim.creatorName })}</Text> : null}
              {view.hatim.completedRounds > 0 ? (
                <Text style={st.gold}>{t('hatim.completed', { n: view.hatim.completedRounds })}</Text>
              ) : null}
              <Text style={st.stats}>{t('hatim.stats', { done: count(2), taken: count(1), free: count(0) })}</Text>
            </Card>

            <JuzGrid cells={cells} onPress={onJuz} onLongPress={openMushaf} />
            {error ? <Text style={st.error}>{error}</Text> : null}

            <View style={st.legend}>
              <Legend color={C.bgDeep} label={t('hatim.free')} />
              <Legend color={C.gold} label={t('hatim.yours')} />
              <Legend color={C.cardActive} label={t('hatim.reading')} />
              <Legend color={C.accent} label={t('hatim.done')} />
            </View>

            <Btn label={t('hatim.invite')} icon="share-social" onPress={invite} />
            <Btn label={t('hatim.remove')} kind="ghost" icon="trash-outline" onPress={remove} />
          </>
        ) : null}
      </ScrollView>
    </Screen>
  );
}

function Legend({ color, label }: { color: string; label: string }) {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
      <View style={{ width: 14, height: 14, borderRadius: 4, backgroundColor: color, borderWidth: 1, borderColor: C.border }} />
      <Text style={{ color: C.textDim, fontSize: 12.5 }}>{label}</Text>
    </View>
  );
}

const st = StyleSheet.create({
  niyet: { color: C.gold, fontSize: 15, fontStyle: 'italic', lineHeight: 21 },
  metaRow: { flexDirection: 'row', justifyContent: 'space-between' },
  meta: { color: C.textDim, fontSize: 13.5 },
  gold: { color: C.gold, fontSize: 14, fontWeight: '700' },
  stats: { color: C.text, fontSize: 14, fontWeight: '600' },
  error: { color: C.danger, fontSize: 14, textAlign: 'center' },
  legend: { flexDirection: 'row', justifyContent: 'space-around', flexWrap: 'wrap', gap: S.sm },
});
