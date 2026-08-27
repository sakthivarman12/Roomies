import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { supabase } from '../../lib/supabase';
import { useAuthStore } from '../../store/authStore';
import { useTheme, spacing, radius, typography } from '../../lib/theme';

export default function JoinRoom() {
  const theme = useTheme();
  const router = useRouter();
  const { session, setHasRoom } = useAuthStore();
  const [code, setCode] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function join() {
    if (!session || code.trim().length < 4) {
      setError('Enter a valid invite code');
      return;
    }
    setError(null);
    setSaving(true);

    const { data: room, error: roomError } = await supabase
      .from('rooms')
      .select('id, name')
      .eq('invite_code', code.trim().toUpperCase())
      .maybeSingle();

    if (roomError || !room) {
      setSaving(false);
      setError('Invalid invite code. Double-check with your roommate.');
      return;
    }

    const { error: joinError } = await supabase
      .from('room_members')
      .insert({ room_id: room.id, user_id: session.user.id, role: 'member' });

    setSaving(false);
    if (joinError && !joinError.message.includes('duplicate')) {
      setError(joinError.message);
      return;
    }

    setHasRoom(true);
    router.replace('/(tabs)/home');
  }

  return (
    <View style={{ flex: 1, backgroundColor: theme.bg, paddingTop: 100, paddingHorizontal: spacing.xl }}>
      <Text style={[typography.h1, { color: theme.text }]}>Join a room</Text>
      <Text style={[typography.body, { color: theme.textMuted, marginTop: spacing.xs }]}>
        Enter the invite code your roommate shared with you
      </Text>

      <TextInput
        value={code}
        onChangeText={(t) => setCode(t.toUpperCase())}
        placeholder="e.g. 8F2A9C1B"
        placeholderTextColor={theme.textFaint}
        autoCapitalize="characters"
        style={[styles.input, { backgroundColor: theme.card, borderColor: theme.cardBorder, color: theme.text }]}
        autoFocus
      />
      {error ? <Text style={{ color: theme.danger, marginTop: spacing.sm }}>{error}</Text> : null}

      <TouchableOpacity
        onPress={join}
        disabled={saving}
        style={[styles.button, { backgroundColor: theme.primary, opacity: saving ? 0.7 : 1 }]}
      >
        {saving ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>Join room</Text>}
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  input: {
    marginTop: spacing.xxl,
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: radius.md,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md + 2,
    fontSize: 16,
    letterSpacing: 2,
  },
  button: {
    marginTop: spacing.xxl,
    borderRadius: radius.pill,
    paddingVertical: spacing.md + 2,
    alignItems: 'center',
  },
  buttonText: { color: '#fff', fontWeight: '700', fontSize: 16 },
});
