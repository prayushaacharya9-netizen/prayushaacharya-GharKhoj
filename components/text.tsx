import { Text as RNText, type TextProps } from "react-native";

import { useThemeColor } from "@/hooks/use-theme-color";

/**
 * Universal Text component that automatically applies theme colors.
 * This is a drop-in replacement for React Native's Text component.
 * If you want to override the color, just pass a color prop in the style.
 */
export function Text({ style, ...props }: TextProps) {
  const textColor = useThemeColor({}, "text");

  return <RNText style={[{ color: textColor }, style]} {...props} />;
}
