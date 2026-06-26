import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Pressable,
} from 'react-native';
import { router, Link } from 'expo-router';
import { useAuth } from '../../hooks/useAuth';
import { useToast } from '../../context/ToastContext';
import { useTheme } from '../../context/ThemeContext';
import { SafeScreen } from '../../components/layout/SafeScreen';
import { KeyboardDismiss } from '../../components/layout/KeyboardDismiss';
import { Logo } from '../../components/ui/Logo';
import { Input } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';
import { Divider } from '../../components/ui/Divider';
import { GoogleIcon } from '../../components/ui/GoogleIcon';
import { FontFamily, FontSize, lh, LineHeight } from '../../constants/typography';
import { Space } from '../../constants/spacing';
import { Radius } from '../../constants/radius';
import { validateEmail, validatePassword } from '../../utils/validators';

export default function LoginScreen() {
  const { colors } = useTheme();
  const { login } = useAuth();
  const toast = useToast();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({});
  const [loading, setLoading] = useState(false);

  const submit = async () => {
    const emailError = validateEmail(email);
    const passwordError = validatePassword(password);
    if (emailError || passwordError) {
      setErrors({ email: emailError ?? undefined, password: passwordError ?? undefined });
      return;
    }
    setErrors({});
    setLoading(true);
    try {
      await login(email.trim(), password);
      toast.success('Welcome back!');
      router.replace('/(tabs)/home');
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Sign in failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeScreen edges={['top', 'bottom']}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <KeyboardDismiss>
          <ScrollView
            contentContainerStyle={styles.content}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            <View style={styles.logo}>
              <Logo size="lg" />
            </View>

            <Text style={[styles.title, { color: colors.textPrimary }]}>Welcome back</Text>
            <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
              Sign in to track orders, save favourites and check out faster.
            </Text>

            <View style={styles.form}>
              <Input
                label="Email"
                placeholder="you@example.com"
                value={email}
                onChangeText={setEmail}
                error={errors.email}
                keyboardType="email-address"
                autoCapitalize="none"
                returnKeyType="next"
              />
              <View style={styles.gap} />
              <Input
                label="Password"
                placeholder="••••••••"
                value={password}
                onChangeText={setPassword}
                error={errors.password}
                secureTextEntry
                autoCapitalize="none"
                returnKeyType="go"
                onSubmitEditing={submit}
              />

              <Link href="/(auth)/forgot-password" asChild>
                <Pressable hitSlop={8} style={styles.forgot}>
                  <Text style={[styles.forgotText, { color: colors.brandPrimary }]}>
                    Forgot password?
                  </Text>
                </Pressable>
              </Link>

              <Button label="Sign In" onPress={submit} loading={loading} fullWidth size="lg" />

              <Divider label="or" />

              <Button
                label="Continue with Google"
                variant="secondary"
                fullWidth
                size="lg"
                icon={<GoogleIcon size={18} />}
                onPress={() => toast.info('Google sign-in is coming soon.')}
              />
            </View>

            <View style={styles.footer}>
              <Text style={[styles.footerText, { color: colors.textSecondary }]}>
                Don&apos;t have an account?{' '}
              </Text>
              <Link href="/(auth)/register" asChild>
                <Pressable hitSlop={6}>
                  <Text style={[styles.footerLink, { color: colors.brandPrimary }]}>Register</Text>
                </Pressable>
              </Link>
            </View>
          </ScrollView>
        </KeyboardDismiss>
      </KeyboardAvoidingView>
    </SafeScreen>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  content: { flexGrow: 1, paddingHorizontal: Space[6], paddingVertical: Space[8] },
  logo: { alignItems: 'center', marginBottom: Space[8] },
  title: { fontFamily: FontFamily.bold, fontSize: FontSize['3xl'], textAlign: 'center' },
  subtitle: {
    fontFamily: FontFamily.regular,
    fontSize: FontSize.sm,
    lineHeight: lh(FontSize.sm, LineHeight.relaxed),
    textAlign: 'center',
    marginTop: Space[2],
    marginBottom: Space[6],
  },
  form: { gap: Space[4] },
  gap: { height: 0 },
  forgot: { alignSelf: 'flex-end', marginTop: -Space[1], marginBottom: Space[1] },
  forgotText: { fontFamily: FontFamily.semibold, fontSize: FontSize.sm },
  footer: { flexDirection: 'row', justifyContent: 'center', marginTop: Space[8] },
  footerText: { fontFamily: FontFamily.regular, fontSize: FontSize.sm },
  footerLink: { fontFamily: FontFamily.semibold, fontSize: FontSize.sm },
});
