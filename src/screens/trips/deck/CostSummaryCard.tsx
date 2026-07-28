import { ScrollView, StyleSheet, Text, View } from 'react-native';

import { costByType } from '../../../lib/trip-deck';
import type { Trip, TripLeg } from '../../../types/trip';

type Props = {
  trip: Trip;
  legs: TripLeg[];
};

export function CostSummaryCard({ trip, legs }: Props) {
  const breakdown = costByType(legs);
  const total = trip.total_cost;

  return (
    <ScrollView contentContainerStyle={styles.content}>
      <Text style={styles.title}>Cost summary</Text>

      <Text style={styles.total}>${total.toFixed(2)}</Text>
      <Text style={styles.totalLabel}>total</Text>

      {breakdown.length === 0 ? (
        <Text style={styles.empty}>Add costs to your legs to see a breakdown here.</Text>
      ) : (
        <View style={styles.breakdown}>
          {breakdown.map((row) => {
            const share = total > 0 ? row.cost / total : 0;
            return (
              <View key={row.type} style={styles.row}>
                <View style={styles.rowHeader}>
                  <Text style={styles.rowLabel}>{row.label}</Text>
                  <Text style={styles.rowCost}>${row.cost.toFixed(2)}</Text>
                </View>
                <View style={styles.barTrack}>
                  <View style={[styles.barFill, { width: `${Math.round(share * 100)}%` }]} />
                </View>
              </View>
            );
          })}
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: {
    flexGrow: 1,
    padding: 24,
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
  },
  total: {
    fontSize: 40,
    fontWeight: '700',
    marginTop: 16,
  },
  totalLabel: {
    fontSize: 13,
    color: '#888',
    marginBottom: 24,
  },
  empty: {
    color: '#888',
  },
  breakdown: {
    gap: 14,
  },
  row: {
    gap: 4,
  },
  rowHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  rowLabel: {
    fontSize: 14,
    fontWeight: '600',
  },
  rowCost: {
    fontSize: 14,
    color: '#555',
  },
  barTrack: {
    height: 6,
    borderRadius: 3,
    backgroundColor: '#eee',
    overflow: 'hidden',
  },
  barFill: {
    height: '100%',
    backgroundColor: '#1a73e8',
    borderRadius: 3,
  },
});
