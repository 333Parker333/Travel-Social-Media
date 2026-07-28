import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { StatusBar } from 'expo-status-bar';

import { AuthProvider, useAuth } from './src/lib/auth-context';
import { isSupabaseConfigured } from './src/lib/supabase';
import { AuthScreen } from './src/screens/AuthScreen';
import { ProfileScreen } from './src/screens/ProfileScreen';

function Root() {
  const { session, initializing } = useAuth();

  if (initializing) {
    return (
      <View style={styles.center}>
        <ActivityIndicator />
      </View>
    );
  }

  return session ? <ProfileScreen /> : <AuthScreen />;
}

export default function App() {
  if (!isSupabaseConfigured) {
    return (
      <View style={styles.center}>
        <Text style={styles.warning}>Supabase not configured</Text>
        <Text style={styles.detail}>Copy .env.example to .env and add your Supabase credentials.</Text>
        <StatusBar style="auto" />
      </View>
    );
  }

  return (
    <AuthProvider>
      <Root />
      <StatusBar style="auto" />
    </AuthProvider>
  );
}

const styles = StyleSheet.create({
  center: {
    flex: 1,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
    gap: 8,
  },
  warning: {
    fontSize: 18,
    fontWeight: '600',
  },
  detail: {
    fontSize: 13,
    color: '#888',
    textAlign: 'center',
  },
});
