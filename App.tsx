import { useEffect, useState } from 'react';
import { StatusBar } from 'expo-status-bar';
import { StyleSheet, Text, View } from 'react-native';

import { isSupabaseConfigured, supabase } from './src/lib/supabase';

type ConnectionStatus = 'checking' | 'connected' | 'error' | 'not-configured';

export default function App() {
  const [status, setStatus] = useState<ConnectionStatus>(
    isSupabaseConfigured ? 'checking' : 'not-configured'
  );
  const [detail, setDetail] = useState('');

  useEffect(() => {
    if (!isSupabaseConfigured) {
      return;
    }

    supabase.auth
      .getSession()
      .then(({ error }) => {
        if (error) {
          setStatus('error');
          setDetail(error.message);
        } else {
          setStatus('connected');
        }
      })
      .catch((err: Error) => {
        setStatus('error');
        setDetail(err.message);
      });
  }, []);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Trip Deck</Text>
      <Text style={styles.status}>Supabase: {statusLabel(status)}</Text>
      {detail ? <Text style={styles.detail}>{detail}</Text> : null}
      <StatusBar style="auto" />
    </View>
  );
}

function statusLabel(status: ConnectionStatus): string {
  switch (status) {
    case 'checking':
      return 'checking connection…';
    case 'connected':
      return 'reachable ✅';
    case 'not-configured':
      return 'not configured (see .env.example)';
    case 'error':
      return 'connection error ⚠️';
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    padding: 24,
  },
  title: {
    fontSize: 24,
    fontWeight: '600',
  },
  status: {
    fontSize: 16,
  },
  detail: {
    fontSize: 12,
    color: '#888',
    textAlign: 'center',
  },
});
