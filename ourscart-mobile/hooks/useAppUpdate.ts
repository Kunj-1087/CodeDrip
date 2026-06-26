// =============================================================================
// OTA update hook. Checks for expo-updates when the app starts and offers a
// gentle prompt to restart. This lets you push JS fixes without a Play Store
// release — critical for hotfixes.
//
// Install: npx expo install expo-updates
// Then enable EAS Update for OTA deployments.
// =============================================================================
import { useEffect } from 'react';
import { Alert } from 'react-native';
import { captureError } from '../lib/monitoring';

export function useAppUpdate(): void {
  useEffect(() => {
    if (__DEV__) return;

    let mounted = true;

    const checkForUpdate = async () => {
      try {
        // Dynamic import so the app doesn't crash if expo-updates isn't installed.
        const Updates = require('expo-updates');
        if (!Updates.isEnabled) return;

        const update = await Updates.checkForUpdateAsync();
        if (!mounted || !update.isAvailable) return;

        await Updates.fetchUpdateAsync();

        // Prompt user to restart — don't force it mid-session.
        Alert.alert(
          'Update Available',
          'A new version of FocusKit is ready. Restart now for the latest improvements?',
          [
            { text: 'Later', style: 'cancel' },
            {
              text: 'Restart Now',
              onPress: () => Updates.reloadAsync(),
            },
          ],
        );
      } catch (error) {
        // Silent fail — update check failing is not critical.
        captureError(error, { context: 'ota_update_check' });
      }
    };

    checkForUpdate();

    return () => {
      mounted = false;
    };
  }, []);
}
