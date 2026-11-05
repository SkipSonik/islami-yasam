import Ionicons from '@expo/vector-icons/Ionicons';
import type { ColorValue } from 'react-native';
import { BottomTabBar, Tabs } from 'expo-router/js-tabs';
import { View } from 'react-native';

import type { IconName } from '@/components/ui';
import { MiniPlayer } from '@/components/mini-player';
import { useColors } from '@/constants/theme';
import { useT } from '@/lib/app-state';

const icon =
  (name: IconName, active: IconName) =>
  ({ focused, color, size }: { focused: boolean; color: ColorValue; size: number }) => (
    <Ionicons name={focused ? active : name} color={color as string} size={size} />
  );

export default function TabsLayout() {
  const C = useColors();
  const t = useT();
  return (
    <Tabs
      tabBar={(props) => (
        <View style={{ backgroundColor: C.bg }}>
          <MiniPlayer />
          <BottomTabBar {...props} />
        </View>
      )}
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: C.accent,
        tabBarInactiveTintColor: C.textMute,
        tabBarStyle: { backgroundColor: C.bgDeep, borderTopColor: C.border },
        tabBarLabelStyle: { fontSize: 11 },
      }}>
      <Tabs.Screen name="index" options={{ title: t('tab.home'), tabBarIcon: icon('home-outline', 'home') }} />
      <Tabs.Screen name="vakitler" options={{ title: t('tab.times'), tabBarIcon: icon('time-outline', 'time') }} />
      <Tabs.Screen name="kuran" options={{ title: t('tab.quran'), tabBarIcon: icon('book-outline', 'book') }} />
      <Tabs.Screen name="kible" options={{ title: t('tab.qibla'), tabBarIcon: icon('compass-outline', 'compass') }} />
      <Tabs.Screen name="araclar" options={{ title: t('tab.tools'), tabBarIcon: icon('grid-outline', 'grid') }} />
    </Tabs>
  );
}
