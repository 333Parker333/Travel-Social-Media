import { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

import {
  addTraveler,
  deleteLeg,
  getTrip,
  listLegs,
  listTravelers,
  removeTraveler,
  swapLegPositions,
} from '../../lib/trips-api';
import type { Trip, TripLeg, TripTraveler } from '../../types/trip';

type Props = {
  tripId: string;
  onBack: () => void;
  onEditTrip: () => void;
  onAddLeg: () => void;
  onEditLeg: (legId: string) => void;
  onViewDeck: () => void;
};

const LEG_LABEL: Record<TripLeg['type'], string> = {
  flight: 'Flight',
  train: 'Train',
  bus: 'Bus',
  stay: 'Stay',
  activity: 'Activity',
};

export function TripDetailScreen({ tripId, onBack, onEditTrip, onAddLeg, onEditLeg, onViewDeck }: Props) {
  const [trip, setTrip] = useState<Trip | null>(null);
  const [travelers, setTravelers] = useState<TripTraveler[]>([]);
  const [legs, setLegs] = useState<TripLeg[]>([]);
  const [newTraveler, setNewTraveler] = useState('');
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(() => {
    Promise.all([getTrip(tripId), listTravelers(tripId), listLegs(tripId)])
      .then(([tripData, travelerData, legData]) => {
        setTrip(tripData);
        setTravelers(travelerData);
        setLegs(legData);
      })
      .catch((err: Error) => setError(err.message));
  }, [tripId]);

  useEffect(() => {
    load();
  }, [load]);

  const handleAddTraveler = async () => {
    if (!newTraveler.trim()) {
      return;
    }
    try {
      await addTraveler(tripId, newTraveler.trim());
      setNewTraveler('');
      load();
    } catch (err) {
      setError((err as Error).message);
    }
  };

  const handleRemoveTraveler = (travelerId: string) => {
    removeTraveler(travelerId)
      .then(load)
      .catch((err: Error) => setError(err.message));
  };

  const handleDeleteLeg = (leg: TripLeg) => {
    Alert.alert('Delete leg?', `Remove this ${LEG_LABEL[leg.type].toLowerCase()} from the trip?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: () => deleteLeg(leg.id).then(load).catch((err: Error) => setError(err.message)),
      },
    ]);
  };

  const moveLeg = (index: number, direction: -1 | 1) => {
    const other = legs[index + direction];
    const current = legs[index];
    if (!other) {
      return;
    }
    swapLegPositions(current, other)
      .then(load)
      .catch((err: Error) => setError(err.message));
  };

  if (!trip) {
    return <ActivityIndicator style={styles.spinner} />;
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Pressable onPress={onBack}>
        <Text style={styles.back}>‹ Trips</Text>
      </Pressable>

      <View style={styles.titleRow}>
        <Text style={styles.title}>{trip.title}</Text>
        <Pressable onPress={onEditTrip}>
          <Text style={styles.link}>Edit</Text>
        </Pressable>
      </View>

      <Text style={styles.meta}>
        {trip.status} · {trip.destinations.join(', ') || 'No destinations yet'}
      </Text>
      <Text style={styles.meta}>
        {trip.start_date ?? '?'} → {trip.end_date ?? '?'}
      </Text>
      <Text style={styles.cost}>Total cost: ${trip.total_cost.toFixed(2)}</Text>

      <Pressable style={styles.deckButton} onPress={onViewDeck}>
        <Text style={styles.deckButtonText}>View Trip Deck</Text>
      </Pressable>

      {error ? <Text style={styles.error}>{error}</Text> : null}

      <Text style={styles.sectionTitle}>Travelers</Text>
      <View style={styles.chipRow}>
        {travelers.map((traveler) => (
          <Pressable key={traveler.id} style={styles.chip} onLongPress={() => handleRemoveTraveler(traveler.id)}>
            <Text style={styles.chipText}>{traveler.display_name}</Text>
          </Pressable>
        ))}
      </View>
      <View style={styles.addTravelerRow}>
        <TextInput
          style={styles.travelerInput}
          value={newTraveler}
          onChangeText={setNewTraveler}
          placeholder="Add traveler name"
          onSubmitEditing={handleAddTraveler}
        />
        <Pressable style={styles.addButton} onPress={handleAddTraveler}>
          <Text style={styles.addButtonText}>Add</Text>
        </Pressable>
      </View>

      <View style={styles.legsHeader}>
        <Text style={styles.sectionTitle}>Legs</Text>
        <Pressable style={styles.addButton} onPress={onAddLeg}>
          <Text style={styles.addButtonText}>+ Add leg</Text>
        </Pressable>
      </View>

      {legs.length === 0 ? <Text style={styles.empty}>No legs yet.</Text> : null}

      {legs.map((leg, index) => (
        <View key={leg.id} style={styles.legRow}>
          <Pressable style={styles.legMain} onPress={() => onEditLeg(leg.id)}>
            <Text style={styles.legType}>{LEG_LABEL[leg.type]}</Text>
            <Text style={styles.legDetail}>
              {leg.origin || '?'} → {leg.destination || '?'}
            </Text>
            <Text style={styles.legMeta}>
              {leg.start_time ? new Date(leg.start_time).toLocaleString() : 'No time set'} · $
              {leg.cost.toFixed(2)}
            </Text>
          </Pressable>
          <View style={styles.legActions}>
            <Pressable onPress={() => moveLeg(index, -1)} disabled={index === 0}>
              <Text style={[styles.reorder, index === 0 && styles.reorderDisabled]}>↑</Text>
            </Pressable>
            <Pressable onPress={() => moveLeg(index, 1)} disabled={index === legs.length - 1}>
              <Text style={[styles.reorder, index === legs.length - 1 && styles.reorderDisabled]}>↓</Text>
            </Pressable>
            <Pressable onPress={() => handleDeleteLeg(leg)}>
              <Text style={styles.delete}>✕</Text>
            </Pressable>
          </View>
        </View>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    width: '100%',
  },
  content: {
    paddingBottom: 40,
  },
  spinner: {
    marginTop: 24,
  },
  back: {
    color: '#1a73e8',
    fontSize: 15,
    marginBottom: 12,
  },
  titleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
  },
  link: {
    color: '#1a73e8',
    fontSize: 14,
  },
  meta: {
    color: '#666',
    fontSize: 13,
    marginTop: 4,
  },
  cost: {
    fontSize: 15,
    fontWeight: '600',
    marginTop: 8,
  },
  deckButton: {
    backgroundColor: '#1a73e8',
    borderRadius: 8,
    paddingVertical: 10,
    alignItems: 'center',
    marginTop: 12,
  },
  deckButtonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 14,
  },
  error: {
    color: '#d32f2f',
    marginTop: 8,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    marginTop: 20,
    marginBottom: 8,
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
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
  addTravelerRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 10,
  },
  travelerInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  addButton: {
    backgroundColor: '#1a73e8',
    borderRadius: 8,
    paddingHorizontal: 14,
    justifyContent: 'center',
  },
  addButtonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 13,
  },
  legsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  empty: {
    color: '#888',
  },
  legRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    paddingVertical: 10,
  },
  legMain: {
    flex: 1,
  },
  legType: {
    fontSize: 13,
    fontWeight: '700',
    color: '#1a73e8',
    textTransform: 'uppercase',
  },
  legDetail: {
    fontSize: 15,
    marginTop: 2,
  },
  legMeta: {
    fontSize: 12,
    color: '#888',
    marginTop: 2,
  },
  legActions: {
    flexDirection: 'row',
    gap: 12,
    alignItems: 'center',
  },
  reorder: {
    fontSize: 18,
    color: '#1a73e8',
    paddingHorizontal: 4,
  },
  reorderDisabled: {
    color: '#ccc',
  },
  delete: {
    fontSize: 16,
    color: '#d32f2f',
    paddingHorizontal: 4,
  },
});
