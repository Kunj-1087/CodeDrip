import React from 'react';
import { View, ActivityIndicator } from 'react-native';
import { Redirect, Stack } from 'expo-router';
import { useAuth } from '../../hooks/useAuth';
import { useTheme } from '../../context/ThemeContext';

// Role gate: anyone who isn't a signed-in admin is bounced to their profile. We wait
// for auth to finish initializing so we don't redirect a logged-in admin on a cold start.
export default function AdminLayout() {
  const { isAdmin, initializing } = useAuth();
  const { colors } = useTheme();

  if (initializing) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.bgPrimary }}>
        <ActivityIndicator color={colors.brandPrimary} />
      </View>
    );
  }

  if (!isAdmin) return <Redirect href="/(tabs)/profile" />;

  return <Stack screenOptions={{ headerShown: false }} />;
}
