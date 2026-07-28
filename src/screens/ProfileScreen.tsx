import { useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, SafeAreaView, StyleSheet, Text, View } from 'react-native';

import { useAuth } from '../lib/auth-context';
import { supabase } from '../lib/supabase';
import { webMaxWidthStyle } from '../lib/web-styles';
import { TripsNavigator } from './trips/TripsNavigator';

type Profile = {
  display_name: string | null;
  email: string;
};

export function ProfileScreen() {
  const { user, signOut } = useAuth();
  const [profile, setProfile] = useState<Profile | null>(null);

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
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        {profile ? (
          <Text style={styles.email}>{profile.display_name || profile.email}</Text>
        ) : (
          <ActivityIndicator size="small" />
        )}
        <Pressable style={styles.signOut} onPress={signOut}>
          <Text style={styles.signOutText}>Sign out</Text>
        </Pressable>
      </View>

      <View style={[styles.body, webMaxWidthStyle]}>
        <TripsNavigator ownerId={user.id} />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  email: {
    fontSize: 15,
    color: '#333',
  },
  signOut: {
    borderWidth: 1,
    borderColor: '#d32f2f',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  signOutText: {
    color: '#d32f2f',
    fontSize: 13,
    fontWeight: '600',
  },
  body: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 16,
  },
});
