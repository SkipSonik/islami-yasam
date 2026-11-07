import Ionicons from "@expo/vector-icons/Ionicons";
import { router, useFocusEffect } from "expo-router";
import { useCallback, useMemo, useState } from "react";
import {
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  useWindowDimensions,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { R, S, useColors, makeStyles } from "@/constants/theme";
import { normalizeTr, surahName, SURAHS } from "@/data/surahs";
import { useAppState, useT } from "@/lib/app-state";
import { juzOf, pageOf } from "@/lib/mushaf";
import { isSurahCached } from "@/lib/quran";
import { loadValue } from "@/lib/storage";

export default function KuranScreen() {
  const C = useColors();
  const st = useSt();
  const insets = useSafeAreaInsets();
  const { lang } = useAppState();
  const t = useT();
  const [q, setQ] = useState("");
  const [, setTick] = useState(0);
  const [lastPage, setLastPage] = useState<number | null>(null);

  // Sayfaya her dönüşte "indirildi" işaretlerini ve son okunan sayfayı tazele.
  useFocusEffect(
    useCallback(() => {
      setTick((t) => t + 1);
      loadValue<number | null>("mushaf-son-sayfa", null).then(setLastPage);
    }, []),
  );

  const list = useMemo(() => {
    const n = normalizeTr(q.trim());
    if (!n) return SURAHS;
    return SURAHS.filter(
      (s) =>
        normalizeTr(s.name).includes(n) ||
        normalizeTr(surahName(s.number, lang)).includes(n) ||
        String(s.number) === n,
    );
  }, [q, lang]);

  const { width } = useWindowDimensions();
  const cols = width >= 1000 ? 3 : width >= 700 ? 2 : 1;

  return (
    <View
      style={[
        st.root,
        {
          paddingTop: insets.top,
          paddingLeft: insets.left,
          paddingRight: insets.right,
        },
      ]}
    >
      <View
        style={{ flex: 1, width: "100%", maxWidth: 1200, alignSelf: "center" }}
      >
        <FlatList
          key={cols}
          numColumns={cols}
          columnWrapperStyle={cols > 1 ? { gap: S.sm } : undefined}
          data={list}
          keyExtractor={(s) => String(s.number)}
          contentContainerStyle={{ padding: S.lg, paddingTop: 0, gap: S.sm }}
          keyboardShouldPersistTaps="handled"
          ListHeaderComponent={
            <View style={st.head}>
              <Text style={st.title}>{t("quran.title")}</Text>
              <Pressable
                onPress={() =>
                  router.push(
                    lastPage ? `/mushaf?sayfa=${lastPage}` : "/mushaf?sayfa=1",
                  )
                }
                style={({ pressed }) => [
                  st.mushafCard,
                  pressed && { opacity: 0.85 },
                ]}
              >
                <View style={st.mushafIcon}>
                  <Ionicons name="book" size={24} color={C.onAccent} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={st.mushafTitle}>{t("quran.mushaf")}</Text>
                  <Text style={st.mushafSub}>
                    {lastPage
                      ? t("quran.mushafResume", {
                          page: lastPage,
                          juz: juzOf(lastPage),
                        })
                      : t("quran.mushafHint")}
                  </Text>
                </View>
                <Ionicons name="chevron-forward" size={20} color={C.gold} />
              </Pressable>
              <Text style={st.sub}>{t("quran.offlineNote")}</Text>
              <View style={st.search}>
                <Ionicons name="search" size={18} color={C.textMute} />
                <TextInput
                  value={q}
                  onChangeText={setQ}
                  placeholder={t("quran.search")}
                  placeholderTextColor={C.textMute}
                  style={st.input}
                />
              </View>
            </View>
          }
          ListHeaderComponentStyle={{ marginHorizontal: -S.lg }}
          renderItem={({ item }) => (
            <Pressable
              onPress={() => router.push(`/kuran/${item.number}`)}
              style={({ pressed }) => [
                st.row,
                { flex: 1 },
                pressed && { backgroundColor: C.cardSoft },
              ]}
            >
              <View style={st.num}>
                <Text style={st.numText}>{item.number}</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={st.name}>{surahName(item.number, lang)}</Text>
                <Text style={st.meta}>
                  {t("quran.ayahsPage", {
                    n: item.ayahs,
                    page: pageOf(item.number),
                  })}
                </Text>
              </View>
              {isSurahCached(item.number) ? (
                <Ionicons name="checkmark-circle" size={18} color={C.accent} />
              ) : (
                <Ionicons
                  name="cloud-download-outline"
                  size={18}
                  color={C.textMute}
                />
              )}
            </Pressable>
          )}
        />
      </View>
    </View>
  );
}

const useSt = makeStyles((C) => ({
  root: { flex: 1, backgroundColor: C.bg },
  head: { padding: S.lg, gap: S.sm },
  title: { color: C.text, fontSize: 22, fontWeight: "700" },
  sub: { color: C.textDim, fontSize: 13 },
  search: {
    flexDirection: "row",
    alignItems: "center",
    gap: S.sm,
    backgroundColor: C.card,
    borderRadius: R.md,
    paddingHorizontal: S.md,
    marginTop: S.sm,
  },
  input: { flex: 1, color: C.text, fontSize: 15, paddingVertical: 12 },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: S.md,
    backgroundColor: C.card,
    borderRadius: R.md,
    padding: S.md,
  },
  num: {
    width: 38,
    height: 38,
    borderRadius: 10,
    backgroundColor: C.cardSoft,
    alignItems: "center",
    justifyContent: "center",
    transform: [{ rotate: "45deg" }],
  },
  numText: {
    color: C.gold,
    fontWeight: "700",
    transform: [{ rotate: "-45deg" }],
  },
  name: { color: C.text, fontSize: 16, fontWeight: "600" },
  mushafCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: S.md,
    backgroundColor: C.cardActive,
    borderRadius: R.md,
    padding: S.md,
    borderWidth: 1,
    borderColor: C.gold,
  },
  mushafIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: C.gold,
    alignItems: "center",
    justifyContent: "center",
  },
  mushafTitle: { color: C.text, fontSize: 16, fontWeight: "800" },
  mushafSub: { color: C.textDim, fontSize: 12.5, marginTop: 2 },
  meta: { color: C.textDim, fontSize: 12, marginTop: 2 },
}));
