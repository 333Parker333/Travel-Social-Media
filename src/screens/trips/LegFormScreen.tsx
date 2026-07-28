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

import { createLeg, getLeg, listTravelers, updateLeg } from '../../lib/trips-api';
import type { LegType } from '../../types/trip';

type Props = {
  tripId: string;
  legId?: string;
  onSaved: () => void;
  onCancel: () => void;
};

const LEG_TYPES: { value: LegType; label: string }[] = [
  { value: 'flight', label: 'Flight' },
  { value: 'train', label: 'Train' },
  { value: 'bus', label: 'Bus' },
  { value: 'stay', label: 'Stay' },
  { value: 'activity', label: 'Activity' },
];

const DETAIL_FIELDS: Record<LegType, { key: string; label: string }[]> = {
  flight: [
    { key: 'airline', label: 'Airline' },
    { key: 'flight_number', label: 'Flight number' },
    { key: 'seat', label: 'Seat' },
    { key: 'terminal', label: 'Terminal' },
    { key: 'gate', label: 'Gate' },
  ],
  train: [
    { key: 'carrier', label: 'Carrier' },
    { key: 'number', label: 'Train number' },
    { key: 'seat', label: 'Seat' },
  ],
  bus: [
    { key: 'carrier', label: 'Carrier' },
    { key: 'number', label: 'Bus number' },
    { key: 'seat', label: 'Seat' },
  ],
  stay: [
    { key: 'address', label: 'Address' },
    { key: 'check_in_time', label: 'Check-in time' },
    { key: 'check_out_time', label: 'Check-out time' },
    { key: 'room_type', label: 'Room type' },
  ],
  activity: [
    { key: 'address', label: 'Address' },
    { key: 'booking_reference', label: 'Booking reference' },
  ],
};

export function LegFormScreen({ tripId, legId, onSaved, onCancel }: Props) {
  const [loading, setLoading] = useState(Boolean(legId));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [type, setType] = useState<LegType>('flight');
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');
  const [origin, setOrigin] = useState('');
  const [destination, setDestination] = useState('');
  const [cost, setCost] = useState('');
  const [confirmationNumber, setConfirmationNumber] = useState('');
  const [details, setDetails] = useState<Record<string, string>>({});
  const [travelers, setTravelers] = useState<{ id: string; display_name: string }[]>([]);
  const [appliesTo, setAppliesTo] = useState<string[]>([]);

  useEffect(() => {
    listTravelers(tripId).then(setTravelers);
  }, [tripId]);

  useEffect(() => {
    if (!legId) {
      return;
    }
    getLeg(legId)
      .then((leg) => {
        setType(leg.type);
        setStartTime(leg.start_time ?? '');
        setEndTime(leg.end_time ?? '');
        setOrigin(leg.origin ?? '');
        setDestination(leg.destination ?? '');
        setCost(leg.cost ? String(leg.cost) : '');
        setConfirmationNumber(leg.confirmation_number ?? '');
        setDetails(leg.details as Record<string, string>);
        setAppliesTo(leg.applies_to);
        setLoading(false);
      })
      .catch((err: Error) => {
        setError(err.message);
        setLoading(false);
      });
  }, [legId]);

  const toggleTraveler = (travelerId: string) => {
    setAppliesTo((current) =>
      current.includes(travelerId) ? current.filter((id) => id !== travelerId) : [...current, travelerId]
    );
  };

  const save = async () => {
    setSaving(true);
    setError(null);

    const relevantKeys = DETAIL_FIELDS[type].map((field) => field.key);
    const filteredDetails = Object.fromEntries(
      relevantKeys.filter((key) => details[key]?.trim()).map((key) => [key, details[key].trim()])
    );

    const input = {
      type,
      start_time: startTime || null,
      end_time: endTime || null,
      origin: origin || null,
      destination: destination || null,
      cost: Number(cost) || 0,
      confirmation_number: confirmationNumber || null,
      applies_to: appliesTo,
      details: filteredDetails,
    };

    try {
      if (legId) {
        await updateLeg(legId, input);
      } else {
        await createLeg(tripId, input);
      }
      onSaved();
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
      <Text style={styles.label}>Type</Text>
      <View style={styles.typeRow}>
        {LEG_TYPES.map((option) => (
          <Pressable
            key={option.value}
            style={[styles.typeChip, type === option.value && styles.typeChipActive]}
            onPress={() => setType(option.value)}
          >
            <Text style={[styles.typeChipText, type === option.value && styles.typeChipTextActive]}>
              {option.label}
            </Text>
          </Pressable>
        ))}
      </View>

      <View style={styles.row}>
        <View style={styles.half}>
          <Text style={styles.label}>Origin</Text>
          <TextInput style={styles.input} value={origin} onChangeText={setOrigin} placeholder="JFK" />
        </View>
        <View style={styles.half}>
          <Text style={styles.label}>Destination</Text>
          <TextInput style={styles.input} value={destination} onChangeText={setDestination} placeholder="FCO" />
        </View>
      </View>

      <View style={styles.row}>
        <View style={styles.half}>
          <Text style={styles.label}>Start time (ISO)</Text>
          <TextInput
            style={styles.input}
            value={startTime}
            onChangeText={setStartTime}
            placeholder="2027-06-01T14:00"
          />
        </View>
        <View style={styles.half}>
          <Text style={styles.label}>End time (ISO)</Text>
          <TextInput style={styles.input} value={endTime} onChangeText={setEndTime} placeholder="2027-06-01T20:00" />
        </View>
      </View>

      <View style={styles.row}>
        <View style={styles.half}>
          <Text style={styles.label}>Cost</Text>
          <TextInput style={styles.input} value={cost} onChangeText={setCost} placeholder="0.00" keyboardType="decimal-pad" />
        </View>
        <View style={styles.half}>
          <Text style={styles.label}>Confirmation #</Text>
          <TextInput style={styles.input} value={confirmationNumber} onChangeText={setConfirmationNumber} />
        </View>
      </View>

      <Text style={styles.sectionTitle}>Details</Text>
      {DETAIL_FIELDS[type].map((field) => (
        <View key={field.key}>
          <Text style={styles.label}>{field.label}</Text>
          <TextInput
            style={styles.input}
            value={details[field.key] ?? ''}
            onChangeText={(value) => setDetails((current) => ({ ...current, [field.key]: value }))}
          />
        </View>
      ))}

      {travelers.length > 0 ? (
        <>
          <Text style={styles.sectionTitle}>Applies to</Text>
          <View style={styles.typeRow}>
            {travelers.map((traveler) => (
              <Pressable
                key={traveler.id}
                style={[styles.typeChip, appliesTo.includes(traveler.id) && styles.typeChipActive]}
                onPress={() => toggleTraveler(traveler.id)}
              >
                <Text
                  style={[styles.typeChipText, appliesTo.includes(traveler.id) && styles.typeChipTextActive]}
                >
                  {traveler.display_name}
                </Text>
              </Pressable>
            ))}
          </View>
        </>
      ) : null}

      {error ? <Text style={styles.error}>{error}</Text> : null}

      <Pressable style={styles.saveButton} onPress={save} disabled={saving}>
        {saving ? <ActivityIndicator color="#fff" /> : <Text style={styles.saveButtonText}>Save leg</Text>}
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
    paddingBottom: 40,
  },
  spinner: {
    marginTop: 24,
  },
  label: {
    fontSize: 13,
    color: '#555',
    marginTop: 4,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    marginTop: 12,
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
  typeRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  typeChip: {
    borderWidth: 1,
    borderColor: '#1a73e8',
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  typeChipActive: {
    backgroundColor: '#1a73e8',
  },
  typeChipText: {
    color: '#1a73e8',
    fontSize: 13,
  },
  typeChipTextActive: {
    color: '#fff',
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
