import * as SecureStore from 'expo-secure-store';

const TOKEN_KEYS = {
  ACCESS: 'focuskit_access_token',
  REFRESH: 'focuskit_refresh_token',
  USER_ID: 'focuskit_user_id',
  USER_ROLE: 'focuskit_user_role',
} as const;

const SECURE_OPTIONS: SecureStore.SecureStoreOptions = {
  keychainService: 'com.focuskit.auth',
  keychainAccessible: SecureStore.AFTER_FIRST_UNLOCK,
};

export async function saveTokens(
  accessToken: string,
  refreshToken: string,
  userId: string,
  role: string,
): Promise<void> {
  await Promise.all([
    SecureStore.setItemAsync(TOKEN_KEYS.ACCESS, accessToken, SECURE_OPTIONS),
    SecureStore.setItemAsync(TOKEN_KEYS.REFRESH, refreshToken, SECURE_OPTIONS),
    SecureStore.setItemAsync(TOKEN_KEYS.USER_ID, userId, SECURE_OPTIONS),
    SecureStore.setItemAsync(TOKEN_KEYS.USER_ROLE, role, SECURE_OPTIONS),
  ]);
}

export async function saveAccessToken(access: string): Promise<void> {
  await SecureStore.setItemAsync(TOKEN_KEYS.ACCESS, access, SECURE_OPTIONS);
}

export async function getAccessToken(): Promise<string | null> {
  return SecureStore.getItemAsync(TOKEN_KEYS.ACCESS, SECURE_OPTIONS);
}

export async function getRefreshToken(): Promise<string | null> {
  return SecureStore.getItemAsync(TOKEN_KEYS.REFRESH, SECURE_OPTIONS);
}

export async function getStoredUserId(): Promise<string | null> {
  return SecureStore.getItemAsync(TOKEN_KEYS.USER_ID, SECURE_OPTIONS);
}

export async function getStoredUserRole(): Promise<string | null> {
  return SecureStore.getItemAsync(TOKEN_KEYS.USER_ROLE, SECURE_OPTIONS);
}

export async function clearTokens(): Promise<void> {
  await Promise.all([
    SecureStore.deleteItemAsync(TOKEN_KEYS.ACCESS, SECURE_OPTIONS),
    SecureStore.deleteItemAsync(TOKEN_KEYS.REFRESH, SECURE_OPTIONS),
    SecureStore.deleteItemAsync(TOKEN_KEYS.USER_ID, SECURE_OPTIONS),
    SecureStore.deleteItemAsync(TOKEN_KEYS.USER_ROLE, SECURE_OPTIONS),
  ]);
}

export async function isTokenExpired(token: string): Promise<boolean> {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return true;
    const payload = JSON.parse(atob(parts[1]));
    return payload.exp * 1000 < Date.now() + 30000;
  } catch {
    return true;
  }
}
