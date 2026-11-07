import Ionicons from '@expo/vector-icons/Ionicons';
import { router } from 'expo-router';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Image, Modal, Pressable, ScrollView, Text, useWindowDimensions, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Btn, Screen } from '@/components/ui';
import { R, S, makeStyles, useColors } from '@/constants/theme';
import { useAppState, useT } from '@/lib/app-state';
import {
  catName,
  imageUrl,
  loadMessages,
  messagesStore,
  shareImage,
  suggestedCat,
  thumbUrl,
  type MsgItem,
} from '@/lib/messages';
import { premiumStore } from '@/lib/premium-store';

export default function MesajlarScreen() {
  const C = useColors();
  const st = useSt();
  const t = useT();
  const { lang, settings } = useAppState();
  const premium = premiumStore.useValue().active;
  const cached = messagesStore.useValue().list;
  const [list, setList] = useState(cached);
  const [loading, setLoading] = useState(!cached);
  const [error, setError] = useState(false);
  const today = useMemo(() => suggestedCat(new Date(), settings.hijriOffset), [settings.hijriOffset]);
  const [cat, setCat] = useState<string>(today ?? 'all');
  const [open, setOpen] = useState<MsgItem | null>(null);
  const { width } = useWindowDimensions();
  const inner = Math.min(width, 1200) - S.lg * 2;
  const cols = inner >= 900 ? 5 : inner >= 640 ? 4 : inner >= 460 ? 3 : 2;
  const tile = (inner - S.sm * (cols - 1)) / cols;

  const load = useCallback((force = false) => {
    setError(false);
    setLoading(true);
    loadMessages(force)
      .then(setList)
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const cats = list?.cats.filter((c) => list.items.some((i) => i.cat === c.id)) ?? [];
  const items = (list?.items ?? []).filter((i) => cat === 'all' || i.cat === cat);
  // Ücretsiz resimler önce gelsin
  const sorted = premium ? items : [...items.filter((i) => i.free), ...items.filter((i) => !i.free)];

  return (
    <Screen title={t('msg.title')} back wide>
      {cats.length ? (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: S.sm }}>
          {[{ id: 'all' }, ...cats].map((c) => {
            const on = c.id === cat;
            const label = c.id === 'all' ? t('msg.all') : catName(c as (typeof cats)[number], lang);
            return (
              <Pressable key={c.id} onPress={() => setCat(c.id)} style={[st.chip, on && st.chipOn]}>
                {c.id === today ? <Ionicons name="star" size={12} color={on ? C.onAccent : C.gold} /> : null}
                <Text style={[st.chipText, on && { color: C.onAccent }]}>{label}</Text>
              </Pressable>
            );
          })}
        </ScrollView>
      ) : null}

      {today && cat === today ? <Text style={st.today}>★ {t('msg.today')}</Text> : null}

      {loading && !list ? <ActivityIndicator color={C.accent} style={{ marginTop: 40 }} /> : null}

      {error && !list ? (
        <View style={st.center}>
          <Ionicons name="cloud-offline-outline" size={40} color={C.textMute} />
          <Text style={st.muted}>{t('msg.error')}</Text>
          <Btn label={t('msg.retry')} icon="refresh" onPress={() => load(true)} />
        </View>
      ) : null}

      <View style={st.grid}>
        {sorted.map((it) => {
          const locked = !it.free && !premium;
          return (
            <Pressable
              key={it.id}
              onPress={() => (locked ? router.push('/premium') : setOpen(it))}
              style={({ pressed }) => [
                st.tile,
                {
                  width: tile,
                  height: tile * 1.25,
                  opacity: pressed ? 0.85 : 1,
                },
              ]}>
              <Image source={{ uri: thumbUrl(it) }} style={st.img} resizeMode="cover" />
              {locked ? (
                <View style={st.lock}>
                  <Ionicons name="diamond" size={22} color={C.onAccent} />
                </View>
              ) : null}
            </Pressable>
          );
        })}
      </View>

      {!premium && list?.items.some((i) => !i.free) ? (
        <Btn label={t('msg.unlock')} icon="diamond-outline" onPress={() => router.push('/premium')} />
      ) : null}

      <Viewer item={open} onClose={() => setOpen(null)} />
    </Screen>
  );
}

function Viewer({ item, onClose }: { item: MsgItem | null; onClose: () => void }) {
  const C = useColors();
  const st = useSt();
  const t = useT();
  const insets = useSafeAreaInsets();
  const [busy, setBusy] = useState(false);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => setLoaded(false), [item?.id]);

  const share = async () => {
    if (!item || busy) return;
    setBusy(true);
    try {
      await shareImage(item, t('msg.share'));
    } catch {
      // paylaşım iptal edildi ya da indirme başarısız oldu
    } finally {
      setBusy(false);
    }
  };

  return (
    <Modal visible={!!item} animationType="fade" transparent onRequestClose={onClose}>
      <View
        style={[
          st.viewer,
          {
            paddingTop: insets.top + S.md,
            paddingBottom: insets.bottom + S.lg,
          },
        ]}>
        <Pressable onPress={onClose} style={st.close} hitSlop={12} accessibilityLabel={t('msg.close')}>
          <Ionicons name="close" size={28} color="#fff" />
        </Pressable>
        {item ? (
          <View style={st.viewerImgWrap}>
            {!loaded ? <ActivityIndicator color="#fff" style={{ position: 'absolute' }} /> : null}
            <Image
              source={{ uri: imageUrl(item) }}
              style={st.viewerImg}
              resizeMode="contain"
              onLoad={() => setLoaded(true)}
            />
          </View>
        ) : null}
        <Pressable onPress={share} style={({ pressed }) => [st.shareBtn, { opacity: pressed || busy ? 0.7 : 1 }]}>
          {busy ? (
            <ActivityIndicator color={C.onAccent} />
          ) : (
            <Ionicons name="share-social" size={20} color={C.onAccent} />
          )}
          <Text style={st.shareText}>{t('msg.share')}</Text>
        </Pressable>
      </View>
    </Modal>
  );
}

const useSt = makeStyles((C) => ({
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 18,
    backgroundColor: C.card,
  },
  chipOn: { backgroundColor: C.accent },
  chipText: { color: C.textDim, fontWeight: '700', fontSize: 13 },
  today: { color: C.gold, fontWeight: '700', fontSize: 13, marginTop: -S.sm },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: S.sm },
  tile: { borderRadius: R.md, overflow: 'hidden', backgroundColor: C.card },
  img: { width: '100%', height: '100%' },
  lock: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: C.gold,
    alignItems: 'center',
    justifyContent: 'center',
  },
  center: { alignItems: 'center', gap: S.md, marginTop: 40 },
  muted: { color: C.textMute, textAlign: 'center' },
  viewer: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.92)',
    alignItems: 'center',
    paddingHorizontal: S.lg,
  },
  close: { alignSelf: 'flex-end', padding: 4 },
  viewerImgWrap: {
    flex: 1,
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  viewerImg: { width: '100%', height: '100%' },
  shareBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: S.sm,
    backgroundColor: C.accent,
    paddingHorizontal: 28,
    paddingVertical: 14,
    borderRadius: 28,
    marginTop: S.md,
  },
  shareText: { color: C.onAccent, fontWeight: '800', fontSize: 16 },
}));
