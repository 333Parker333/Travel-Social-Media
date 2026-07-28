import { useEffect, useState } from 'react';
import type { NativeScrollEvent, NativeSyntheticEvent } from 'react-native';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View, useWindowDimensions } from 'react-native';

import { getTrip, listLegs, listTravelers } from '../../lib/trips-api';
import type { Trip, TripLeg, TripTraveler } from '../../types/trip';
import { CostSummaryCard } from './deck/CostSummaryCard';
import { CoverCard } from './deck/CoverCard';
import { DayByDayCard } from './deck/DayByDayCard';
import { MasterScheduleCard } from './deck/MasterScheduleCard';
import { RouteCard } from './deck/RouteCard';

type Props = {
  tripId: string;
  onBack: () => void;
};

export function TripDeckScreen({ tripId, onBack }: Props) {
  const { width } = useWindowDimensions();
  const [trip, setTrip] = useState<Trip | null>(null);
  const [travelers, setTravelers] = useState<TripTraveler[]>([]);
  const [legs, setLegs] = useState<TripLeg[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(0);

  useEffect(() => {
    Promise.all([getTrip(tripId), listTravelers(tripId), listLegs(tripId)])
      .then(([tripData, travelerData, legData]) => {
        setTrip(tripData);
        setTravelers(travelerData);
        setLegs(legData);
      })
      .catch((err: Error) => setError(err.message));
  }, [tripId]);

  const handleScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const nextPage = Math.round(event.nativeEvent.contentOffset.x / width);
    setPage(nextPage);
  };

  if (error) {
    return (
      <View style={styles.center}>
        <Text style={styles.error}>{error}</Text>
      </View>
    );
  }

  if (!trip) {
    return (
      <View style={styles.center}>
        <ActivityIndicator />
      </View>
    );
  }

  const pages = [
    <CoverCard key="cover" trip={trip} travelers={travelers} />,
    <RouteCard key="route" legs={legs} />,
    <DayByDayCard key="itinerary" legs={legs} travelers={travelers} />,
    <CostSummaryCard key="cost" trip={trip} legs={legs} />,
    <MasterScheduleCard key="schedule" legs={legs} />,
  ];

  return (
    <View style={styles.container}>
      <Pressable onPress={onBack} style={styles.back}>
        <Text style={styles.backText}>‹ Trip</Text>
      </Pressable>

      <ScrollView
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onMomentumScrollEnd={handleScroll}
        style={styles.pager}
      >
        {pages.map((card, index) => (
          <View key={index} style={{ width }}>
            {card}
          </View>
        ))}
      </ScrollView>

      <View style={styles.dots}>
        {pages.map((_, index) => (
          <View key={index} style={[styles.dot, index === page && styles.dotActive]} />
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  error: {
    color: '#d32f2f',
  },
  back: {
    paddingHorizontal: 4,
    paddingBottom: 8,
  },
  backText: {
    color: '#1a73e8',
    fontSize: 15,
  },
  pager: {
    flex: 1,
  },
  dots: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 12,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#ccc',
  },
  dotActive: {
    backgroundColor: '#1a73e8',
    width: 18,
  },
});
