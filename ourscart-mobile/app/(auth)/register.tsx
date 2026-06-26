import React, { useState } from 'react';
import { View, Text, TextInput, StyleSheet, Pressable, ScrollView, KeyboardAvoidingView, Platform } from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../context/ThemeContext';
import { useAuth } from '../../hooks/useAuth';
import { useToast } from '../../context/ToastContext';
import { SafeScreen } from '../../components/layout/SafeScreen';
import { KeyboardDismiss } from '../../components/layout/KeyboardDismiss';
import { Logo } from '../../components/ui/Logo';
import { Button } from '../../components/ui/Button';
import { FontFamily, FontSize } from '../../constants/typography';
import { Radius } from '../../constants/radius';
import { Space } from '../../constants/spacing';

export default function RegisterScreen() {
  const { colors } = useTheme();
  const { register } = useAuth();
  const toast = useToast();

  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);

  const submit = async () => {
    setBusy(true);
    try {
      await register({ firstName, lastName, email, password });
      toast.success('Account created — welcome to FocusKit!');
      router.replace('/(tabs)/home');
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Could not create your account');
    } finally {
      setBusy(false);
    }
  };

  return (
    <SafeScreen>
      <KeyboardDismiss>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
          <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
            <View style={styles.header}>
              <Pressable onPress={() => router.back()} hitSlop={8} style={styles.back}>
                <Ionicons name="arrow-back" size={24} color={colors.textPrimary} />
              </Pressable>
              <Logo size="lg" />
            </View>

            <Text style={[styles.title, { color: colors.textPrimary }]}>Create your account</Text>
            <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
              It takes a minute. Your cart comes with you.
            </Text>

            <View style={styles.nameRow}>
              <View style={{ flex: 1 }}>
                <Text style={[styles.label, { color: colors.textSecondary }]}>First name</Text>
                <TextInput
                  style={[styles.input, { backgroundColor: colors.bgSecondary, borderColor: colors.borderSubtle, color: colors.textPrimary }]}
                  value={firstName}
                  onChangeText={setFirstName}
                  placeholder="First"
                  placeholderTextColor={colors.textMuted}
                  autoCapitalize="words"
                />
              </View>
              <View style={{ width: Space[3] }} />
              <View style={{ flex: 1 }}>
                <Text style={[styles.label, { color: colors.textSecondary }]}>Last name</Text>
                <TextInput
                  style={[styles.input, { backgroundColor: colors.bgSecondary, borderColor: colors.borderSubtle, color: colors.textPrimary }]}
                  value={lastName}
                  onChangeText={setLastName}
                  placeholder="Last"
                  placeholderTextColor={colors.textMuted}
                  autoCapitalize="words"
                />
              </View>
            </View>

            <Text style={[styles.label, { color: colors.textSecondary }]}>Email</Text>
            <TextInput
              style={[styles.input, { backgroundColor: colors.bgSecondary, borderColor: colors.borderSubtle, color: colors.textPrimary }]}
              value={email}
              onChangeText={setEmail}
              placeholder="you@college.edu"
              placeholderTextColor={colors.textMuted}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
            />

            <Text style={[styles.label, { color: colors.textSecondary }]}>Password</Text>
            <TextInput
              style={[styles.input, { backgroundColor: colors.bgSecondary, borderColor: colors.borderSubtle, color: colors.textPrimary }]}
              value={password}
              onChangeText={setPassword}
              placeholder="At least 8 characters"
              placeholderTextColor={colors.textMuted}
              secureTextEntry
            />

            <Button label="Create Account" onPress={submit} loading={busy} fullWidth size="lg" style={styles.submit} />

            <Pressable onPress={() => router.push('/(auth)/login')} style={styles.switchRow}>
              <Text style={[styles.switchText, { color: colors.textSecondary }]}>
                Already have an account?{' '}
              </Text>
              <Text style={[styles.switchAction, { color: colors.brandPrimary }]}>Sign in</Text>
            </Pressable>
          </ScrollView>
        </KeyboardAvoidingView>
      </KeyboardDismiss>
    </SafeScreen>
  );
}

const styles = StyleSheet.create({
  scroll: { padding: Space[5], paddingBottom: Space[10] },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: Space[8] },
  back: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center' },
  title: { fontFamily: FontFamily.bold, fontSize: FontSize['2xl'] },
  subtitle: { fontFamily: FontFamily.regular, fontSize: FontSize.base, marginTop: Space[1], marginBottom: Space[6] },
  nameRow: { flexDirection: 'row', marginBottom: Space[4] },
  label: { fontFamily: FontFamily.medium, fontSize: FontSize.sm, marginBottom: Space[1] },
  input: {
    height: 48,
    borderWidth: 1,
    borderRadius: Radius.md,
    paddingHorizontal: Space[4],
    fontFamily: FontFamily.regular,
    fontSize: FontSize.base,
    marginBottom: Space[4],
  },
  submit: { marginTop: Space[4] },
  switchRow: { flexDirection: 'row', justifyContent: 'center', marginTop: Space[6] },
  switchText: { fontFamily: FontFamily.regular, fontSize: FontSize.base },
  switchAction: { fontFamily: FontFamily.semibold, fontSize: FontSize.base },
});
