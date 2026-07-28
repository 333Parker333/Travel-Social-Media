import { ScrollView, StyleSheet, Text, View } from 'react-native';

import { tripDateRange } from '../../../lib/trip-deck';
import type { Trip, TripTraveler } from '../../../types/trip';

type Props = {
  trip: Trip;
  travelers: TripTraveler[];
};

export function CoverCard({ trip, travelers }: Props) {
  return (
    <ScrollView contentContainerStyle={styles.content}>
      <Text style={styles.eyebrow}>TRIP DECK</Text>
      <Text style={styles.title}>{trip.title}</Text>
      <Text style={styles.dates}>{tripDateRange(trip.start_date, trip.end_date)}</Text>

      {trip.destinations.length > 0 ? (
        <Text style={styles.destinations}>{trip.destinations.join(' · ')}</Text>
      ) : null}

      <Text style={styles.cost}>${trip.total_cost.toFixed(2)}</Text>
      <Text style={styles.costLabel}>total trip cost</Text>

      {travelers.length > 0 ? (
        <View style={styles.travelers}>
          <Text style={styles.sectionLabel}>Travelers</Text>
          <View style={styles.chipRow}>
            {travelers.map((traveler) => (
              <View key={traveler.id} style={styles.chip}>
                <Text style={styles.chipText}>{traveler.display_name}</Text>
              </View>
            ))}
          </View>
        </View>
      ) : null}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
    gap: 6,
  },
  eyebrow: {
    fontSize: 12,
    fontWeight: '700',
    color: '#1a73e8',
    letterSpacing: 1,
  },
  title: {
    fontSize: 30,
    fontWeight: '700',
    textAlign: 'center',
    marginTop: 8,
  },
  dates: {
    fontSize: 16,
    color: '#555',
    marginTop: 4,
  },
  destinations: {
    fontSize: 14,
    color: '#888',
    textAlign: 'center',
    marginTop: 8,
  },
  cost: {
    fontSize: 32,
    fontWeight: '700',
    marginTop: 28,
  },
  costLabel: {
    fontSize: 12,
    color: '#888',
  },
  travelers: {
    marginTop: 28,
    alignItems: 'center',
  },
  sectionLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#555',
    marginBottom: 8,
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    justifyContent: 'center',
  },
  chip: {
    backgroundColor: '#eef3fe',
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  chipText: {
    color: '#1a73e8',
    fontSize: 13,
  },
});
