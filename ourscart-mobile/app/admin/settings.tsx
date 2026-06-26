import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, StyleSheet, KeyboardAvoidingView, Platform } from 'react-native';
import { useTheme } from '../../context/ThemeContext';
import { useToast } from '../../context/ToastContext';
import { SafeScreen } from '../../components/layout/SafeScreen';
import { Header } from '../../components/layout/Header';
import { Input } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';
import { TextSkeleton } from '../../components/ui/Skeleton';
import { apiGet, apiPatch } from '../../lib/api';
import { FontFamily, FontSize } from '../../constants/typography';
import { Radius } from '../../constants/radius';
import { Space } from '../../constants/spacing';
import type { StoreSettings } from '../../types';

export default function AdminSettingsScreen() {
  const { colors } = useTheme();
  const toast = useToast();
  const [settings, setSettings] = useState<StoreSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    apiGet<StoreSettings>('/admin/settings')
      .then(setSettings)
      .catch(() => toast.error('Could not load settings'))
      .finally(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const update = <K extends keyof StoreSettings>(key: K, value: StoreSettings[K]) =>
    setSettings((prev) => (prev ? { ...prev, [key]: value } : prev));

  const save = async () => {
    if (!settings) return;
    setSaving(true);
    try {
      await apiPatch('/admin/settings', {
        storeName: settings.storeName,
        supportEmail: settings.supportEmail,
        supportPhone: settings.supportPhone,
        address: settings.address,
        metaDescription: settings.metaDescription,
        primaryColor: settings.primaryColor,
        secondaryColor: settings.secondaryColor,
        accentColor: settings.accentColor,
      });
      toast.success('Settings saved');
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Save failed');
    } finally {
      setSaving(false);
    }
  };

  const ColorField = ({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) => (
    <View style={styles.colorRow}>
      <View style={{ flex: 1 }}>
        <Input label={label} value={value} onChangeText={onChange} autoCapitalize="none" />
      </View>
      <View style={[styles.swatch, { backgroundColor: value, borderColor: colors.borderDefault }]} />
    </View>
  );

  return (
    <SafeScreen>
      <Header title="Store Settings" />
      <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
          {loading || !settings ? (
            <TextSkeleton lines={8} />
          ) : (
            <>
              <Text style={[styles.section, { color: colors.textPrimary }]}>Branding</Text>
              <Input label="Store Name" value={settings.storeName} onChangeText={(t) => update('storeName', t)} />
              <View style={styles.gap} />
              <ColorField label="Primary Color" value={settings.primaryColor} onChange={(t) => update('primaryColor', t)} />
              <ColorField label="Secondary Color" value={settings.secondaryColor} onChange={(t) => update('secondaryColor', t)} />
              <ColorField label="Accent Color" value={settings.accentColor} onChange={(t) => update('accentColor', t)} />

              <Text style={[styles.section, { color: colors.textPrimary, marginTop: Space[6] }]}>Contact</Text>
              <Input label="Support Email" value={settings.supportEmail} onChangeText={(t) => update('supportEmail', t)} keyboardType="email-address" autoCapitalize="none" />
              <View style={styles.gap} />
              <Input label="Support Phone" value={settings.supportPhone} onChangeText={(t) => update('supportPhone', t)} keyboardType="phone-pad" />
              <View style={styles.gap} />
              <Input label="Address" value={settings.address} onChangeText={(t) => update('address', t)} multiline numberOfLines={3} />

              <Text style={[styles.section, { color: colors.textPrimary, marginTop: Space[6] }]}>SEO</Text>
              <Input label="Meta Description" value={settings.metaDescription} onChangeText={(t) => update('metaDescription', t)} multiline numberOfLines={3} maxLength={300} />

              <Button label="Save Settings" onPress={save} loading={saving} fullWidth size="lg" style={{ marginTop: Space[6] }} />
            </>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeScreen>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  content: { padding: Space[4], paddingBottom: Space[10] },
  section: { fontFamily: FontFamily.bold, fontSize: FontSize.lg, marginBottom: Space[3] },
  gap: { height: Space[4] },
  colorRow: { flexDirection: 'row', alignItems: 'flex-end', gap: Space[3], marginBottom: Space[4] },
  swatch: { width: 44, height: 44, borderRadius: Radius.md, borderWidth: 1, marginBottom: 2 },
});
