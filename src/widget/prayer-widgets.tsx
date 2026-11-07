import { FlexWidget, TextWidget } from 'react-native-android-widget';

import type { WidgetData } from './data';

type Hex = `#${string}`;
const hex = (c: string) => (c.startsWith('#') ? c : '#000000') as Hex;

/** Küçük widget (2x1): sıradaki vakit ve saati. */
export function NextPrayerWidget({ d }: { d: WidgetData }) {
  const { C } = d;
  return (
    <FlexWidget
      clickAction="OPEN_APP"
      style={{
        height: 'match_parent',
        width: 'match_parent',
        backgroundColor: hex(C.cardActive),
        borderRadius: 22,
        padding: 12,
        justifyContent: 'center',
        alignItems: 'center',
      }}>
      <TextWidget text={d.nextLabel} style={{ fontSize: 12, color: hex(C.textDim) }} />
      <TextWidget text={d.next.label} style={{ fontSize: 20, fontWeight: 'bold', color: hex(C.text) }} />
      <TextWidget text={d.next.time} style={{ fontSize: 26, fontWeight: 'bold', color: hex(C.gold) }} />
      <TextWidget text={d.place} maxLines={1} truncate="END" style={{ fontSize: 11, color: hex(C.textMute) }} />
    </FlexWidget>
  );
}

/** Orta widget (4x2): altı vakit, şu anki vakit vurgulu; hicri tarih ve şehir. */
export function PrayerTimesWidget({ d }: { d: WidgetData }) {
  const { C } = d;
  return (
    <FlexWidget
      clickAction="OPEN_APP"
      style={{
        height: 'match_parent',
        width: 'match_parent',
        backgroundColor: hex(C.bg),
        borderRadius: 22,
        padding: 12,
        flexGap: 8,
      }}>
      <FlexWidget
        style={{ flexDirection: 'row', width: 'match_parent', justifyContent: 'space-between', alignItems: 'center' }}>
        <TextWidget
          text={d.place}
          maxLines={1}
          truncate="END"
          style={{ fontSize: 13, fontWeight: 'bold', color: hex(C.text) }}
        />
        <TextWidget text={d.hijri} maxLines={1} style={{ fontSize: 12, color: hex(C.gold) }} />
      </FlexWidget>
      <FlexWidget style={{ flexDirection: 'row', width: 'match_parent', flex: 1, flexGap: 5 }}>
        {d.times.map((p) => {
          const active = p.key === d.current;
          return (
            <FlexWidget
              key={p.key}
              style={{
                flex: 1,
                height: 'match_parent',
                borderRadius: 14,
                backgroundColor: active ? hex(C.accent) : hex(C.card),
                justifyContent: 'center',
                alignItems: 'center',
                paddingVertical: 6,
              }}>
              <TextWidget
                text={p.label}
                maxLines={1}
                style={{ fontSize: 11, color: active ? hex(C.onAccent) : hex(C.textDim) }}
              />
              <TextWidget
                text={p.time}
                style={{ fontSize: 15, fontWeight: 'bold', color: active ? hex(C.onAccent) : hex(C.text) }}
              />
            </FlexWidget>
          );
        })}
      </FlexWidget>
      <TextWidget
        text={`${d.nextLabel}: ${d.next.label} ${d.next.time}`}
        style={{ fontSize: 12, color: hex(C.textDim) }}
      />
    </FlexWidget>
  );
}
