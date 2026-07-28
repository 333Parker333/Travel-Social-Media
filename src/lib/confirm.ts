import { Alert, Platform } from 'react-native';

/**
 * react-native-web's Alert.alert() is a no-op (it does nothing at all),
 * so a destructive confirmation needs a real web equivalent or it
 * silently never fires.
 */
export function confirmDestructiveAction(
  title: string,
  message: string,
  confirmLabel = 'Delete'
): Promise<boolean> {
  if (Platform.OS === 'web') {
    return Promise.resolve(window.confirm(`${title}\n\n${message}`));
  }

  return new Promise((resolve) => {
    Alert.alert(title, message, [
      { text: 'Cancel', style: 'cancel', onPress: () => resolve(false) },
      { text: confirmLabel, style: 'destructive', onPress: () => resolve(true) },
    ]);
  });
}
