import * as Localization from 'expo-localization';
import { useEffect, useMemo, useState } from 'react';
import { StyleSheet, Text, TextInput, View } from 'react-native';

import { Btn, Card, Screen, SectionTitle } from '@/components/ui';
import { C, R, S } from '@/constants/theme';
import type { StringKey } from '@/i18n';
import { useT } from '@/lib/app-state';
import { loadJSON, saveJSON } from '@/lib/storage';

// Diyanet: nisap 80,18 gram altın; zekat oranı kırkta bir.
const NISAB_GOLD_GR = 80.18;
const KEY = 'zekatmatik-v1';

type Field = 'goldPrice' | 'cash' | 'foreign' | 'goldGr' | 'silver' | 'stocks' | 'trade' | 'receivable' | 'debts';
type Values = Record<Field, string>;
const EMPTY: Values = {
  goldPrice: '',
  cash: '',
  foreign: '',
  goldGr: '',
  silver: '',
  stocks: '',
  trade: '',
  receivable: '',
  debts: '',
};
const ASSETS: Field[] = ['cash', 'foreign', 'goldGr', 'silver', 'stocks', 'trade', 'receivable'];

/** "1.234,5" ve "1,234.5" gibi yazımları sayıya çevirir. */
function parseAmount(raw: string): number {
  let s = raw.replace(/[\s ']/g, '');
  if (!s) return 0;
  const lastDot = s.lastIndexOf('.');
  const lastComma = s.lastIndexOf(',');
  if (lastDot >= 0 && lastComma >= 0) {
    const dec = lastDot > lastComma ? '.' : ',';
    const thou = dec === '.' ? ',' : '.';
    s = s.split(thou).join('').replace(dec, '.');
  } else if (lastComma >= 0) {
    s = /^\d{1,3}(,\d{3})+$/.test(s) ? s.split(',').join('') : s.replace(',', '.');
  } else if (/^\d{1,3}(\.\d{3})+$/.test(s)) {
    s = s.split('.').join('');
  }
  const n = Number(s);
  return Number.isFinite(n) && n > 0 ? n : 0;
}

function money(n: number, currency: string | null) {
  try {
    return n.toLocaleString(undefined, {
      style: currency ? 'currency' : 'decimal',
      currency: currency ?? undefined,
      maximumFractionDigits: 2,
    });
  } catch {
    return `${n.toFixed(2)}${currency ? ` ${currency}` : ''}`;
  }
}

export default function ZekatScreen() {
  const t = useT();
  const [v, setV] = useState<Values>(EMPTY);
  const currency = useMemo(() => Localization.getLocales()[0]?.currencyCode ?? null, []);

  useEffect(() => {
    loadJSON<Values>(KEY, EMPTY).then(setV);
  }, []);

  const set = (f: Field, text: string) => {
    const next = { ...v, [f]: text.replace(/[^0-9.,\s]/g, '') };
    setV(next);
    saveJSON(KEY, next);
  };

  const price = parseAmount(v.goldPrice);
  const total = ASSETS.reduce((sum, f) => sum + (f === 'goldGr' ? parseAmount(v.goldGr) * price : parseAmount(v[f])), 0);
  const net = Math.max(0, total - parseAmount(v.debts));
  const nisab = price * NISAB_GOLD_GR;
  const due = price > 0 && net >= nisab ? net / 40 : 0;

  const input = (f: Field, label: StringKey, hint?: StringKey) => (
    <View key={f} style={{ gap: 4 }}>
      <Text style={st.label}>{t(label)}</Text>
      <TextInput
        value={v[f]}
        onChangeText={(x) => set(f, x)}
        keyboardType="decimal-pad"
        placeholder="0"
        placeholderTextColor={C.textMute}
        style={st.input}
      />
      {hint ? <Text style={st.hint}>{t(hint)}</Text> : null}
    </View>
  );

  return (
    <Screen title={t('zekat.title')} back>
      <Text style={st.intro}>{t('zekat.intro')}</Text>
      {currency ? <Text style={st.hint}>{t('zekat.currency', { c: currency })}</Text> : null}

      <Card>{input('goldPrice', 'zekat.goldPrice', 'zekat.goldPriceHint')}</Card>

      <Card>
        <SectionTitle icon="wallet-outline">{t('zekat.assets')}</SectionTitle>
        {ASSETS.map((f) => input(f, `zekat.${f}` as StringKey))}
        {input('debts', 'zekat.debts')}
      </Card>

      <Card style={st.result}>
        <Row label={t('zekat.net')} value={money(net, currency)} />
        {price > 0 ? <Text style={st.hint}>{t('zekat.nisab', { v: money(nisab, currency) })}</Text> : null}
        {price <= 0 ? (
          <Text style={st.warn}>{t('zekat.needPrice')}</Text>
        ) : due > 0 ? (
          <View style={{ alignItems: 'center', gap: 4, marginTop: S.sm }}>
            <Text style={st.dueLabel}>{t('zekat.due')}</Text>
            <Text style={st.due}>{money(due, currency)}</Text>
          </View>
        ) : (
          <Text style={st.warn}>{t('zekat.notDue')}</Text>
        )}
      </Card>

      <Btn label={t('zekat.clear')} kind="ghost" icon="refresh" onPress={() => { setV(EMPTY); saveJSON(KEY, EMPTY); }} />
      <Text style={st.hint}>{t('zekat.disclaimer')}</Text>
    </Screen>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: S.md }}>
      <Text style={st.label}>{label}</Text>
      <Text style={st.value}>{value}</Text>
    </View>
  );
}

const st = StyleSheet.create({
  intro: { color: C.textDim, fontSize: 14, lineHeight: 21 },
  label: { color: C.text, fontSize: 14, fontWeight: '600', flexShrink: 1 },
  hint: { color: C.textMute, fontSize: 12.5, lineHeight: 18 },
  input: {
    backgroundColor: C.bgDeep,
    color: C.text,
    borderRadius: R.sm,
    paddingHorizontal: S.md,
    paddingVertical: 10,
    fontSize: 16,
    fontVariant: ['tabular-nums'],
  },
  result: { borderWidth: 1.5, borderColor: C.accent },
  value: { color: C.text, fontSize: 16, fontWeight: '700' },
  warn: { color: C.gold, fontSize: 14, lineHeight: 20 },
  dueLabel: { color: C.textDim, fontSize: 14 },
  due: { color: C.accent, fontSize: 32, fontWeight: '800' },
});
