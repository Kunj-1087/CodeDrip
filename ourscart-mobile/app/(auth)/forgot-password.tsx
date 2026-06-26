import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  Pressable,
} from 'react-native';
import { router, Link } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../hooks/useAuth';
import { useToast } from '../../context/ToastContext';
import { useTheme } from '../../context/ThemeContext';
import { SafeScreen } from '../../components/layout/SafeScreen';
import { KeyboardDismiss } from '../../components/layout/KeyboardDismiss';
import { Header } from '../../components/layout/Header';
import { Input } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';
import { FontFamily, FontSize, lh, LineHeight } from '../../constants/typography';
import { Space } from '../../constants/spacing';
import { validateEmail } from '../../utils/validators';

export default function ForgotPasswordScreen() {
  const { colors } = useTheme();
  const { forgotPassword } = useAuth();
  const toast = useToast();

  const [email, setEmail] = useState('');
  const [error, setError] = useState<string | undefined>();
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const submit = async () => {
    const emailError = validateEmail(email);
    if (emailError) {
      setError(emailError);
      return;
    }
    setError(undefined);
    setLoading(true);
    try {
      await forgotPassword(email.trim());
      setSent(true);
    } catch {
      // The API always answers 200 here; only a network error reaches this branch.
      toast.error('Could not send the reset link. Try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeScreen edges={['top', 'bottom']}>
      <Header title="Reset Password" />
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <KeyboardDismiss>
          <View style={styles.content}>
            {sent ? (
              <View style={styles.confirm}>
                <View style={[styles.iconCircle, { backgroundColor: colors.brandPrimaryLight }]}>
                  <Ionicons name="mail-outline" size={40} color={colors.brandPrimary} />
                </View>
                <Text style={[styles.title, { color: colors.textPrimary }]}>Check your inbox</Text>
                <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
                  If {email.trim()} is registered, a reset link is on its way. Follow it to set a new
                  password.
                </Text>
                <Button
                  label="Back to Login"
                  onPress={() => router.replace('/(auth)/login')}
                  fullWidth
                  size="lg"
                  style={{ marginTop: Space[6] }}
                />
              </View>
            ) : (
              <>
                <Text style={[styles.title, { color: colors.textPrimary }]}>Forgot password?</Text>
                <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
                  Enter your email and we&apos;ll send you a link to reset your password.
                </Text>

                <View style={styles.form}>
                  <Input
                    label="Email"
                    placeholder="you@example.com"
                    value={email}
                    onChangeText={setEmail}
                    error={error}
                    keyboardType="email-address"
                    autoCapitalize="none"
                    returnKeyType="send"
                    onSubmitEditing={submit}
                  />
                  <Button
                    label="Send Reset Link"
                    onPress={submit}
                    loading={loading}
                    fullWidth
                    size="lg"
                  />
                </View>

                <View style={styles.footer}>
                  <Link href="/(auth)/login" asChild>
                    <Pressable hitSlop={6}>
                      <Text style={[styles.footerLink, { color: colors.brandPrimary }]}>
                        Back to Login
                      </Text>
                    </Pressable>
                  </Link>
                </View>
              </>
            )}
          </View>
        </KeyboardDismiss>
      </KeyboardAvoidingView>
    </SafeScreen>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  content: { flex: 1, paddingHorizontal: Space[6], paddingTop: Space[8] },
  title: { fontFamily: FontFamily.bold, fontSize: FontSize['2xl'] },
  subtitle: {
    fontFamily: FontFamily.regular,
    fontSize: FontSize.sm,
    lineHeight: lh(FontSize.sm, LineHeight.relaxed),
    marginTop: Space[2],
    marginBottom: Space[6],
  },
  form: { gap: Space[4] },
  footer: { alignItems: 'center', marginTop: Space[6] },
  footerLink: { fontFamily: FontFamily.semibold, fontSize: FontSize.sm },
  confirm: { alignItems: 'center', paddingTop: Space[10] },
  iconCircle: {
    width: 88,
    height: 88,
    borderRadius: 44,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Space[5],
  },
});
