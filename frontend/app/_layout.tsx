import '../global.css';
import { useEffect, useState } from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { View, ActivityIndicator } from 'react-native';
import { useAuthStore } from '../store/authStore';
import { useRouter } from 'expo-router';
import { colors } from '../constants/theme';

export default function RootLayout() {
  const { loadToken, token } = useAuthStore();
  const router = useRouter();
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    loadToken().then(() => setLoaded(true));
  }, []);

  useEffect(() => {
    if (!loaded) return;
    if (token) {
      router.replace('/(app)/');
    } else {
      router.replace('/(auth)/login');
    }
  }, [loaded, token]);

  if (!loaded) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.bg, alignItems: 'center', justifyContent: 'center' }}>
        <StatusBar style="light" />
        <ActivityIndicator size="large" color={colors.accent} />
      </View>
    );
  }

  return (
    <>
      <StatusBar style="light" />
      <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: colors.bg } }}>
        <Stack.Screen name="(auth)" />
        <Stack.Screen name="(app)" />
      </Stack>
    </>
  );
}
