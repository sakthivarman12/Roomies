import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { useTheme, spacing, radius, typography } from '../../lib/theme';
import { GlassCard } from '../../components/GlassCard';

export default function RoomChoice() {
  const theme = useTheme();
  const router = useRouter();

  return (
    <View style={{ flex: 1, backgroundColor: theme.bg, paddingTop: 100, paddingHorizontal: spacing.xl }}>
      <Text style={[typography.h1, { color: theme.text }]}>Set up your space</Text>
      <Text style={[typography.body, { color: theme.textMuted, marginTop: spacing.xs }]}>
        Create a new Roomies room or join one with an invite code
      </Text>

      <TouchableOpacity onPress={() => router.push('/(onboarding)/create-room')} style={{ marginTop: spacing.xxl }}>
        <GlassCard style={styles.optionCard}>
          <Text style={styles.emoji}>🏠</Text>
          <Text style={[typography.h2, { color: theme.text, marginTop: spacing.sm }]}>Create a room</Text>
          <Text style={[typography.body, { color: theme.textMuted, marginTop: 2 }]}>
            Start a fresh private space and invite your roommates
          </Text>
        </GlassCard>
      </TouchableOpacity>

      <TouchableOpacity onPress={() => router.push('/(onboarding)/join-room')} style={{ marginTop: spacing.lg }}>
        <GlassCard style={styles.optionCard}>
          <Text style={styles.emoji}>🔑</Text>
          <Text style={[typography.h2, { color: theme.text, marginTop: spacing.sm }]}>Join a room</Text>
          <Text style={[typography.body, { color: theme.textMuted, marginTop: 2 }]}>
            Have an invite code? Join your roommates' existing space
          </Text>
        </GlassCard>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  optionCard: { padding: spacing.xl },
  emoji: { fontSize: 32 },
});
