import { useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, SectionList, StyleSheet, Text, View } from 'react-native';

import { listSharedTrips, listTrips } from '../../lib/trips-api';
import type { Trip } from '../../types/trip';

type Props = {
  ownerId: string;
  onOpenTrip: (tripId: string) => void;
  onCreateTrip: () => void;
};

type Section = { title: string; data: Trip[] };

export function TripsListScreen({ ownerId, onOpenTrip, onCreateTrip }: Props) {
  const [sections, setSections] = useState<Section[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    Promise.all([listTrips(ownerId), listSharedTrips(ownerId)])
      .then(([owned, shared]) => {
        const next: Section[] = [{ title: 'Your trips', data: owned }];
        if (shared.length > 0) {
          next.push({ title: 'Shared with you', data: shared });
        }
        setSections(next);
      })
      .catch((err: Error) => setError(err.message));
  }, [ownerId]);

  const isEmpty = sections ? sections.every((section) => section.data.length === 0) : false;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Trips</Text>
        <Pressable style={styles.newButton} onPress={onCreateTrip}>
          <Text style={styles.newButtonText}>+ New trip</Text>
        </Pressable>
      </View>

      {error ? <Text style={styles.error}>{error}</Text> : null}

      {!sections && !error ? <ActivityIndicator style={styles.spinner} /> : null}

      {isEmpty ? <Text style={styles.empty}>No trips yet. Tap &quot;New trip&quot; to create one.</Text> : null}

      {sections ? (
        <SectionList
          sections={sections}
          keyExtractor={(trip) => trip.id}
          renderSectionHeader={({ section }) =>
            section.data.length > 0 ? <Text style={styles.sectionHeader}>{section.title}</Text> : null
          }
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
  sectionHeader: {
    fontSize: 13,
    fontWeight: '700',
    color: '#888',
    textTransform: 'uppercase',
    backgroundColor: '#fff',
    paddingTop: 16,
    paddingBottom: 6,
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
