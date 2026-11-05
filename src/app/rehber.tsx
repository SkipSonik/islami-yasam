import Ionicons from '@expo/vector-icons/Ionicons';
import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { Image, Modal, Pressable, ScrollView, Text, View, type ImageSourcePropType } from 'react-native';

import { Card, Screen } from '@/components/ui';
import { R, S, makeStyles, useColors } from '@/constants/theme';
import {
  abdestBreakers,
  abdestImage,
  abdestIntro,
  abdestSteps,
  DUA_ORDER,
  DUALAR,
  namazExtraNotes,
  namazImage,
  namazIntro,
  namazSteps,
  PERSONAS,
  REKATLAR,
  type DuaKey,
  type GuideLang,
  type Persona,
  type Step,
} from '@/data/rehber';
import type { StringKey } from '@/i18n';
import { useAppState, useT } from '@/lib/app-state';
import { loadValue, saveJSON } from '@/lib/storage';

type Tab = 'abdest' | 'namaz' | 'dualar' | 'rekat';
const TABS: Tab[] = ['abdest', 'namaz', 'dualar', 'rekat'];
const PERSONA_ICON: Record<Persona, keyof typeof Ionicons.glyphMap> = {
  erkek: 'man-outline',
  kadin: 'woman-outline',
  erkekCocuk: 'happy-outline',
  kizCocuk: 'flower-outline',
};

export default function RehberScreen() {
  const C = useColors();
  const st = useSt();
  const t = useT();
  const { lang } = useAppState();
  const gl: GuideLang = lang === 'tr' ? 'tr' : 'en';
  const [persona, setPersona] = useState<Persona>('erkek');
  const [tab, setTab] = useState<Tab>('abdest');
  const [dua, setDua] = useState<DuaKey | null>(null);

  useEffect(() => {
    loadValue<Persona>('rehber-kisi', 'erkek').then((p) => PERSONAS.includes(p) && setPersona(p));
  }, []);
  const choose = (p: Persona) => {
    setPersona(p);
    saveJSON('rehber-kisi', p);
  };

  return (
    <Screen title={t('rehber.title')} back>
      <View style={st.personas}>
        {PERSONAS.map((p) => {
          const on = p === persona;
          return (
            <Pressable key={p} onPress={() => choose(p)} style={[st.persona, on && st.personaOn]}>
              <Ionicons name={PERSONA_ICON[p]} size={22} color={on ? C.onAccent : C.textDim} />
              <Text style={[st.personaText, on && { color: C.onAccent }]} numberOfLines={1}>
                {t(`rehber.p.${p}` as StringKey)}
              </Text>
            </Pressable>
          );
        })}
      </View>

      <View style={st.tabs}>
        {TABS.map((k) => (
          <Pressable key={k} onPress={() => setTab(k)} style={[st.tab, tab === k && st.tabOn]}>
            <Text style={[st.tabText, tab === k && { color: C.accent }]} numberOfLines={1}>
              {t(`rehber.tab.${k}` as StringKey)}
            </Text>
          </Pressable>
        ))}
      </View>

      {tab === 'abdest' ? (
        <>
          <Text style={st.intro}>{abdestIntro(persona, gl)}</Text>
          {abdestSteps(persona, gl).map((s, i) => (
            <StepCard key={i} n={i + 1} step={s} image={s.image ? abdestImage(persona, s.image) : undefined} gl={gl} onDua={setDua} />
          ))}
          <Card>
            <Text style={st.cardTitle}>{t('rehber.breakers')}</Text>
            {abdestBreakers(gl).map((b) => (
              <View key={b} style={st.bullet}>
                <Text style={st.dot}>•</Text>
                <Text style={st.body}>{b}</Text>
              </View>
            ))}
          </Card>
        </>
      ) : tab === 'namaz' ? (
        <>
          <Text style={st.intro}>{namazIntro(persona, gl)}</Text>
          {namazSteps(persona, gl).map((s, i) => (
            <StepCard key={i} n={i + 1} step={s} image={s.image ? namazImage(persona, s.image) : undefined} gl={gl} onDua={setDua} />
          ))}
          <Card>
            <Text style={st.cardTitle}>{t('rehber.notes')}</Text>
            {namazExtraNotes(gl).map((b) => (
              <View key={b} style={st.bullet}>
                <Text style={st.dot}>•</Text>
                <Text style={st.body}>{b}</Text>
              </View>
            ))}
          </Card>
        </>
      ) : tab === 'dualar' ? (
        DUA_ORDER.map((k) => <DuaCard key={k} k={k} gl={gl} />)
      ) : (
        <>
          {REKATLAR.map((v) => (
            <Card key={v.key}>
              <View style={st.rekatHead}>
                <Text style={st.cardTitle}>{t(`rehber.v.${v.key}` as StringKey)}</Text>
                <Text style={st.rekatTotal}>
                  {t('rehber.total', { n: v.parts.reduce((a, p) => a + p.n, 0) })}
                </Text>
              </View>
              <View style={st.rekatRow}>
                {v.parts.map((p, i) => (
                  <View key={i} style={[st.rekatPart, p.kind === 'farz' && st.rekatFarz]}>
                    <Text style={[st.rekatN, p.kind === 'farz' && { color: C.onAccent }]}>{p.n}</Text>
                    <Text style={[st.rekatKind, p.kind === 'farz' && { color: C.onAccent }]} numberOfLines={1}>
                      {t(`rehber.k.${p.kind}` as StringKey)}
                    </Text>
                  </View>
                ))}
              </View>
            </Card>
          ))}
          <Text style={st.intro}>{t('rehber.rekatNote')}</Text>
        </>
      )}

      <Modal visible={dua != null} transparent animationType="fade" onRequestClose={() => setDua(null)}>
        <Pressable style={st.backdrop} onPress={() => setDua(null)}>
          <Pressable style={st.sheet} onPress={() => {}}>
            <ScrollView>{dua ? <DuaCard k={dua} gl={gl} bare /> : null}</ScrollView>
            <Pressable onPress={() => setDua(null)} style={st.close}>
              <Text style={st.closeText}>{t('common.close')}</Text>
            </Pressable>
          </Pressable>
        </Pressable>
      </Modal>
    </Screen>
  );
}

function StepCard({
  n,
  step,
  image,
  gl,
  onDua,
}: {
  n: number;
  step: Step;
  image?: ImageSourcePropType;
  gl: GuideLang;
  onDua: (k: DuaKey) => void;
}) {
  const C = useColors();
  const st = useSt();
  return (
    <Card style={{ padding: 0, overflow: 'hidden', gap: 0 }}>
      {image ? <Image source={image} style={st.img} resizeMode="contain" /> : null}
      <View style={{ padding: S.lg, gap: S.sm }}>
        <View style={st.stepHead}>
          <View style={st.num}>
            <Text style={st.numText}>{n}</Text>
          </View>
          <Text style={st.stepTitle}>{step.title}</Text>
        </View>
        <Text style={st.body}>{step.text}</Text>
        {step.note ? (
          <View style={st.noteBox}>
            <Ionicons name="information-circle-outline" size={16} color={C.gold} />
            <Text style={st.note}>{step.note}</Text>
          </View>
        ) : null}
        {step.read?.length ? (
          <View style={st.chips}>
            {step.read.map((r) =>
              typeof r === 'string' ? (
                <Pressable key={r} style={st.chip} onPress={() => onDua(r)}>
                  <Ionicons name="book-outline" size={14} color={C.accent} />
                  <Text style={st.chipText}>{gl === 'tr' ? DUALAR[r].nameTr : DUALAR[r].nameEn}</Text>
                </Pressable>
              ) : (
                <Pressable
                  key={r.surah}
                  style={st.chip}
                  onPress={() => router.push({ pathname: '/kuran/[id]', params: { id: String(r.surah) } })}>
                  <Ionicons name="open-outline" size={14} color={C.accent} />
                  <Text style={st.chipText}>{r.label}</Text>
                </Pressable>
              ),
            )}
          </View>
        ) : null}
      </View>
    </Card>
  );
}

function DuaCard({ k, gl, bare }: { k: DuaKey; gl: GuideLang; bare?: boolean }) {
  const st = useSt();
  const t = useT();
  const d = DUALAR[k];
  const body = (
    <>
      <Text style={st.cardTitle}>{gl === 'tr' ? d.nameTr : d.nameEn}</Text>
      <Text style={st.ar}>{d.ar}</Text>
      <Text style={st.label}>{t('rehber.reading')}</Text>
      <Text style={st.body}>{gl === 'tr' ? d.tr : d.en}</Text>
      <Text style={st.label}>{t('rehber.meaning')}</Text>
      <Text style={st.body}>{gl === 'tr' ? d.mTr : d.mEn}</Text>
    </>
  );
  return bare ? <View style={{ gap: S.sm }}>{body}</View> : <Card>{body}</Card>;
}

const useSt = makeStyles((C) => ({
  personas: { flexDirection: 'row', gap: S.sm },
  persona: {
    flex: 1,
    alignItems: 'center',
    gap: 4,
    paddingVertical: S.md,
    borderRadius: R.md,
    backgroundColor: C.card,
  },
  personaOn: { backgroundColor: C.accent },
  personaText: { color: C.textDim, fontSize: 12, fontWeight: '700' },
  tabs: { flexDirection: 'row', backgroundColor: C.card, borderRadius: R.md, padding: 4 },
  tab: { flex: 1, paddingVertical: 9, borderRadius: R.sm, alignItems: 'center' },
  tabOn: { backgroundColor: C.cardActive },
  tabText: { color: C.textDim, fontWeight: '700', fontSize: 13 },
  intro: { color: C.textDim, fontSize: 14, lineHeight: 21 },
  img: { width: '100%', height: 250, backgroundColor: '#F6F0E3' },
  stepHead: { flexDirection: 'row', alignItems: 'center', gap: S.md },
  num: { width: 28, height: 28, borderRadius: 14, backgroundColor: C.accent, alignItems: 'center', justifyContent: 'center' },
  numText: { color: C.onAccent, fontWeight: '800', fontSize: 14 },
  stepTitle: { color: C.text, fontSize: 17, fontWeight: '800', flex: 1 },
  body: { color: C.text, fontSize: 14.5, lineHeight: 22, flexShrink: 1 },
  noteBox: { flexDirection: 'row', gap: 6, alignItems: 'center', backgroundColor: C.cardSoft, borderRadius: R.sm, padding: S.sm },
  note: { color: C.gold, fontSize: 13, fontWeight: '600', flex: 1 },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: S.sm },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: C.accent,
  },
  chipText: { color: C.accent, fontSize: 13, fontWeight: '700' },
  cardTitle: { color: C.text, fontSize: 16, fontWeight: '800' },
  bullet: { flexDirection: 'row', gap: 8 },
  dot: { color: C.accent, fontSize: 15, lineHeight: 22 },
  ar: { color: C.gold, fontSize: 24, lineHeight: 46, textAlign: 'right', fontFamily: 'AmiriQuran_400Regular' },
  label: { color: C.textMute, fontSize: 12, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.5, marginTop: 4 },
  rekatHead: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  rekatTotal: { color: C.textDim, fontSize: 13 },
  rekatRow: { flexDirection: 'row', gap: S.sm },
  rekatPart: { flex: 1, alignItems: 'center', paddingVertical: S.sm, borderRadius: R.sm, backgroundColor: C.cardSoft },
  rekatFarz: { backgroundColor: C.accent },
  rekatN: { color: C.text, fontSize: 20, fontWeight: '800' },
  rekatKind: { color: C.textDim, fontSize: 11.5, fontWeight: '600' },
  backdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'flex-end' },
  sheet: { backgroundColor: C.card, borderTopLeftRadius: R.lg, borderTopRightRadius: R.lg, padding: S.xl, maxHeight: '85%' },
  close: { alignSelf: 'center', paddingVertical: S.md, paddingHorizontal: S.xl, marginTop: S.sm },
  closeText: { color: C.accent, fontWeight: '800', fontSize: 15 },
}));
