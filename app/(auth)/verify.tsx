import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { supabase } from '../../lib/supabase';
import { useTheme, spacing, radius, typography } from '../../lib/theme';

export default function VerifyScreen() {
  const theme = useTheme();
  const router = useRouter();
  const { email } = useLocalSearchParams<{ email: string }>();
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [resending, setResending] = useState(false);
  const inputRef = useRef<TextInput>(null);

  async function verify() {
    if (code.length < 6) {
      setError('Enter the 6-digit code');
      return;
    }
    setError(null);
    setLoading(true);
    const { error } = await supabase.auth.verifyOtp({
      email,
      token: code,
      type: 'email',
    });
    setLoading(false);
    if (error) {
      setError(error.message);
      return;
    }
    router.replace('/(tabs)/home');
  }

  async function resend() {
    setResending(true);
    await supabase.auth.signInWithOtp({ email, options: { shouldCreateUser: true } });
    setResending(false);
  }

  return (
    <View style={{ flex: 1, backgroundColor: theme.bg, paddingTop: 120, paddingHorizontal: spacing.xl }}>
      <Text style={[typography.h1, { color: theme.text }]}>Enter your code</Text>
      <Text style={[typography.body, { color: theme.textMuted, marginTop: spacing.xs }]}>
        We sent a 6-digit code to {email}
      </Text>

      <TouchableOpacity activeOpacity={1} onPress={() => inputRef.current?.focus()}>
        <View style={styles.codeRow}>
          {Array.from({ length: 6 }).map((_, i) => (
            <View
              key={i}
              style={[
                styles.codeBox,
                { borderColor: theme.cardBorder, backgroundColor: theme.card },
              ]}
            >
              <Text style={[typography.h1, { color: theme.text }]}>{code[i] ?? ''}</Text>
            </View>
          ))}
        </View>
      </TouchableOpacity>
      <TextInput
        ref={inputRef}
        value={code}
        onChangeText={(t) => setCode(t.replace(/[^0-9]/g, '').slice(0, 6))}
        keyboardType="number-pad"
        maxLength={6}
        style={styles.hiddenInput}
        autoFocus
      />

      {error ? <Text style={{ color: theme.danger, marginTop: spacing.md }}>{error}</Text> : null}

      <TouchableOpacity
        onPress={verify}
        disabled={loading}
        style={[styles.button, { backgroundColor: theme.primary }]}
      >
        {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>Verify</Text>}
      </TouchableOpacity>

      <TouchableOpacity onPress={resend} disabled={resending} style={{ marginTop: spacing.lg, alignSelf: 'center' }}>
        <Text style={{ color: theme.primary, fontWeight: '600' }}>
          {resending ? 'Sending…' : "Didn't get a code? Resend"}
        </Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  codeRow: { flexDirection: 'row', gap: spacing.sm, marginTop: spacing.xxl },
  codeBox: {
    width: 46,
    height: 56,
    borderRadius: radius.md,
    borderWidth: StyleSheet.hairlineWidth,
    alignItems: 'center',
    justifyContent: 'center',
  },
  hiddenInput: { position: 'absolute', opacity: 0, height: 1, width: 1 },
  button: {
    marginTop: spacing.xxl,
    borderRadius: radius.pill,
    paddingVertical: spacing.md + 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonText: { color: '#fff', fontWeight: '700', fontSize: 16 },
});
