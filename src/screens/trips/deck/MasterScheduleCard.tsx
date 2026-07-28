import { ScrollView, StyleSheet, Text, View } from 'react-native';

import { LEG_TYPE_LABEL, formatLegTimeRange } from '../../../lib/trip-deck';
import type { TripLeg } from '../../../types/trip';

type Props = {
  legs: TripLeg[];
};

const COLUMN_WIDTHS = {
  type: 80,
  time: 150,
  route: 160,
  cost: 80,
  confirmation: 120,
};

export function MasterScheduleCard({ legs }: Props) {
  return (
    <ScrollView contentContainerStyle={styles.content}>
      <Text style={styles.title}>Master schedule</Text>

      {legs.length === 0 ? (
        <Text style={styles.empty}>No legs added yet.</Text>
      ) : (
        <ScrollView horizontal showsHorizontalScrollIndicator>
          <View>
            <View style={styles.headerRow}>
              <Text style={[styles.headerCell, { width: COLUMN_WIDTHS.type }]}>Type</Text>
              <Text style={[styles.headerCell, { width: COLUMN_WIDTHS.time }]}>Time</Text>
              <Text style={[styles.headerCell, { width: COLUMN_WIDTHS.route }]}>Route</Text>
              <Text style={[styles.headerCell, { width: COLUMN_WIDTHS.cost }]}>Cost</Text>
              <Text style={[styles.headerCell, { width: COLUMN_WIDTHS.confirmation }]}>Confirmation</Text>
            </View>

            {legs.map((leg) => (
              <View key={leg.id} style={styles.row}>
                <Text style={[styles.cell, { width: COLUMN_WIDTHS.type }]}>{LEG_TYPE_LABEL[leg.type]}</Text>
                <Text style={[styles.cell, { width: COLUMN_WIDTHS.time }]}>{formatLegTimeRange(leg)}</Text>
                <Text style={[styles.cell, { width: COLUMN_WIDTHS.route }]} numberOfLines={1}>
                  {leg.origin || '?'}
                  {leg.destination ? ` → ${leg.destination}` : ''}
                </Text>
                <Text style={[styles.cell, { width: COLUMN_WIDTHS.cost }]}>${leg.cost.toFixed(2)}</Text>
                <Text style={[styles.cell, { width: COLUMN_WIDTHS.confirmation }]} numberOfLines={1}>
                  {leg.confirmation_number || '—'}
                </Text>
              </View>
            ))}
          </View>
        </ScrollView>
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
    marginBottom: 16,
  },
  empty: {
    color: '#888',
  },
  headerRow: {
    flexDirection: 'row',
    borderBottomWidth: 2,
    borderBottomColor: '#333',
    paddingBottom: 8,
  },
  headerCell: {
    fontSize: 12,
    fontWeight: '700',
    color: '#555',
    textTransform: 'uppercase',
  },
  row: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    paddingVertical: 10,
  },
  cell: {
    fontSize: 13,
    paddingRight: 8,
  },
});
