import Ionicons from '@expo/vector-icons/Ionicons';
import { router } from 'expo-router';
import type { ComponentProps, ReactNode } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View, type ViewStyle } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { R, S, useColors, makeStyles } from '@/constants/theme';
import { READ_MAX, WIDE_MAX, useLayout } from '@/lib/layout';

export type IconName = ComponentProps<typeof Ionicons>['name'];

export function Screen({
  children,
  title,
  back,
  scroll = true,
  right,
  wide = false,
}: {
  children: ReactNode;
  title?: string;
  back?: boolean;
  scroll?: boolean;
  right?: ReactNode;
  /** İki sütunlu içerik (yatay/tablet) için daha geniş alan */
  wide?: boolean;
}) {
  const C = useColors();
  const st = useSt();
  const insets = useSafeAreaInsets();
  // Yatay ekranda çentik/kenar boşlukları ve okunabilir en büyük genişlik
  const frame: ViewStyle = {
    width: '100%',
    maxWidth: wide ? WIDE_MAX : READ_MAX,
    alignSelf: 'center',
  };
  const header = title ? (
    <View style={st.header}>
      {back ? (
        <Pressable hitSlop={12} onPress={() => router.back()} style={st.headerBtn}>
          <Ionicons name="arrow-back" size={22} color={C.text} />
        </Pressable>
      ) : null}
      <Text style={[st.headerTitle, back && { textAlign: 'center' }]} numberOfLines={1}>
        {title}
      </Text>
      {back ? <View style={st.headerBtn}>{right}</View> : right}
    </View>
  ) : null;

  return (
    <View
      style={[
        st.root,
        {
          paddingTop: insets.top,
          paddingLeft: insets.left,
          paddingRight: insets.right,
        },
      ]}>
      {header ? <View style={frame}>{header}</View> : null}
      {scroll ? (
        <ScrollView contentContainerStyle={[st.content, frame]} showsVerticalScrollIndicator={false}>
          {children}
        </ScrollView>
      ) : (
        <View style={[st.content, frame, { flex: 1 }]}>{children}</View>
      )}
    </View>
  );
}

/** Geniş ekranda iki sütun, dar ekranda alt alta. */
export function Split({ left, right, ratio = 1 }: { left: ReactNode; right: ReactNode; ratio?: number }) {
  const { wide } = useLayout();
  if (!wide) {
    return (
      <>
        {left}
        {right}
      </>
    );
  }
  return (
    <View style={{ flexDirection: 'row', gap: S.lg, alignItems: 'flex-start' }}>
      <View style={{ flex: ratio, gap: S.lg }}>{left}</View>
      <View style={{ flex: 1, gap: S.lg }}>{right}</View>
    </View>
  );
}

/** Öğeleri genişliğe göre 1-3 sütunlu ızgaraya dizer (liste satırları, kartlar). */
export function Grid({ children, min = 340 }: { children: ReactNode[]; min?: number }) {
  const { width } = useLayout();
  const cols = Math.max(1, Math.min(3, Math.floor(Math.min(width, WIDE_MAX) / min)));
  if (cols === 1) return <View style={{ gap: S.sm }}>{children}</View>;
  const rows: ReactNode[][] = [];
  children.forEach((c, i) => (i % cols === 0 ? rows.push([c]) : rows[rows.length - 1].push(c)));
  return (
    <View style={{ gap: S.sm }}>
      {rows.map((row, r) => (
        <View key={r} style={{ flexDirection: 'row', gap: S.sm }}>
          {Array.from({ length: cols }, (_, i) => (
            <View key={i} style={{ flex: 1 }}>
              {row[i] ?? null}
            </View>
          ))}
        </View>
      ))}
    </View>
  );
}

export function Card({ children, style }: { children: ReactNode; style?: ViewStyle }) {
  const st = useSt();
  return <View style={[st.card, style]}>{children}</View>;
}

export function SectionTitle({ icon, children }: { icon?: IconName; children: ReactNode }) {
  const C = useColors();
  const st = useSt();
  return (
    <View style={st.sectionTitle}>
      {icon ? <Ionicons name={icon} size={18} color={C.accent} /> : null}
      <Text style={st.sectionText}>{children}</Text>
    </View>
  );
}

export function ListRow({
  icon,
  title,
  subtitle,
  onPress,
  right,
}: {
  icon?: IconName;
  title: string;
  subtitle?: string;
  onPress?: () => void;
  right?: ReactNode;
}) {
  const C = useColors();
  const st = useSt();
  return (
    <Pressable
      onPress={onPress}
      disabled={!onPress}
      style={({ pressed }) => [st.row, pressed && { backgroundColor: C.cardSoft }]}>
      {icon ? (
        <View style={st.rowIcon}>
          <Ionicons name={icon} size={20} color={C.accent} />
        </View>
      ) : null}
      <View style={{ flex: 1 }}>
        <Text style={st.rowTitle}>{title}</Text>
        {subtitle ? <Text style={st.rowSub}>{subtitle}</Text> : null}
      </View>
      {right ?? (onPress ? <Ionicons name="chevron-forward" size={18} color={C.textMute} /> : null)}
    </Pressable>
  );
}

export function Btn({
  label,
  onPress,
  kind = 'primary',
  icon,
}: {
  label: string;
  onPress: () => void;
  kind?: 'primary' | 'ghost' | 'danger';
  icon?: IconName;
}) {
  const C = useColors();
  const st = useSt();
  const bg = kind === 'primary' ? C.accent : kind === 'danger' ? C.dangerBg : C.cardSoft;
  const fg = kind === 'primary' ? C.bgDeep : kind === 'danger' ? C.danger : C.text;
  return (
    <Pressable onPress={onPress} style={({ pressed }) => [st.btn, { backgroundColor: bg, opacity: pressed ? 0.8 : 1 }]}>
      {icon ? <Ionicons name={icon} size={18} color={fg} /> : null}
      <Text style={[st.btnText, { color: fg }]}>{label}</Text>
    </Pressable>
  );
}

const useSt = makeStyles((C) => ({
  root: { flex: 1, backgroundColor: C.bg },
  content: { padding: S.lg, paddingBottom: 40, gap: S.lg },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: S.lg,
    paddingVertical: S.md,
    gap: S.md,
  },
  headerBtn: { minWidth: 32, alignItems: 'center' },
  headerTitle: { flex: 1, color: C.text, fontSize: 22, fontWeight: '700' },
  card: {
    backgroundColor: C.card,
    borderRadius: R.lg,
    padding: S.lg,
    gap: S.md,
  },
  sectionTitle: { flexDirection: 'row', alignItems: 'center', gap: S.sm },
  sectionText: { color: C.text, fontSize: 17, fontWeight: '700' },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: S.md,
    paddingVertical: S.md,
    paddingHorizontal: S.md,
    borderRadius: R.md,
    backgroundColor: C.card,
  },
  rowIcon: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: C.cardSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rowTitle: { color: C.text, fontSize: 16, fontWeight: '600' },
  rowSub: { color: C.textDim, fontSize: 13, marginTop: 2 },
  btn: {
    flexDirection: 'row',
    gap: S.sm,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: R.md,
  },
  btnText: { fontSize: 16, fontWeight: '700' },
}));
