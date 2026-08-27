import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { supabase } from '../../lib/supabase';
import { useAuthStore } from '../../store/authStore';
import { useTheme, spacing, radius, typography } from '../../lib/theme';

export default function CreateRoom() {
  const theme = useTheme();
  const router = useRouter();
  const { session, setHasRoom } = useAuthStore();
  const [name, setName] = useState('');
  const [saving, setSaving] = useState(false);

  async function create() {
    if (!session || !name.trim()) {
      Alert.alert('Room name required', 'Give your room a name, e.g. "Anna Nagar Roomies"');
      return;
    }
    setSaving(true);
    const { data, error } = await supabase
      .from('rooms')
      .insert({ name: name.trim(), created_by: session.user.id })
      .select()
      .single();
    setSaving(false);
    if (error || !data) {
      Alert.alert('Error', error?.message ?? 'Could not create room');
      return;
    }
    setHasRoom(true);
    router.push({ pathname: '/(onboarding)/invite', params: { roomId: data.id, inviteCode: data.invite_code } });
  }

  return (
    <View style={{ flex: 1, backgroundColor: theme.bg, paddingTop: 100, paddingHorizontal: spacing.xl }}>
      <Text style={[typography.h1, { color: theme.text }]}>Name your room</Text>
      <Text style={[typography.body, { color: theme.textMuted, marginTop: spacing.xs }]}>
        e.g. "Anna Nagar Roomies"
      </Text>

      <TextInput
        value={name}
        onChangeText={setName}
        placeholder="Room name"
        placeholderTextColor={theme.textFaint}
        style={[styles.input, { backgroundColor: theme.card, borderColor: theme.cardBorder, color: theme.text }]}
        autoFocus
      />

      <TouchableOpacity
        onPress={create}
        disabled={saving}
        style={[styles.button, { backgroundColor: theme.primary, opacity: saving ? 0.7 : 1 }]}
      >
        {saving ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>Create room</Text>}
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
  },
  button: {
    marginTop: spacing.xxl,
    borderRadius: radius.pill,
    paddingVertical: spacing.md + 2,
    alignItems: 'center',
  },
  buttonText: { color: '#fff', fontWeight: '700', fontSize: 16 },
});
