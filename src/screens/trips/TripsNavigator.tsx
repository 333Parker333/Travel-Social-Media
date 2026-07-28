import { useState } from 'react';
import { View } from 'react-native';

import { TripDeckScreen } from './TripDeckScreen';
import { TripDetailScreen } from './TripDetailScreen';
import { TripFormScreen } from './TripFormScreen';
import { TripsListScreen } from './TripsListScreen';
import { LegFormScreen } from './LegFormScreen';

type View_ =
  | { name: 'list' }
  | { name: 'trip-form'; tripId?: string }
  | { name: 'trip-detail'; tripId: string }
  | { name: 'leg-form'; tripId: string; legId?: string }
  | { name: 'trip-deck'; tripId: string };

type Props = {
  ownerId: string;
};

export function TripsNavigator({ ownerId }: Props) {
  const [view, setView] = useState<View_>({ name: 'list' });

  return (
    <View style={{ flex: 1, width: '100%' }}>
      {view.name === 'list' && (
        <TripsListScreen
          ownerId={ownerId}
          onOpenTrip={(tripId) => setView({ name: 'trip-detail', tripId })}
          onCreateTrip={() => setView({ name: 'trip-form' })}
        />
      )}

      {view.name === 'trip-form' && (
        <TripFormScreen
          ownerId={ownerId}
          tripId={view.tripId}
          onSaved={(tripId) => setView({ name: 'trip-detail', tripId })}
          onCancel={() => setView({ name: 'list' })}
        />
      )}

      {view.name === 'trip-detail' && (
        <TripDetailScreen
          tripId={view.tripId}
          onBack={() => setView({ name: 'list' })}
          onEditTrip={() => setView({ name: 'trip-form', tripId: view.tripId })}
          onAddLeg={() => setView({ name: 'leg-form', tripId: view.tripId })}
          onEditLeg={(legId) => setView({ name: 'leg-form', tripId: view.tripId, legId })}
          onViewDeck={() => setView({ name: 'trip-deck', tripId: view.tripId })}
        />
      )}

      {view.name === 'leg-form' && (
        <LegFormScreen
          tripId={view.tripId}
          legId={view.legId}
          onSaved={() => setView({ name: 'trip-detail', tripId: view.tripId })}
          onCancel={() => setView({ name: 'trip-detail', tripId: view.tripId })}
        />
      )}

      {view.name === 'trip-deck' && (
        <TripDeckScreen tripId={view.tripId} onBack={() => setView({ name: 'trip-detail', tripId: view.tripId })} />
      )}
    </View>
  );
}
