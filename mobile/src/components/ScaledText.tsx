import { createContext, forwardRef, useContext } from 'react';
import {
  Text as RNText,
  TextInput as RNTextInput,
  StyleSheet,
  type StyleProp,
  type TextProps,
  type TextInputProps,
  type TextStyle,
} from 'react-native';
import { useFontScale } from '../config/font-scale';

// Drop-in replacements for RN Text / TextInput that apply the user's
// font-size setting. Screens import these instead of the react-native ones.

// RN's implicit font size when a style doesn't set one.
const DEFAULT_FONT_SIZE = 14;

// Nested <Text> inherits its parent's (already scaled) size, so only the
// outermost Text should fill in a scaled default.
const InsideText = createContext(false);

function scaledStyle(
  style: StyleProp<TextStyle>,
  scale: number,
  applyDefault: boolean,
): StyleProp<TextStyle> {
  if (scale === 1) return style;
  const flat = StyleSheet.flatten(style) ?? {};
  const override: TextStyle = {};
  if (flat.fontSize != null) override.fontSize = flat.fontSize * scale;
  else if (applyDefault) override.fontSize = DEFAULT_FONT_SIZE * scale;
  if (flat.lineHeight != null) override.lineHeight = flat.lineHeight * scale;
  return [style, override];
}

export const Text = forwardRef<RNText, TextProps>(function Text({ style, ...props }, ref) {
  const { scale } = useFontScale();
  const nested = useContext(InsideText);
  const text = <RNText ref={ref} style={scaledStyle(style, scale, !nested)} {...props} />;
  return nested ? text : <InsideText.Provider value>{text}</InsideText.Provider>;
});

export const TextInput = forwardRef<RNTextInput, TextInputProps>(function TextInput({ style, ...props }, ref) {
  const { scale } = useFontScale();
  return <RNTextInput ref={ref} style={scaledStyle(style, scale, true)} {...props} />;
});
