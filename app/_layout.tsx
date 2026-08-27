import 'react-native-gesture-handler';
import React, { useEffect, useState } from 'react';
import { View, ActivityIndicator, useColorScheme } from 'react-native';
import { Stack, useRouter, useSegments } from 'expo-router';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { supabase } from '../lib/supabase';
import { useAuthStore } from '../store/authStore';
import { useTheme } from '../lib/theme';

function useProtectedRoute() {
  const segments = useSegments();
  const router = useRouter();
  const { session, initializing, profile, hasRoom } = useAuthStore();

  useEffect(() => {
    if (initializing) return;

    const inAuthGroup = segments[0] === '(auth)';
    const inOnboardingGroup = segments[0] === '(onboarding)';

    if (!session && !inAuthGroup) {
      router.replace('/(auth)/login');
    } else if (session && inAuthGroup) {
      router.replace('/(tabs)/home');
    } else if (session && profile && hasRoom === false && !inOnboardingGroup) {
      router.replace('/(onboarding)/profile');
    } else if (session && hasRoom === true && inOnboardingGroup) {
      router.replace('/(tabs)/home');
    }
  }, [session, initializing, segments, profile, hasRoom]);
}

function RootNavigator() {
  useProtectedRoute();
  const theme = useTheme();
  return (
    <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: theme.bg } }}>
      <Stack.Screen name="(auth)" />
      <Stack.Screen name="(onboarding)" />
      <Stack.Screen name="(tabs)" />
      <Stack.Screen name="room/[id]" options={{ presentation: 'card' }} />
      <Stack.Screen name="chat/[roomId]" options={{ presentation: 'card' }} />
      <Stack.Screen name="chat/camera" options={{ presentation: 'fullScreenModal' }} />
      <Stack.Screen name="event/[id]" options={{ presentation: 'card' }} />
      <Stack.Screen name="expense/add" options={{ presentation: 'modal' }} />
      <Stack.Screen name="memory/[id]" options={{ presentation: 'fullScreenModal' }} />
      <Stack.Screen name="memory/upload" options={{ presentation: 'modal' }} />
    </Stack>
  );
}

export default function RootLayout() {
  const [initializing, setInitializing] = useState(true);
  const scheme = useColorScheme();
  const theme = useTheme();
  const { setSession, setProfile, setHasRoom, setInitializing: setStoreInitializing } = useAuthStore();

  useEffect(() => {
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      setSession(session);
      if (session) await loadProfile(session.user.id);
      setInitializing(false);
      setStoreInitializing(false);
    });

    const { data: listener } = supabase.auth.onAuthStateChange(async (_event, session) => {
      setSession(session);
      if (session) {
        await loadProfile(session.user.id);
      } else {
        setProfile(null);
        setHasRoom(null);
      }
    });

    return () => listener.subscription.unsubscribe();
  }, []);

  async function loadProfile(userId: string) {
    const { data } = await supabase.from('users').select('*').eq('id', userId).maybeSingle();
    if (data) setProfile(data);
    const { count } = await supabase
      .from('room_members')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', userId);
    setHasRoom((count ?? 0) > 0);
  }

  if (initializing) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: theme.bg }}>
        <ActivityIndicator size="large" color={theme.primary} />
      </View>
    );
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <StatusBar style={scheme === 'light' ? 'dark' : 'light'} />
        <RootNavigator />
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
