import { requestWidgetUpdate, type WidgetTaskHandlerProps } from 'react-native-android-widget';

import { loadWidgetData } from './data';
import { NextPrayerWidget, PrayerTimesWidget } from './prayer-widgets';

export const WIDGETS = ['SiradakiVakit', 'NamazVakitleri'] as const;

async function render(name: string) {
  const d = await loadWidgetData();
  return name === 'SiradakiVakit' ? <NextPrayerWidget d={d} /> : <PrayerTimesWidget d={d} />;
}

/** Android widget olaylarını karşılar (eklendi, güncelleme zamanı, boyut değişti). */
export async function widgetTaskHandler(props: WidgetTaskHandlerProps) {
  switch (props.widgetAction) {
    case 'WIDGET_ADDED':
    case 'WIDGET_UPDATE':
    case 'WIDGET_RESIZED':
      props.renderWidget(await render(props.widgetInfo.widgetName));
      break;
    default:
      break;
  }
}

/** Uygulama açıkken (ayar değişti, vakit geçti) widget'ları tazeler. Android dışı ortamda sessizce geçer. */
export async function refreshWidgets() {
  for (const name of WIDGETS) {
    try {
      await requestWidgetUpdate({ widgetName: name, renderWidget: () => render(name) });
    } catch {
      // widget eklenmemiş ya da platform desteklemiyor
    }
  }
}
