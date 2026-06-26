import { Redirect } from 'expo-router';

// Entry point simply forwards into the tab navigator's home tab.
export default function Index() {
  return <Redirect href="/(tabs)/home" />;
}
