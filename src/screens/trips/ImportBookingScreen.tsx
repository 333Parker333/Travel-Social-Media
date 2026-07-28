import { useState } from 'react';
import * as ImagePicker from 'expo-image-picker';
import { ActivityIndicator, Image, Pressable, StyleSheet, Text, View } from 'react-native';

import { uploadBookingPhoto } from '../../lib/booking-ingestion-api';
import type { IngestedBooking } from '../../types/trip';

type Props = {
  tripId: string;
  userId: string;
  onImported: (booking: IngestedBooking) => void;
  onCancel: () => void;
};

export function ImportBookingScreen({ tripId, userId, onImported, onCancel }: Props) {
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const pickAndUpload = async (source: 'camera' | 'library') => {
    setError(null);

    const permission =
      source === 'camera'
        ? await ImagePicker.requestCameraPermissionsAsync()
        : await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (!permission.granted) {
      setError('Permission denied. Enable photo/camera access in Settings to import a booking.');
      return;
    }

    const result =
      source === 'camera'
        ? await ImagePicker.launchCameraAsync({ quality: 0.8 })
        : await ImagePicker.launchImageLibraryAsync({ quality: 0.8, mediaTypes: ['images'] });

    if (result.canceled || !result.assets || result.assets.length === 0) {
      return;
    }

    const asset = result.assets[0];
    setImageUri(asset.uri);
    setProcessing(true);

    try {
      const booking = await uploadBookingPhoto({
        userId,
        tripId,
        fileUri: asset.uri,
        mimeType: asset.mimeType ?? 'image/jpeg',
      });
      onImported(booking);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setProcessing(false);
    }
  };

  return (
    <View style={styles.container}>
      <Pressable onPress={onCancel}>
        <Text style={styles.back}>‹ Trip</Text>
      </Pressable>

      <Text style={styles.title}>Import a booking</Text>
      <Text style={styles.subtitle}>
        Take a photo or pick a screenshot of a confirmation email. We&apos;ll try to fill in the details for you
        to review before it&apos;s saved.
      </Text>

      {imageUri ? <Image source={{ uri: imageUri }} style={styles.preview} /> : null}

      {processing ? (
        <View style={styles.processing}>
          <ActivityIndicator />
          <Text style={styles.processingText}>Reading your booking…</Text>
        </View>
      ) : (
        <View style={styles.actions}>
          <Pressable style={styles.button} onPress={() => pickAndUpload('camera')}>
            <Text style={styles.buttonText}>Take a photo</Text>
          </Pressable>
          <Pressable style={styles.button} onPress={() => pickAndUpload('library')}>
            <Text style={styles.buttonText}>Choose from library</Text>
          </Pressable>
        </View>
      )}

      {error ? <Text style={styles.error}>{error}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    width: '100%',
    padding: 4,
    gap: 12,
  },
  back: {
    color: '#1a73e8',
    fontSize: 15,
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
  },
  subtitle: {
    fontSize: 14,
    color: '#666',
  },
  preview: {
    width: '100%',
    height: 220,
    borderRadius: 12,
    resizeMode: 'contain',
    backgroundColor: '#f0f0f0',
  },
  actions: {
    gap: 10,
  },
  button: {
    backgroundColor: '#1a73e8',
    borderRadius: 8,
    paddingVertical: 14,
    alignItems: 'center',
  },
  buttonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 15,
  },
  processing: {
    alignItems: 'center',
    gap: 8,
    marginTop: 12,
  },
  processingText: {
    color: '#666',
    fontSize: 14,
  },
  error: {
    color: '#d32f2f',
    fontSize: 14,
  },
});
