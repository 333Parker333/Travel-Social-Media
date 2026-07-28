import { Platform, type ViewStyle } from 'react-native';

/**
 * Mobile screens are already narrow, so this only matters on web: without
 * it, forms and lists stretch edge-to-edge across a wide desktop browser
 * window instead of reading as a reasonable-width column.
 */
export const webMaxWidthStyle: ViewStyle | undefined =
  Platform.OS === 'web' ? { width: '100%', maxWidth: 640, alignSelf: 'center' } : undefined;
