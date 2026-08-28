import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Image, Alert } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { useRouter } from 'expo-router';
import { supabase } from '../../lib/supabase';
import { useAuthStore } from '../../store/authStore';
import { useTheme, spacing, radius, typography } from '../../lib/theme';
import { Avatar } from '../../components/Avatar';

export default function ProfileSetup() {
  const theme = useTheme();
  const router = useRouter();
  const { profile, session, setProfile } = useAuthStore();
  const [name, setName] = useState(profile?.name ?? '');
  const [avatarUri, setAvatarUri] = useState<string | null>(profile?.avatar_url ?? null);
  const [saving, setSaving] = useState(false);

  async function pickImage() {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });
    if (!result.canceled) setAvatarUri(result.assets[0].uri);
  }

  async function save() {
    if (!session || !name.trim()) {
      Alert.alert('Name required', 'Please enter your name.');
      return;
    }
    setSaving(true);
    let avatar_url = profile?.avatar_url ?? null;

    if (avatarUri && avatarUri !== profile?.avatar_url) {
      const response = await fetch(avatarUri);
      const blob = await response.arrayBuffer();
      const ext = avatarUri.split('.').pop() || 'jpg';
      const path = `${session.user.id}/avatar.${ext}`;
      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(path, blob, { upsert: true, contentType: `image/${ext}` });
      if (!uploadError) {
        const { data } = supabase.storage.from('avatars').getPublicUrl(path);
        avatar_url = data.publicUrl;
      }
    }

    const { data, error } = await supabase
      .from('users')
      .update({ name: name.trim(), avatar_url })
      .eq('id', session.user.id)
      .select()
      .single();

    setSaving(false);
    if (error) {
      Alert.alert('Error', error.message);
      return;
    }
    setProfile(data);
    router.push('/(onboarding)/room-choice');
  }

  return (
    <View style={{ flex: 1, backgroundColor: theme.bg, paddingTop: 100, paddingHorizontal: spacing.xl }}>
      <Text style={[typography.h1, { color: theme.text }]}>Welcome to Roomies</Text>
      <Text style={[typography.body, { color: theme.textMuted, marginTop: spacing.xs }]}>
        Let's set up your profile
      </Text>

      <TouchableOpacity onPress={pickImage} style={styles.avatarWrap}>
        {avatarUri ? (
          <Image source={{ uri: avatarUri }} style={styles.avatarImg} />
        ) : (
          <Avatar name={name || 'You'} size={100} />
        )}
        <View style={[styles.editBadge, { backgroundColor: theme.primary }]}>
          <Text style={{ color: '#fff', fontSize: 12, fontWeight: '700' }}>Edit</Text>
        </View>
      </TouchableOpacity>

      <Text style={[typography.caption, { color: theme.textMuted, marginTop: spacing.xl, marginBottom: spacing.xs }]}>
        YOUR NAME
      </Text>
      <TextInput
        value={name}
        onChangeText={setName}
        placeholder="Enter your name"
        placeholderTextColor={theme.textFaint}
        style={[styles.input, { backgroundColor: theme.card, borderColor: theme.cardBorder, color: theme.text }]}
      />

      <TouchableOpacity
        onPress={save}
        disabled={saving}
        style={[styles.button, { backgroundColor: theme.primary, opacity: saving ? 0.7 : 1 }]}
      >
        <Text style={styles.buttonText}>{saving ? 'Saving…' : 'Continue'}</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  avatarWrap: { alignSelf: 'center', marginTop: spacing.xxl, position: 'relative' },
  avatarImg: { width: 100, height: 100, borderRadius: 50 },
  editBadge: {
    position: 'absolute',
    bottom: -4,
    right: -4,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: radius.pill,
  },
  input: {
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
