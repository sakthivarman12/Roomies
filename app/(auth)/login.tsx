import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { supabase } from '../../lib/supabase';
import { useTheme, spacing, radius, typography } from '../../lib/theme';

export default function LoginScreen() {
  const theme = useTheme();
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function sendCode() {
    if (!email.includes('@')) {
      setError('Enter a valid email address');
      return;
    }
    setError(null);
    setLoading(true);
    const { error } = await supabase.auth.signInWithOtp({
      email: email.trim().toLowerCase(),
      options: { shouldCreateUser: true },
    });
    setLoading(false);
    if (error) {
      setError(error.message);
      return;
    }
    router.push({ pathname: '/(auth)/verify', params: { email: email.trim().toLowerCase() } });
  }

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: theme.bg }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <View style={styles.hero}>
        <LinearGradient
          colors={[theme.gradientA, theme.gradientB]}
          style={styles.logo}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        >
          <Text style={styles.logoText}>R</Text>
        </LinearGradient>
        <Text style={[typography.display, { color: theme.text, marginTop: spacing.xl }]}>
          Roomies
        </Text>
        <Text style={[typography.body, { color: theme.textMuted, marginTop: spacing.xs }]}>
          Your private digital home
        </Text>
      </View>

      <View style={styles.form}>
        <Text style={[typography.caption, { color: theme.textMuted, marginBottom: spacing.xs }]}>
          EMAIL
        </Text>
        <TextInput
          value={email}
          onChangeText={setEmail}
          placeholder="you@example.com"
          placeholderTextColor={theme.textFaint}
          keyboardType="email-address"
          autoCapitalize="none"
          autoComplete="email"
          style={[
            styles.input,
            { backgroundColor: theme.card, borderColor: theme.cardBorder, color: theme.text },
          ]}
        />
        {error ? (
          <Text style={{ color: theme.danger, marginTop: spacing.sm }}>{error}</Text>
        ) : null}

        <TouchableOpacity
          onPress={sendCode}
          disabled={loading}
          style={[styles.button, { backgroundColor: theme.primary }]}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.buttonText}>Send verification code</Text>
          )}
        </TouchableOpacity>

        <Text style={[typography.tiny, { color: theme.textFaint, marginTop: spacing.lg, textAlign: 'center' }]}>
          By continuing you agree this is a private space shared only with your invited roommates.
        </Text>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  hero: { alignItems: 'center', marginTop: 100, marginBottom: spacing.xxxl },
  logo: {
    width: 76,
    height: 76,
    borderRadius: radius.xl,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoText: { fontSize: 34, fontWeight: '800', color: '#fff' },
  form: { paddingHorizontal: spacing.xl },
  input: {
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: radius.md,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md + 2,
    fontSize: 16,
  },
  button: {
    marginTop: spacing.xl,
    borderRadius: radius.pill,
    paddingVertical: spacing.md + 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonText: { color: '#fff', fontWeight: '700', fontSize: 16 },
});
