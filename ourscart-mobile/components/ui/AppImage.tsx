// =============================================================================
// Optimized image component — wraps expo-image with production defaults.
//
// Centralizes: blurhash placeholder, memory+disk caching, priority loading,
// and recycling keys for FlatList. Every product image in the app should use
// this component so a single change here propagates everywhere.
//
// expo-image is already in the dependency tree (Expo SDK 51 includes it).
// It provides: lazy loading, JPEG/PNG/WebP/AVIF support, caching, blurhash.
// =============================================================================
import { Image } from 'expo-image';
import type { ImageStyle, StyleProp } from 'react-native';
import type { ImageContentFit } from 'expo-image';

// Warm gray blurhash that matches our bgTertiary token — shows while image loads,
// preventing layout shift. The hash is a compact representation of a placeholder.
const PLACEHOLDER_BLURHASH = 'L9SPUL~q00D%00D%fQj[00Rj_3of';

interface AppImageProps {
  uri: string | null | undefined;
  style?: StyleProp<ImageStyle>;
  aspectRatio?: number;
  borderRadius?: number;
  contentFit?: ImageContentFit;
  priority?: 'low' | 'normal' | 'high';
}

export function AppImage({
  uri,
  style,
  aspectRatio,
  borderRadius,
  contentFit = 'cover',
  priority = 'normal',
}: AppImageProps) {
  return (
    <Image
      source={uri ? { uri } : null}
      style={[style, !style && aspectRatio ? { aspectRatio } : undefined, borderRadius ? { borderRadius } : undefined]}
      contentFit={contentFit}
      placeholder={PLACEHOLDER_BLURHASH}
      placeholderContentFit="cover"
      transition={200}
      priority={priority}
      cachePolicy="memory-disk"
      recyclingKey={uri || 'placeholder'}
    />
  );
}
