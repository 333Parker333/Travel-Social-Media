import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';

import { confirmDestructiveAction } from '../../lib/confirm';
import {
  addTraveler,
  deleteLeg,
  findUserIdByEmail,
  getProfilesByIds,
  getTrip,
  listLegs,
  listTravelers,
  removeTraveler,
  swapLegPositions,
  updateTrip,
} from '../../lib/trips-api';
import type { SharedProfile } from '../../lib/trips-api';
import { partitionLegs } from '../../lib/trip-deck';
import type { Trip, TripLeg, TripTraveler } from '../../types/trip';

type Props = {
  tripId: string;
  currentUserId: string;
  onBack: () => void;
  onEditTrip: () => void;
  onAddLeg: () => void;
  onEditLeg: (legId: string) => void;
  onViewDeck: () => void;
  onImportBooking: () => void;
};

const LEG_LABEL: Record<TripLeg['type'], string> = {
  flight: 'Flight',
  train: 'Train',
  bus: 'Bus',
  ferry: 'Ferry',
  stay: 'Stay',
  activity: 'Activity',
};

function legPrimaryLabel(leg: TripLeg): string {
  if (leg.origin || leg.destination) {
    return `${leg.origin || '?'} → ${leg.destination || '?'}`;
  }
  const details = leg.details as { category?: string; address?: string };
  return details.category || details.address || 'Untitled';
}

export function TripDetailScreen({
  tripId,
  currentUserId,
  onBack,
  onEditTrip,
  onAddLeg,
  onEditLeg,
  onViewDeck,
  onImportBooking,
}: Props) {
  const [trip, setTrip] = useState<Trip | null>(null);
  const [travelers, setTravelers] = useState<TripTraveler[]>([]);
  const [legs, setLegs] = useState<TripLeg[]>([]);
  const [sharedProfiles, setSharedProfiles] = useState<SharedProfile[]>([]);
  const [newTraveler, setNewTraveler] = useState('');
  const [shareEmail, setShareEmail] = useState('');
  const [sharing, setSharing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(() => {
    Promise.all([getTrip(tripId), listTravelers(tripId), listLegs(tripId)])
      .then(([tripData, travelerData, legData]) => {
        setTrip(tripData);
        setTravelers(travelerData);
        setLegs(legData);
        return tripData.shared_with.length > 0 ? getProfilesByIds(tripData.shared_with) : [];
      })
      .then(setSharedProfiles)
      .catch((err: Error) => setError(err.message));
  }, [tripId]);

  useEffect(() => {
    load();
  }, [load]);

  const isOwner = trip?.owner === currentUserId;

  const handleShare = async () => {
    if (!trip || !shareEmail.trim()) {
      return;
    }
    setSharing(true);
    setError(null);
    try {
      const userId = await findUserIdByEmail(shareEmail.trim());
      if (!userId) {
        throw new Error('No account found with that email.');
      }
      if (userId === trip.owner) {
        throw new Error("That's already the trip owner.");
      }
      if (trip.shared_with.includes(userId)) {
        throw new Error('Already shared with that person.');
      }
      await updateTrip(tripId, { shared_with: [...trip.shared_with, userId] });
      setShareEmail('');
      load();
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setSharing(false);
    }
  };

  const handleUnshare = (userId: string) => {
    if (!trip) {
      return;
    }
    updateTrip(tripId, { shared_with: trip.shared_with.filter((id) => id !== userId) })
      .then(load)
      .catch((err: Error) => setError(err.message));
  };

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

  const handleDeleteLeg = async (leg: TripLeg) => {
    const confirmed = await confirmDestructiveAction(
      'Delete leg?',
      `Remove this ${LEG_LABEL[leg.type].toLowerCase()} from the trip?`
    );
    if (!confirmed) {
      return;
    }
    try {
      await deleteLeg(leg.id);
      load();
    } catch (err) {
      setError((err as Error).message);
    }
  };

  const { scheduled, wishlist } = partitionLegs(legs);

  const moveLeg = (index: number, direction: -1 | 1) => {
    const other = scheduled[index + direction];
    const current = scheduled[index];
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
        {isOwner ? (
          <Pressable onPress={onEditTrip}>
            <Text style={styles.link}>Edit</Text>
          </Pressable>
        ) : null}
      </View>

      {!isOwner ? <Text style={styles.sharedBadge}>Shared with you</Text> : null}

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

      {isOwner ? (
        <>
          <Text style={styles.sectionTitle}>Shared with</Text>
          {sharedProfiles.length === 0 ? <Text style={styles.empty}>Not shared with anyone yet.</Text> : null}
          <View style={styles.chipRow}>
            {sharedProfiles.map((profile) => (
              <Pressable
                key={profile.id}
                style={styles.chip}
                onLongPress={() => handleUnshare(profile.id)}
              >
                <Text style={styles.chipText}>{profile.display_name || profile.email}</Text>
              </Pressable>
            ))}
          </View>
          <View style={styles.addTravelerRow}>
            <TextInput
              style={styles.travelerInput}
              value={shareEmail}
              onChangeText={setShareEmail}
              placeholder="Friend's email"
              autoCapitalize="none"
              keyboardType="email-address"
              onSubmitEditing={handleShare}
            />
            <Pressable style={styles.addButton} onPress={handleShare} disabled={sharing}>
              <Text style={styles.addButtonText}>{sharing ? '...' : 'Share'}</Text>
            </Pressable>
          </View>
          <Text style={styles.wishlistHint}>Long-press a chip to remove their access.</Text>
        </>
      ) : null}

      <Text style={styles.sectionTitle}>Travelers</Text>
      <View style={styles.chipRow}>
        {travelers.map((traveler) => (
          <Pressable
            key={traveler.id}
            style={styles.chip}
            onLongPress={isOwner ? () => handleRemoveTraveler(traveler.id) : undefined}
          >
            <Text style={styles.chipText}>{traveler.display_name}</Text>
          </Pressable>
        ))}
      </View>
      {isOwner ? (
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
      ) : null}

      <View style={styles.legsHeader}>
        <Text style={styles.sectionTitle}>Legs</Text>
        {isOwner ? (
          <View style={styles.legsHeaderButtons}>
            <Pressable style={styles.addButtonSecondary} onPress={onImportBooking}>
              <Text style={styles.addButtonSecondaryText}>Add from photo</Text>
            </Pressable>
            <Pressable style={styles.addButton} onPress={onAddLeg}>
              <Text style={styles.addButtonText}>+ Add leg</Text>
            </Pressable>
          </View>
        ) : null}
      </View>

      {scheduled.length === 0 ? <Text style={styles.empty}>No legs yet.</Text> : null}

      {scheduled.map((leg, index) => (
        <View key={leg.id} style={styles.legRow}>
          <Pressable style={styles.legMain} onPress={isOwner ? () => onEditLeg(leg.id) : undefined}>
            <Text style={styles.legType}>{LEG_LABEL[leg.type]}</Text>
            <Text style={styles.legDetail}>{legPrimaryLabel(leg)}</Text>
            <Text style={styles.legMeta}>
              {leg.start_time ? new Date(leg.start_time).toLocaleString() : 'No time set'} · $
              {leg.cost.toFixed(2)}
            </Text>
          </Pressable>
          {isOwner ? (
            <View style={styles.legActions}>
              <Pressable onPress={() => moveLeg(index, -1)} disabled={index === 0}>
                <Text style={[styles.reorder, index === 0 && styles.reorderDisabled]}>↑</Text>
              </Pressable>
              <Pressable onPress={() => moveLeg(index, 1)} disabled={index === scheduled.length - 1}>
                <Text style={[styles.reorder, index === scheduled.length - 1 && styles.reorderDisabled]}>↓</Text>
              </Pressable>
              <Pressable onPress={() => handleDeleteLeg(leg)}>
                <Text style={styles.delete}>✕</Text>
              </Pressable>
            </View>
          ) : null}
        </View>
      ))}

      {wishlist.length > 0 ? (
        <>
          <Text style={styles.sectionTitle}>Things to do</Text>
          <Text style={styles.wishlistHint}>
            Ideas without a set time. Edit one and add a time to move it into the schedule.
          </Text>
          {wishlist.map((leg) => (
            <View key={leg.id} style={styles.legRow}>
              <Pressable style={styles.legMain} onPress={isOwner ? () => onEditLeg(leg.id) : undefined}>
                <Text style={styles.legType}>{LEG_LABEL[leg.type]}</Text>
                <Text style={styles.legDetail}>{legPrimaryLabel(leg)}</Text>
                <Text style={styles.legMeta}>${leg.cost.toFixed(2)}</Text>
              </Pressable>
              {isOwner ? (
                <Pressable onPress={() => handleDeleteLeg(leg)}>
                  <Text style={styles.delete}>✕</Text>
                </Pressable>
              ) : null}
            </View>
          ))}
        </>
      ) : null}
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
  sharedBadge: {
    fontSize: 12,
    fontWeight: '600',
    color: '#1a73e8',
    marginTop: 4,
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
  legsHeaderButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  addButtonSecondary: {
    borderWidth: 1,
    borderColor: '#1a73e8',
    borderRadius: 8,
    paddingHorizontal: 14,
    justifyContent: 'center',
  },
  addButtonSecondaryText: {
    color: '#1a73e8',
    fontWeight: '600',
    fontSize: 13,
  },
  empty: {
    color: '#888',
  },
  wishlistHint: {
    fontSize: 12,
    color: '#888',
    marginTop: -4,
    marginBottom: 8,
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
