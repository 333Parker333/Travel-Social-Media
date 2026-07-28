import { useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';

import { useAuth } from '../lib/auth-context';
import { supabase } from '../lib/supabase';

type Profile = {
  display_name: string | null;
  email: string;
};

export function ProfileScreen() {
  const { user, signOut } = useAuth();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      return;
    }

    let cancelled = false;

    supabase
      .from('profiles')
      .select('display_name, email')
      .eq('id', user.id)
      .single()
      .then(({ data }) => {
        if (!cancelled) {
          setProfile(data);
          setLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [user]);

  if (!user) {
    return null;
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Your trips</Text>

      {loading ? (
        <ActivityIndicator />
      ) : (
        <Text style={styles.email}>{profile?.display_name || profile?.email || user.email}</Text>
      )}

      <Text style={styles.placeholder}>No trips yet. Trip creation is coming in the next step.</Text>

      <Pressable style={styles.signOut} onPress={signOut}>
        <Text style={styles.signOutText}>Sign out</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
    gap: 12,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
  },
  email: {
    fontSize: 16,
    color: '#333',
  },
  placeholder: {
    fontSize: 14,
    color: '#888',
    textAlign: 'center',
    marginVertical: 16,
  },
  signOut: {
    borderWidth: 1,
    borderColor: '#d32f2f',
    borderRadius: 8,
    paddingHorizontal: 20,
    paddingVertical: 10,
  },
  signOutText: {
    color: '#d32f2f',
    fontSize: 15,
    fontWeight: '600',
  },
});
