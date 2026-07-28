import { useEffect, useState } from 'react';
import { ActivityIndicator, FlatList, Pressable, StyleSheet, Text, View } from 'react-native';

import { listTrips } from '../../lib/trips-api';
import type { Trip } from '../../types/trip';

type Props = {
  ownerId: string;
  onOpenTrip: (tripId: string) => void;
  onCreateTrip: () => void;
};

export function TripsListScreen({ ownerId, onOpenTrip, onCreateTrip }: Props) {
  const [trips, setTrips] = useState<Trip[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    listTrips(ownerId)
      .then(setTrips)
      .catch((err: Error) => setError(err.message));
  }, [ownerId]);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Your trips</Text>
        <Pressable style={styles.newButton} onPress={onCreateTrip}>
          <Text style={styles.newButtonText}>+ New trip</Text>
        </Pressable>
      </View>

      {error ? <Text style={styles.error}>{error}</Text> : null}

      {!trips && !error ? <ActivityIndicator style={styles.spinner} /> : null}

      {trips && trips.length === 0 ? (
        <Text style={styles.empty}>No trips yet. Tap &quot;New trip&quot; to create one.</Text>
      ) : null}

      {trips ? (
        <FlatList
          data={trips}
          keyExtractor={(trip) => trip.id}
          renderItem={({ item }) => (
            <Pressable style={styles.row} onPress={() => onOpenTrip(item.id)}>
              <Text style={styles.rowTitle}>{item.title}</Text>
              <Text style={styles.rowSubtitle}>
                {item.status} · {item.destinations.join(', ') || 'No destinations yet'}
              </Text>
            </Pressable>
          )}
        />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    width: '100%',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
  },
  newButton: {
    backgroundColor: '#1a73e8',
    borderRadius: 8,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  newButtonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 13,
  },
  spinner: {
    marginTop: 24,
  },
  empty: {
    color: '#888',
    textAlign: 'center',
    marginTop: 24,
  },
  error: {
    color: '#d32f2f',
    marginBottom: 8,
  },
  row: {
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  rowTitle: {
    fontSize: 16,
    fontWeight: '600',
  },
  rowSubtitle: {
    fontSize: 13,
    color: '#888',
    marginTop: 2,
  },
});
