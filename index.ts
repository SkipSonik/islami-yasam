// Uygulama giriş noktası: Expo Router + Android ana ekran widget'ları
import 'expo-router/entry';

import { Platform } from 'react-native';
import { registerWidgetTaskHandler } from 'react-native-android-widget';

import { widgetTaskHandler } from './src/widget/task-handler';

if (Platform.OS === 'android') registerWidgetTaskHandler(widgetTaskHandler);
