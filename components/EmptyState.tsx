import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useTheme, spacing, typography, radius } from '../lib/theme';

interface Props {
  emoji?: string;
  title: string;
  subtitle?: string;
  actionLabel?: string;
  onAction?: () => void;
}

export function EmptyState({ emoji, title, subtitle, actionLabel, onAction }: Props) {
  const theme = useTheme();
  return (
    <View style={styles.wrap}>
      {emoji ? <Text style={styles.emoji}>{emoji}</Text> : null}
      <Text style={[typography.h2, { color: theme.text, textAlign: 'center' }]}>{title}</Text>
      {subtitle ? (
        <Text
          style={[
            typography.body,
            { color: theme.textMuted, textAlign: 'center', marginTop: spacing.xs },
          ]}
        >
          {subtitle}
        </Text>
      ) : null}
      {actionLabel && onAction ? (
        <TouchableOpacity
          onPress={onAction}
          style={[styles.btn, { backgroundColor: theme.primary }]}
        >
          <Text style={{ color: '#fff', fontWeight: '700' }}>{actionLabel}</Text>
        </TouchableOpacity>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { alignItems: 'center', justifyContent: 'center', padding: spacing.xxl, gap: spacing.sm },
  emoji: { fontSize: 44, marginBottom: spacing.sm },
  btn: {
    marginTop: spacing.md,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
    borderRadius: radius.pill,
  },
});
