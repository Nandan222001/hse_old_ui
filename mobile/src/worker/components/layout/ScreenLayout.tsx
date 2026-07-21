import React from 'react';
import { View, StatusBar, StyleSheet, ViewStyle } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors } from '../../theme/colors';

interface ScreenLayoutProps {
  children: React.ReactNode;
  style?: ViewStyle;
  barStyle?: 'light-content' | 'dark-content';
  bg?: string;
  /** Use true for screens whose header is dark (primary color) */
  darkHeader?: boolean;
}

export function ScreenLayout({
  children,
  style,
  barStyle,
  bg = Colors.background,
  darkHeader = false,
}: ScreenLayoutProps) {
  const resolvedBarStyle = barStyle ?? (darkHeader ? 'light-content' : 'dark-content');
  return (
    <View style={[styles.root, { backgroundColor: bg }, style]}>
      <StatusBar barStyle={resolvedBarStyle} backgroundColor={darkHeader ? Colors.primary : bg} />
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
});
