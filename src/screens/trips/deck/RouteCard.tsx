import { ScrollView, StyleSheet, Text, View } from 'react-native';

import { LEG_TYPE_LABEL } from '../../../lib/trip-deck';
import type { TripLeg } from '../../../types/trip';

type Props = {
  legs: TripLeg[];
};

type Stop = {
  location: string;
  subtitle: string;
};

const TRANSIT_TYPES: TripLeg['type'][] = ['flight', 'train', 'bus', 'ferry'];

function buildStops(legs: TripLeg[]): Stop[] {
  const stops: Stop[] = [];
  let lastLocation: string | null = null;

  for (const leg of legs) {
    if (TRANSIT_TYPES.includes(leg.type)) {
      if (leg.origin && leg.origin !== lastLocation) {
        stops.push({ location: leg.origin, subtitle: `Depart · ${LEG_TYPE_LABEL[leg.type]}` });
        lastLocation = leg.origin;
      }
      if (leg.destination && leg.destination !== lastLocation) {
        stops.push({ location: leg.destination, subtitle: `Arrive · ${LEG_TYPE_LABEL[leg.type]}` });
        lastLocation = leg.destination;
      }
    } else {
      const location = leg.destination || leg.origin;
      if (location && location !== lastLocation) {
        stops.push({ location, subtitle: LEG_TYPE_LABEL[leg.type] });
        lastLocation = location;
      }
    }
  }

  return stops;
}

export function RouteCard({ legs }: Props) {
  const stops = buildStops(legs);

  return (
    <ScrollView contentContainerStyle={styles.content}>
      <Text style={styles.title}>Route</Text>

      {stops.length === 0 ? (
        <Text style={styles.empty}>Add origins/destinations to your legs to see the route here.</Text>
      ) : (
        <View style={styles.stepper}>
          {stops.map((stop, index) => (
            <View key={`${stop.location}-${index}`} style={styles.stopRow}>
              <View style={styles.markerColumn}>
                <View style={styles.dot} />
                {index < stops.length - 1 ? <View style={styles.line} /> : null}
              </View>
              <View style={styles.stopText}>
                <Text style={styles.location}>{stop.location}</Text>
                <Text style={styles.subtitle}>{stop.subtitle}</Text>
              </View>
            </View>
          ))}
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
    marginBottom: 20,
  },
  empty: {
    color: '#888',
  },
  stepper: {
    gap: 0,
  },
  stopRow: {
    flexDirection: 'row',
  },
  markerColumn: {
    width: 24,
    alignItems: 'center',
  },
  dot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#1a73e8',
    marginTop: 4,
  },
  line: {
    flex: 1,
    width: 2,
    backgroundColor: '#cddcf9',
    marginVertical: 2,
  },
  stopText: {
    flex: 1,
    paddingBottom: 20,
    paddingLeft: 12,
  },
  location: {
    fontSize: 17,
    fontWeight: '600',
  },
  subtitle: {
    fontSize: 13,
    color: '#888',
    marginTop: 2,
  },
});
