import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

import { DateTimeField } from '../../components/DateTimeField';
import { createTrip, getTrip, updateTrip } from '../../lib/trips-api';

type Props = {
  ownerId: string;
  tripId?: string;
  onSaved: (tripId: string) => void;
  onCancel: () => void;
};

export function TripFormScreen({ ownerId, tripId, onSaved, onCancel }: Props) {
  const [loading, setLoading] = useState(Boolean(tripId));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [title, setTitle] = useState('');
  const [destinations, setDestinations] = useState('');
  const [startDate, setStartDate] = useState<string | null>(null);
  const [endDate, setEndDate] = useState<string | null>(null);

  useEffect(() => {
    if (!tripId) {
      return;
    }
    getTrip(tripId)
      .then((trip) => {
        setTitle(trip.title);
        setDestinations(trip.destinations.join(', '));
        setStartDate(trip.start_date);
        setEndDate(trip.end_date);
        setLoading(false);
      })
      .catch((err: Error) => {
        setError(err.message);
        setLoading(false);
      });
  }, [tripId]);

  const save = async () => {
    if (!title.trim()) {
      setError('Give the trip a title.');
      return;
    }

    setSaving(true);
    setError(null);

    const destinationList = destinations
      .split(',')
      .map((d) => d.trim())
      .filter(Boolean);

    try {
      if (tripId) {
        await updateTrip(tripId, {
          title: title.trim(),
          destinations: destinationList,
          start_date: startDate,
          end_date: endDate,
        });
        onSaved(tripId);
      } else {
        const trip = await createTrip({
          owner: ownerId,
          title: title.trim(),
          destinations: destinationList,
          start_date: startDate,
          end_date: endDate,
        });
        onSaved(trip.id);
      }
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <ActivityIndicator style={styles.spinner} />;
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.label}>Title</Text>
      <TextInput style={styles.input} value={title} onChangeText={setTitle} placeholder="Italy 2027" />

      <Text style={styles.label}>Destinations (comma separated)</Text>
      <TextInput
        style={styles.input}
        value={destinations}
        onChangeText={setDestinations}
        placeholder="Rome, Florence, Venice"
      />

      <View style={styles.row}>
        <View style={styles.half}>
          <DateTimeField label="Start date" mode="date" value={startDate} onChange={setStartDate} />
        </View>
        <View style={styles.half}>
          <DateTimeField label="End date" mode="date" value={endDate} onChange={setEndDate} />
        </View>
      </View>

      {error ? <Text style={styles.error}>{error}</Text> : null}

      <Pressable style={styles.saveButton} onPress={save} disabled={saving}>
        {saving ? <ActivityIndicator color="#fff" /> : <Text style={styles.saveButtonText}>Save trip</Text>}
      </Pressable>

      <Pressable onPress={onCancel}>
        <Text style={styles.cancel}>Cancel</Text>
      </Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    width: '100%',
  },
  content: {
    gap: 10,
    paddingBottom: 24,
  },
  spinner: {
    marginTop: 24,
  },
  label: {
    fontSize: 13,
    color: '#555',
    marginTop: 4,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
  },
  row: {
    flexDirection: 'row',
    gap: 10,
  },
  half: {
    flex: 1,
  },
  error: {
    color: '#d32f2f',
    fontSize: 14,
  },
  saveButton: {
    backgroundColor: '#1a73e8',
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: 'center',
    marginTop: 8,
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  cancel: {
    textAlign: 'center',
    color: '#888',
    marginTop: 12,
  },
});
