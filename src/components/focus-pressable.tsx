import { useState, type ReactNode } from 'react';
import { Pressable, type PressableProps, type StyleProp, type ViewStyle } from 'react-native';

/**
 * TV kumandası (yön tuşları) ile gezinirken odaktaki öğeyi belli eden Pressable.
 * Dokunmatik ekranda normal Pressable gibi davranır.
 */
export function FocusPressable({
  style,
  focusStyle,
  children,
  ...rest
}: Omit<PressableProps, 'style' | 'children'> & {
  style?: StyleProp<ViewStyle>;
  focusStyle?: StyleProp<ViewStyle>;
  children: ReactNode;
  hasTVPreferredFocus?: boolean;
}) {
  const [focused, setFocused] = useState(false);
  return (
    <Pressable
      {...rest}
      onFocus={(e) => {
        setFocused(true);
        rest.onFocus?.(e);
      }}
      onBlur={(e) => {
        setFocused(false);
        rest.onBlur?.(e);
      }}
      style={({ pressed }) => [style, (focused || pressed) && focusStyle]}>
      {children}
    </Pressable>
  );
}
