import Ionicons from '@expo/vector-icons/Ionicons';
import * as Haptics from 'expo-haptics';
import { router } from 'expo-router';
import { Alert, Pressable, Text, View } from 'react-native';

import { Btn, Card, Screen, SectionTitle } from '@/components/ui';
import { R, S, makeStyles, useColors } from '@/constants/theme';
import { useT } from '@/lib/app-state';
import {
  dailyPages,
  expectedPage,
  markTodayRead,
  readingDays,
  readingStore,
  startPlan,
  stopPlan,
  TOTAL_PAGES,
} from '@/lib/reading';
import { dayKey } from '@/lib/tracker';

const PLANS = [30, 60, 90, 180, 365];

export default function OkumaPlaniScreen() {
  const C = useColors();
  const st = useSt();
  const t = useT();
  const plan = readingStore.useValue();
  const today = new Date();
  const per = dailyPages(plan.days);
  const readToday = (plan.log[dayKey(today)] ?? 0) > 0;
  const from = plan.page + 1;
  const to = Math.min(TOTAL_PAGES, plan.page + per);
  const behind = Math.max(0, expectedPage(plan, today) - plan.page - (readToday ? 0 : per));

  if (!plan.days)
    return (
      <Screen title={t('reading.title')} back>
        <Text style={st.intro}>{t('reading.intro')}</Text>
        {PLANS.map((d) => (
          <Pressable key={d} onPress={() => startPlan(d)} style={({ pressed }) => [st.plan, pressed && { opacity: 0.8 }]}>
            <View style={st.planIcon}>
              <Ionicons name="book-outline" size={20} color={C.accent} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={st.planTitle}>{t('reading.planDays', { n: d })}</Text>
              <Text style={st.planSub}>{t('reading.perDay', { n: dailyPages(d) })}</Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color={C.textMute} />
          </Pressable>
        ))}
        {plan.finished > 0 ? <Text style={st.done}>{t('hatim.completed', { n: plan.finished })}</Text> : null}
      </Screen>
    );

  return (
    <Screen title={t('reading.title')} back>
      <Card style={{ backgroundColor: C.cardActive }}>
        <Text style={st.planTitle}>{t('reading.planDays', { n: plan.days })}</Text>
        <View style={st.bar}>
          <View style={[st.barFill, { width: `${(plan.page / TOTAL_PAGES) * 100}%` }]} />
        </View>
        <Text style={st.planSub}>{t('reading.progress', { n: plan.page, total: TOTAL_PAGES })}</Text>
        {behind > 0 ? <Text style={st.behind}>{t('reading.behind', { n: behind })}</Text> : null}
      </Card>

      <Card>
        <SectionTitle icon="today-outline">{t('reading.today')}</SectionTitle>
        <Text style={st.range}>{t('reading.range', { from, to })}</Text>
        <Btn
          label={t('reading.open')}
          icon="book"
          onPress={() => router.push({ pathname: '/mushaf', params: { sayfa: String(from) } })}
        />
        <Btn
          label={readToday ? t('reading.readAgain') : t('reading.markRead')}
          kind="ghost"
          icon="checkmark-done"
          onPress={() => {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            markTodayRead(to - plan.page);
          }}
        />
      </Card>

      <Text style={st.planSub}>{t('reading.daysRead', { n: readingDays(plan) })}</Text>
      <Btn
        label={t('reading.stop')}
        kind="ghost"
        icon="close-circle-outline"
        onPress={() =>
          Alert.alert(t('reading.stop'), t('reading.stopAsk'), [
            { text: t('common.cancel'), style: 'cancel' },
            { text: t('reading.stop'), style: 'destructive', onPress: stopPlan },
          ])
        }
      />
      <Text style={st.hint}>{t('reading.hint')}</Text>
    </Screen>
  );
}

const useSt = makeStyles((C) => ({
  intro: { color: C.textDim, fontSize: 14, lineHeight: 21 },
  plan: { flexDirection: 'row', alignItems: 'center', gap: S.md, backgroundColor: C.card, borderRadius: R.md, padding: S.md },
  planIcon: { width: 40, height: 40, borderRadius: 20, backgroundColor: C.cardSoft, alignItems: 'center', justifyContent: 'center' },
  planTitle: { color: C.text, fontSize: 16, fontWeight: '800' },
  planSub: { color: C.textDim, fontSize: 13 },
  done: { color: C.gold, fontSize: 14, fontWeight: '700', textAlign: 'center' },
  bar: { height: 8, borderRadius: 4, backgroundColor: C.bgDeep, overflow: 'hidden' },
  barFill: { height: 8, backgroundColor: C.accent },
  behind: { color: C.gold, fontSize: 13, fontWeight: '700' },
  range: { color: C.text, fontSize: 20, fontWeight: '800' },
  hint: { color: C.textMute, fontSize: 12.5, lineHeight: 18 },
}));
