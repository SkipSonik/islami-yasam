import Ionicons from '@expo/vector-icons/Ionicons';
import { createAudioPlayer, type AudioPlayer } from 'expo-audio';
import { useEffect, useRef, useState } from 'react';
import { Pressable, Text, View } from 'react-native';

import { R, S, makeStyles, useColors } from '@/constants/theme';
import type { StringKey } from '@/i18n';
import { useT } from '@/lib/app-state';
import { SOUNDS, type SoundId } from '@/lib/sounds';

/** Vakit bildirimi sesi seçici; her sesin yanında dinleme düğmesi vardır. */
export function SoundPicker({ value, onChange }: { value: SoundId; onChange: (id: SoundId) => void }) {
  const C = useColors();
  const st = useSt();
  const t = useT();
  const player = useRef<AudioPlayer | null>(null);
  const [playing, setPlaying] = useState<SoundId | null>(null);

  useEffect(() => () => player.current?.remove(), []);

  const preview = (id: SoundId, asset?: number) => {
    player.current?.remove();
    player.current = null;
    if (!asset || playing === id) {
      setPlaying(null);
      return;
    }
    const p = createAudioPlayer(asset);
    player.current = p;
    setPlaying(id);
    p.addListener('playbackStatusUpdate', (s) => {
      if (s.didJustFinish) setPlaying((cur) => (cur === id ? null : cur));
    });
    p.play();
  };

  return (
    <View style={{ gap: 2 }}>
      {SOUNDS.map((s) => {
        const on = value === s.id;
        return (
          <Pressable key={s.id} style={[st.row, on && st.rowOn]} onPress={() => onChange(s.id)}>
            <Ionicons name={on ? 'radio-button-on' : 'radio-button-off'} size={20} color={on ? C.accent : C.textMute} />
            <Text style={[st.label, on && { color: C.text, fontWeight: '700' }]}>{t(`sound.${s.id}` as StringKey)}</Text>
            {s.asset ? (
              <Pressable hitSlop={8} style={st.play} onPress={() => preview(s.id, s.asset)}>
                <Ionicons name={playing === s.id ? 'stop' : 'play'} size={16} color={C.accent} />
              </Pressable>
            ) : null}
          </Pressable>
        );
      })}
    </View>
  );
}

const useSt = makeStyles((C) => ({
  row: { flexDirection: 'row', alignItems: 'center', gap: S.md, paddingVertical: 9, paddingHorizontal: S.sm, borderRadius: R.sm },
  rowOn: { backgroundColor: C.cardSoft },
  label: { flex: 1, color: C.textDim, fontSize: 15 },
  play: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: C.accent,
    alignItems: 'center',
    justifyContent: 'center',
  },
}));
