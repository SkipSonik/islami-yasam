import * as Haptics from 'expo-haptics';
import { router, useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { Alert, StyleSheet, Text, View } from 'react-native';

import { FormModal } from '@/components/form-modal';
import { JuzGrid } from '@/components/juz-grid';
import { Btn, Card, ListRow, Screen, SectionTitle } from '@/components/ui';
import { S, useColors, makeStyles } from '@/constants/theme';
import { useT } from '@/lib/app-state';
import {
  createHatim,
  EMPTY_PERSONAL,
  errorKey,
  getHatim,
  loadJoined,
  loadName,
  loadPersonal,
  normalizeCode,
  rememberHatim,
  saveName,
  savePersonal,
  type JoinedHatim,
  type PersonalHatim,
} from '@/lib/hatim';
import { juzStartPage } from '@/lib/mushaf';

export default function HatimScreen() {
  const st = useSt();
  const t = useT();
  const [p, setP] = useState<PersonalHatim>(EMPTY_PERSONAL);
  const [joined, setJoined] = useState<JoinedHatim[]>([]);
  const [name, setName] = useState('');
  const [modal, setModal] = useState<'create' | 'join' | null>(null);
  const [title, setTitle] = useState('');
  const [niyet, setNiyet] = useState('');
  const [code, setCode] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useFocusEffect(
    useCallback(() => {
      loadPersonal().then(setP);
      loadJoined().then(setJoined);
      loadName().then(setName);
    }, []),
  );

  const update = (next: PersonalHatim) => {
    setP(next);
    savePersonal(next);
  };

  const toggle = (juz: number) => {
    const read = [...p.read];
    read[juz - 1] = !read[juz - 1];
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    update({ ...p, read });
    if (read.every(Boolean)) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      Alert.alert(t('tools.hatim'), t('hatim.finishedAsk'), [
        { text: t('hatim.later'), style: 'cancel' },
        {
          text: t('hatim.newHatim'),
          onPress: () => update({ read: Array(30).fill(false), completed: p.completed + 1 }),
        },
      ]);
    }
  };

  const reset = () =>
    Alert.alert(t('hatim.reset'), t('hatim.resetAsk'), [
      { text: t('common.cancel'), style: 'cancel' },
      { text: t('hatim.reset'), style: 'destructive', onPress: () => update({ ...p, read: Array(30).fill(false) }) },
    ]);

  const open = (c: string) => router.push({ pathname: '/ortak-hatim/[kod]', params: { kod: c } });

  const closeModal = () => {
    setModal(null);
    setError(null);
    setBusy(false);
  };

  const submit = async () => {
    setError(null);
    setBusy(true);
    try {
      await saveName(name);
      const view =
        modal === 'create'
          ? await createHatim(title.trim(), niyet.trim(), name.trim())
          : await getHatim(normalizeCode(code));
      setJoined(await rememberHatim({ code: view.hatim.code, title: view.hatim.title }));
      closeModal();
      setTitle('');
      setNiyet('');
      setCode('');
      open(view.hatim.code);
    } catch (e) {
      setError(t(errorKey(e)));
      setBusy(false);
    }
  };

  const readCount = p.read.filter(Boolean).length;

  return (
    <Screen title={t('hatim.title')} back>
      <Card>
        <SectionTitle icon="book-outline">{t('hatim.mine')}</SectionTitle>
        <View style={st.bar}>
          <View style={[st.barFill, { width: `${(readCount / 30) * 100}%` }]} />
        </View>
        <View style={st.statsRow}>
          <Text style={st.stat}>{t('hatim.progress', { n: readCount })}</Text>
          {p.completed > 0 ? <Text style={st.statGold}>{t('hatim.completed', { n: p.completed })}</Text> : null}
        </View>
        <JuzGrid
          cells={p.read.map((r) => ({ state: r ? 'done' : 'free' }))}
          onPress={toggle}
          onLongPress={(j) => router.push({ pathname: '/mushaf', params: { sayfa: String(juzStartPage(j)) } })}
        />
        <Text style={st.hint}>{t('hatim.tapHint')}</Text>
        {readCount > 0 ? <Btn label={t('hatim.reset')} kind="ghost" icon="refresh" onPress={reset} /> : null}
      </Card>

      <Card>
        <SectionTitle icon="people-outline">{t('hatim.shared')}</SectionTitle>
        <Text style={st.hint}>{t('hatim.sharedSub')}</Text>
        {joined.length === 0 ? <Text style={st.empty}>{t('hatim.noShared')}</Text> : null}
        <View style={{ gap: S.sm }}>
          {joined.map((h) => (
            <ListRow
              key={h.code}
              icon="people"
              title={h.title}
              subtitle={t('hatim.code', { code: h.code })}
              onPress={() => open(h.code)}
            />
          ))}
        </View>
        <Btn label={t('hatim.create')} icon="add" onPress={() => setModal('create')} />
        <Btn label={t('hatim.join')} kind="ghost" icon="enter-outline" onPress={() => setModal('join')} />
      </Card>

      <FormModal
        visible={modal != null}
        title={modal === 'create' ? t('hatim.create') : t('hatim.join')}
        submitLabel={modal === 'create' ? t('hatim.create') : t('hatim.join')}
        cancelLabel={t('common.cancel')}
        busy={busy}
        error={error}
        onClose={closeModal}
        onSubmit={() => {
          if (modal === 'create' ? !title.trim() : normalizeCode(code).length !== 6) return;
          submit();
        }}
        fields={
          modal === 'create'
            ? [
                { key: 't', placeholder: t('hatim.titlePh'), value: title, onChange: setTitle, maxLength: 80 },
                { key: 'n', placeholder: t('hatim.niyetPh'), value: niyet, onChange: setNiyet, maxLength: 200 },
                { key: 'a', placeholder: t('hatim.namePh'), value: name, onChange: setName, maxLength: 40, autoCapitalize: 'words' },
              ]
            : [
                {
                  key: 'c',
                  placeholder: t('hatim.codePh'),
                  value: code,
                  onChange: (v) => setCode(normalizeCode(v)),
                  autoCapitalize: 'characters',
                  maxLength: 6,
                },
                { key: 'a', placeholder: t('hatim.namePh'), value: name, onChange: setName, maxLength: 40, autoCapitalize: 'words' },
              ]
        }
      />
    </Screen>
  );
}

const useSt = makeStyles((C) => ({
  bar: { height: 8, backgroundColor: C.bgDeep, borderRadius: 4, overflow: 'hidden' },
  barFill: { height: 8, backgroundColor: C.accent },
  statsRow: { flexDirection: 'row', justifyContent: 'space-between', flexWrap: 'wrap', gap: S.sm },
  stat: { color: C.text, fontSize: 14, fontWeight: '600' },
  statGold: { color: C.gold, fontSize: 14, fontWeight: '700' },
  hint: { color: C.textMute, fontSize: 12.5, lineHeight: 18 },
  empty: { color: C.textDim, fontSize: 14 },
}));
