import React from 'react';
import { View, ViewProps, StyleSheet } from 'react-native';
import { BlurView } from 'expo-blur';
import { useTheme, radius, spacing } from '../lib/theme';

interface Props extends ViewProps {
  intensity?: number;
  padded?: boolean;
}

export function GlassCard({ style, children, intensity = 30, padded = true, ...rest }: Props) {
  const theme = useTheme();
  return (
    <View
      style={[
        styles.wrap,
        {
          backgroundColor: theme.card,
          borderColor: theme.cardBorder,
          padding: padded ? spacing.lg : 0,
        },
        style,
      ]}
      {...rest}
    >
      <BlurView
        intensity={intensity}
        tint="dark"
        style={StyleSheet.absoluteFillObject}
        pointerEvents="none"
      />
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    borderRadius: radius.lg,
    borderWidth: StyleSheet.hairlineWidth,
    overflow: 'hidden',
  },
});
