import { KeyboardAvoidingView, Modal, Platform, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

import { Btn } from '@/components/ui';
import { R, S, useColors, makeStyles } from '@/constants/theme';

export type FormField = {
  key: string;
  placeholder: string;
  value: string;
  onChange: (v: string) => void;
  autoCapitalize?: 'none' | 'characters' | 'sentences' | 'words';
  maxLength?: number;
};

export function FormModal({
  visible,
  title,
  fields,
  submitLabel,
  cancelLabel,
  busy,
  error,
  onSubmit,
  onClose,
}: {
  visible: boolean;
  title: string;
  fields: FormField[];
  submitLabel: string;
  cancelLabel: string;
  busy?: boolean;
  error?: string | null;
  onSubmit: () => void;
  onClose: () => void;
}) {
  const C = useColors();
  const st = useSt();
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={st.backdrop}>
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />
        <View style={st.card}>
          <Text style={st.title}>{title}</Text>
          {fields.map((f) => (
            <TextInput
              key={f.key}
              value={f.value}
              onChangeText={f.onChange}
              placeholder={f.placeholder}
              placeholderTextColor={C.textMute}
              autoCapitalize={f.autoCapitalize ?? 'sentences'}
              maxLength={f.maxLength}
              style={st.input}
            />
          ))}
          {error ? <Text style={st.error}>{error}</Text> : null}
          <Btn label={busy ? '…' : submitLabel} onPress={busy ? () => {} : onSubmit} />
          <Btn label={cancelLabel} kind="ghost" onPress={onClose} />
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const useSt = makeStyles((C) => ({
  backdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'center', padding: S.xl },
  card: { backgroundColor: C.card, borderRadius: R.lg, padding: S.lg, gap: S.md },
  title: { color: C.text, fontSize: 18, fontWeight: '800' },
  input: {
    backgroundColor: C.bgDeep,
    color: C.text,
    borderRadius: R.sm,
    paddingHorizontal: S.md,
    paddingVertical: 11,
    fontSize: 15,
  },
  error: { color: C.danger, fontSize: 13.5 },
}));
