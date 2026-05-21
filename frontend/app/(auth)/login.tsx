import { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { useAuthStore } from '../../store/authStore';
import { colors } from '../../constants/theme';

export default function LoginScreen() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [usernameFocused, setUsernameFocused] = useState(false);
  const [passwordFocused, setPasswordFocused] = useState(false);
  const { login, isLoading } = useAuthStore();

  const handleLogin = async () => {
    if (!username.trim() || !password) {
      setError('Please enter username and password');
      return;
    }
    setError('');
    try {
      await login(username.trim(), password);
      router.replace('/(app)/');
    } catch (e: any) {
      const msg = e?.response?.data?.detail ?? 'Login failed. Please try again.';
      setError(msg);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView
        contentContainerStyle={styles.scroll}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.logoRow}>
          <Text style={styles.logoEmoji}>🔥</Text>
          <Text style={styles.logoText}>CalorieSnap</Text>
        </View>
        <Text style={styles.tagline}>Track smarter. Eat better.</Text>

        <View style={styles.form}>
          <Text style={styles.label}>Username</Text>
          <TextInput
            style={[styles.input, usernameFocused && styles.inputFocused]}
            placeholder="Enter your username"
            placeholderTextColor={colors.textMuted}
            value={username}
            onChangeText={setUsername}
            autoCapitalize="none"
            autoCorrect={false}
            onFocus={() => setUsernameFocused(true)}
            onBlur={() => setUsernameFocused(false)}
          />

          <Text style={[styles.label, { marginTop: 16 }]}>Password</Text>
          <TextInput
            style={[styles.input, passwordFocused && styles.inputFocused]}
            placeholder="Enter your password"
            placeholderTextColor={colors.textMuted}
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            onFocus={() => setPasswordFocused(true)}
            onBlur={() => setPasswordFocused(false)}
            onSubmitEditing={handleLogin}
          />

          {error ? <Text style={styles.errorText}>{error}</Text> : null}

          <TouchableOpacity
            style={[styles.button, isLoading && styles.buttonDisabled]}
            onPress={handleLogin}
            disabled={isLoading}
            activeOpacity={0.8}
          >
            {isLoading ? (
              <ActivityIndicator color="#000" />
            ) : (
              <Text style={styles.buttonText}>Login</Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity onPress={() => router.push('/(auth)/register')} style={styles.linkRow}>
            <Text style={styles.linkText}>
              Don't have an account?{' '}
              <Text style={styles.linkAccent}>Create one</Text>
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  scroll: { flexGrow: 1, justifyContent: 'center', paddingHorizontal: 28, paddingVertical: 48 },
  logoRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginBottom: 8 },
  logoEmoji: { fontSize: 42, marginRight: 10 },
  logoText: { fontSize: 36, fontWeight: '800', color: colors.textPrimary, letterSpacing: -1 },
  tagline: { textAlign: 'center', color: colors.textSecondary, fontSize: 15, marginBottom: 48 },
  form: { width: '100%' },
  label: { color: colors.textSecondary, fontSize: 13, fontWeight: '600', marginBottom: 8, letterSpacing: 0.5 },
  input: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    color: colors.textPrimary,
    borderWidth: 1.5,
    borderColor: colors.border,
  },
  inputFocused: { borderColor: colors.accent },
  errorText: { color: colors.danger, fontSize: 13, marginTop: 12, textAlign: 'center' },
  button: {
    backgroundColor: colors.accent,
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 28,
  },
  buttonDisabled: { opacity: 0.7 },
  buttonText: { color: '#000', fontWeight: '700', fontSize: 16 },
  linkRow: { marginTop: 24, alignItems: 'center' },
  linkText: { color: colors.textSecondary, fontSize: 14 },
  linkAccent: { color: colors.accent, fontWeight: '600' },
});
