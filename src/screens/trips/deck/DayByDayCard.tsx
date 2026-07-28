import { useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import {
  LEG_TYPE_LABEL,
  formatLegTimeRange,
  groupLegsByDay,
  groupLegsByType,
  partitionLegs,
  travelerName,
} from '../../../lib/trip-deck';
import type { TripLeg, TripTraveler } from '../../../types/trip';

type Props = {
  legs: TripLeg[];
  travelers: TripTraveler[];
};

type ViewMode = 'day' | 'type';

export function DayByDayCard({ legs, travelers }: Props) {
  const [mode, setMode] = useState<ViewMode>('day');

  const { scheduled, wishlist } = useMemo(() => partitionLegs(legs), [legs]);
  const dayGroups = useMemo(() => groupLegsByDay(scheduled), [scheduled]);
  const typeGroups = useMemo(() => groupLegsByType(legs), [legs]);

  return (
    <ScrollView contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <Text style={styles.title}>Itinerary</Text>
        <View style={styles.toggle}>
          <Pressable
            style={[styles.toggleOption, mode === 'day' && styles.toggleOptionActive]}
            onPress={() => setMode('day')}
          >
            <Text style={[styles.toggleText, mode === 'day' && styles.toggleTextActive]}>By day</Text>
          </Pressable>
          <Pressable
            style={[styles.toggleOption, mode === 'type' && styles.toggleOptionActive]}
            onPress={() => setMode('type')}
          >
            <Text style={[styles.toggleText, mode === 'type' && styles.toggleTextActive]}>By type</Text>
          </Pressable>
        </View>
      </View>

      {legs.length === 0 ? <Text style={styles.empty}>No legs added yet.</Text> : null}

      {mode === 'day'
        ? dayGroups.map((group) => (
            <View key={group.key} style={styles.group}>
              <Text style={styles.groupTitle}>{group.label}</Text>
              {group.legs.map((leg) => (
                <LegRow key={leg.id} leg={leg} travelers={travelers} />
              ))}
            </View>
          ))
        : typeGroups.map((group) => (
            <View key={group.type} style={styles.group}>
              <Text style={styles.groupTitle}>{group.label}</Text>
              {group.legs.map((leg) => (
                <LegRow key={leg.id} leg={leg} travelers={travelers} />
              ))}
            </View>
          ))}

      {mode === 'day' && wishlist.length > 0 ? (
        <View style={styles.group}>
          <Text style={styles.groupTitle}>Things to do</Text>
          {wishlist.map((leg) => (
            <LegRow key={leg.id} leg={leg} travelers={travelers} />
          ))}
        </View>
      ) : null}
    </ScrollView>
  );
}

function legPlace(leg: TripLeg): string | null {
  if (leg.origin || leg.destination) {
    return `${leg.origin || '?'}${leg.destination ? ` → ${leg.destination}` : ''}`;
  }
  const details = leg.details as { category?: string; address?: string };
  return details.category || details.address || null;
}

function LegRow({ leg, travelers }: { leg: TripLeg; travelers: TripTraveler[] }) {
  const place = legPlace(leg);
  return (
    <View style={styles.legRow}>
      <View style={styles.legHeaderRow}>
        <Text style={styles.legType}>{LEG_TYPE_LABEL[leg.type]}</Text>
        <Text style={styles.legTime}>{formatLegTimeRange(leg)}</Text>
      </View>
      {place ? <Text style={styles.legPlace}>{place}</Text> : null}
      <View style={styles.legFooterRow}>
        <Text style={styles.legCost}>${leg.cost.toFixed(2)}</Text>
        {leg.applies_to.length > 0 ? (
          <Text style={styles.legTravelers}>
            {leg.applies_to.map((id) => travelerName(travelers, id)).join(', ')}
          </Text>
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  content: {
    flexGrow: 1,
    padding: 24,
  },
  header: {
    marginBottom: 16,
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    marginBottom: 12,
  },
  toggle: {
    flexDirection: 'row',
    backgroundColor: '#f0f0f0',
    borderRadius: 8,
    padding: 3,
    alignSelf: 'flex-start',
  },
  toggleOption: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 6,
  },
  toggleOptionActive: {
    backgroundColor: '#1a73e8',
  },
  toggleText: {
    fontSize: 13,
    color: '#555',
    fontWeight: '600',
  },
  toggleTextActive: {
    color: '#fff',
  },
  empty: {
    color: '#888',
  },
  group: {
    marginBottom: 20,
  },
  groupTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#1a73e8',
    marginBottom: 8,
  },
  legRow: {
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    paddingVertical: 10,
  },
  legHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  legType: {
    fontSize: 12,
    fontWeight: '700',
    color: '#888',
    textTransform: 'uppercase',
  },
  legTime: {
    fontSize: 13,
    color: '#555',
  },
  legPlace: {
    fontSize: 16,
    marginTop: 4,
  },
  legFooterRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 4,
  },
  legCost: {
    fontSize: 13,
    fontWeight: '600',
  },
  legTravelers: {
    fontSize: 12,
    color: '#888',
  },
});
