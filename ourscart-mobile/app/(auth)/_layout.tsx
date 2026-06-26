import { Stack } from 'expo-router';

// Auth flow has no tab bar and no native header — each screen draws its own chrome.
export default function AuthLayout() {
  return <Stack screenOptions={{ headerShown: false }} />;
}
