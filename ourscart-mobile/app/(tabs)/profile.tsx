import React from 'react';
import { View, Text, ScrollView, StyleSheet, Pressable, Switch, Share } from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as MailComposer from 'expo-mail-composer';
import * as WebBrowser from 'expo-web-browser';
import { useTheme } from '../../context/ThemeContext';
import { useAuth } from '../../hooks/useAuth';
import { useToast } from '../../context/ToastContext';
import { SafeScreen } from '../../components/layout/SafeScreen';
import { Header } from '../../components/layout/Header';
import { Logo } from '../../components/ui/Logo';
import { Button } from '../../components/ui/Button';
import { useScreenPerformance } from '../../hooks/useScreenPerformance';
import { initials } from '../../lib/formatters';
import { FontFamily, FontSize } from '../../constants/typography';
import { Radius } from '../../constants/radius';
import { Space } from '../../constants/spacing';

interface Row {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  value?: string;
  onPress?: () => void;
  toggle?: { value: boolean; onChange: (v: boolean) => void };
  danger?: boolean;
}

export default function ProfileScreen() {
  const { colors, isDark, toggleTheme } = useTheme();
  const { user, isAuthenticated, isAdmin, logout } = useAuth();
  const toast = useToast();
  useScreenPerformance('ProfileScreen');

  const contactSupport = async () => {
    const available = await MailComposer.isAvailableAsync();
    if (!available) {
      toast.info('No mail app configured. Reach us at hello@focuskit.in');
      return;
    }
    await MailComposer.composeAsync({
      recipients: ['hello@focuskit.in'],
      subject: 'FocusKit Support Request',
    });
  };

  const shareApp = async () => {
    try {
      await Share.share({
        message: 'Get organized with FocusKit! Digital planners, Notion templates, and desk accessories. https://focuskit.in',
        title: 'FocusKit App',
      });
    } catch (error) {
      console.error(error);
    }
  };

  if (!isAuthenticated) {
    return (
      <SafeScreen>
        <Header title="Profile" showBack={false} />
        <View style={styles.loggedOut}>
          <Logo size="xl" variant="icon-only" />
          <Text style={[styles.signInTitle, { color: colors.textPrimary }]}>Sign in to FocusKit</Text>
          <Text style={[styles.signInSub, { color: colors.textSecondary }]}>
            Track orders, save favourites and check out faster.
          </Text>
          <View style={styles.signInActions}>
            <Button label="Sign In" fullWidth size="lg" onPress={() => router.push('/(auth)/login')} />
            <Pressable onPress={() => router.push('/(auth)/register')} hitSlop={8} style={styles.createAccount}>
              <Text style={[styles.createAccountText, { color: colors.brandPrimary }]}>
                Create Account
              </Text>
            </Pressable>
          </View>

          <View style={[styles.themeRowStandalone, { borderColor: colors.borderSubtle }]}>
            <View style={styles.rowLeft}>
              <Ionicons name="moon-outline" size={20} color={colors.textSecondary} />
              <Text style={[styles.rowLabel, { color: colors.textPrimary }]}>Dark Mode</Text>
            </View>
            <Switch
              value={isDark}
              onValueChange={toggleTheme}
              trackColor={{ true: colors.brandPrimary, false: colors.borderDefault }}
              thumbColor={colors.white}
            />
          </View>
        </View>
      </SafeScreen>
    );
  }

  const sections: Row[][] = [
    [
      { icon: 'receipt-outline', label: 'My Orders', onPress: () => router.push('/orders') },
      {
        icon: 'location-outline',
        label: 'Saved Addresses',
        onPress: () => toast.info('Manage addresses during checkout'),
      },
      {
        icon: 'notifications-outline',
        label: 'Notifications',
        onPress: () => toast.info('Notification settings coming soon'),
      },
    ],
    [
      { icon: 'moon-outline', label: 'Dark Mode', toggle: { value: isDark, onChange: toggleTheme } },
      { icon: 'language-outline', label: 'Language', value: 'English (India)' },
    ],
    [
      {
        icon: 'book-outline',
        label: 'Read Blog',
        onPress: () => { void WebBrowser.openBrowserAsync('https://focuskit.in/blog'); },
      },
      {
        icon: 'share-social-outline',
        label: 'Invite Friends',
        onPress: shareApp,
      },
      {
        icon: 'information-circle-outline',
        label: 'About FocusKit',
        onPress: () => toast.info('FocusKit v1.0.0 — Simple tools for organized student life'),
      },
      { icon: 'help-buoy-outline', label: 'Help & Support', onPress: contactSupport },
    ],
  ];

  if (isAdmin) {
    sections.unshift([
      { icon: 'speedometer-outline', label: 'Admin Dashboard', onPress: () => router.push('/admin') },
    ]);
  }

  const renderRow = (row: Row, isLast: boolean) => (
    <Pressable
      key={row.label}
      onPress={row.onPress}
      disabled={!row.onPress && !row.toggle}
      style={[
        styles.row,
        !isLast && { borderBottomColor: colors.borderSubtle, borderBottomWidth: StyleSheet.hairlineWidth },
      ]}
    >
      <View style={styles.rowLeft}>
        <Ionicons name={row.icon} size={20} color={row.danger ? colors.accentRed : colors.textSecondary} />
        <Text style={[styles.rowLabel, { color: row.danger ? colors.accentRed : colors.textPrimary }]}>
          {row.label}
        </Text>
      </View>
      {row.toggle ? (
        <Switch
          value={row.toggle.value}
          onValueChange={row.toggle.onChange}
          trackColor={{ true: colors.brandPrimary, false: colors.borderDefault }}
          thumbColor={colors.white}
        />
      ) : (
        <View style={styles.rowRight}>
          {row.value ? (
            <Text style={[styles.rowValue, { color: colors.textMuted }]}>{row.value}</Text>
          ) : null}
          {row.onPress ? (
            <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
          ) : null}
        </View>
      )}
    </Pressable>
  );

  return (
    <SafeScreen>
      <Header title="Profile" showBack={false} />
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <View style={styles.identity}>
          <View style={[styles.avatar, { backgroundColor: colors.brandPrimary }]}>
            <Text style={styles.avatarText}>{initials(user?.firstName, user?.lastName)}</Text>
          </View>
          <View style={styles.identityText}>
            <Text style={[styles.name, { color: colors.textPrimary }]}>
              {user?.firstName} {user?.lastName}
            </Text>
            <Text style={[styles.email, { color: colors.textSecondary }]}>{user?.email}</Text>
          </View>
        </View>

        {sections.map((section, i) => (
          <View
            key={i}
            style={[styles.card, { backgroundColor: colors.bgSecondary, borderColor: colors.borderSubtle }]}
          >
            {section.map((row, idx) => renderRow(row, idx === section.length - 1))}
          </View>
        ))}

        <Pressable
          onPress={async () => {
            await logout();
            toast.success('Signed out');
          }}
          style={[styles.signOut, { backgroundColor: colors.bgSecondary, borderColor: colors.borderSubtle }]}
        >
          <Ionicons name="log-out-outline" size={20} color={colors.accentRed} />
          <Text style={[styles.signOutText, { color: colors.accentRed }]}>Sign Out</Text>
        </Pressable>
      </ScrollView>
    </SafeScreen>
  );
}

const styles = StyleSheet.create({
  scroll: { padding: Space[4], paddingBottom: Space[10] },
  identity: { flexDirection: 'row', alignItems: 'center', marginBottom: Space[6], paddingHorizontal: Space[1] },
  avatar: { width: 60, height: 60, borderRadius: 30, alignItems: 'center', justifyContent: 'center' },
  avatarText: { color: '#FFFFFF', fontFamily: FontFamily.bold, fontSize: FontSize['2xl'] },
  identityText: { marginLeft: Space[4], flex: 1 },
  name: { fontFamily: FontFamily.bold, fontSize: FontSize.xl },
  email: { fontFamily: FontFamily.regular, fontSize: FontSize.sm, marginTop: 2 },
  card: {
    borderRadius: Radius.lg,
    borderWidth: StyleSheet.hairlineWidth,
    marginBottom: Space[4],
    paddingHorizontal: Space[4],
  },
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: Space[4] },
  rowLeft: { flexDirection: 'row', alignItems: 'center', gap: Space[3] },
  rowLabel: { fontFamily: FontFamily.medium, fontSize: FontSize.base },
  rowRight: { flexDirection: 'row', alignItems: 'center', gap: Space[2] },
  rowValue: { fontFamily: FontFamily.regular, fontSize: FontSize.sm },
  signOut: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Space[2],
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: Radius.lg,
    paddingVertical: Space[4],
  },
  signOutText: { fontFamily: FontFamily.semibold, fontSize: FontSize.base },
  loggedOut: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: Space[8] },
  signInTitle: { fontFamily: FontFamily.bold, fontSize: FontSize['2xl'], marginTop: Space[5] },
  signInSub: { fontFamily: FontFamily.regular, fontSize: FontSize.sm, textAlign: 'center', marginTop: Space[2] },
  signInActions: { width: '100%', marginTop: Space[6], gap: Space[3], alignItems: 'center' },
  createAccount: { paddingVertical: Space[2] },
  createAccountText: { fontFamily: FontFamily.semibold, fontSize: FontSize.base },
  themeRowStandalone: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: Radius.lg,
    paddingHorizontal: Space[4],
    paddingVertical: Space[3],
    marginTop: Space[8],
  },
});
