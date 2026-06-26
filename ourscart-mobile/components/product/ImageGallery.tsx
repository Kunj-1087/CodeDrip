import React, { useRef, useState } from 'react';
import {
  View,
  Pressable,
  StyleSheet,
  FlatList,
  Modal,
  useWindowDimensions,
  type NativeSyntheticEvent,
  type NativeScrollEvent,
} from 'react-native';
import { Image } from 'expo-image';
import ImageViewer from 'react-native-image-zoom-viewer';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../../context/ThemeContext';
import { Space } from '../../constants/spacing';
import { resolveAssetUrl } from '../../lib/api';
import type { ProductImage } from '../../types';
import { Badge } from '../ui/Badge';

interface ImageGalleryProps {
  images: ProductImage[];
  fallbackUrl: string | null;
}

const BLUR = 'L6PZfSi_.AyE_3t7t7R**0o#DgR4';

export function ImageGallery({ images, fallbackUrl }: ImageGalleryProps) {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const [index, setIndex] = useState(0);
  const [zoomOpen, setZoomOpen] = useState(false);
  const listRef = useRef<FlatList<ProductImage>>(null);

  const slides: ProductImage[] =
    images.length > 0
      ? images
      : [{ id: 'placeholder', url: fallbackUrl ?? '', altText: null, sortOrder: 0, isPrimary: true }];

  const onScroll = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const next = Math.round(e.nativeEvent.contentOffset.x / width);
    if (next !== index) setIndex(next);
  };

  const zoomUrls = slides.map((s) => ({ url: resolveAssetUrl(s.url) ?? '' }));

  return (
    <View style={[styles.container, { backgroundColor: colors.bgTertiary }]}>
      <View style={styles.imageArea}>
        <FlatList
          ref={listRef}
          data={slides}
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          keyExtractor={(item) => item.id}
          onScroll={onScroll}
          scrollEventThrottle={16}
          windowSize={3}
          maxToRenderPerBatch={3}
          initialNumToRender={2}
          removeClippedSubviews={true}
          renderItem={({ item }) => (
            <Pressable onPress={() => setZoomOpen(true)} style={{ width }}>
              <Image
                source={resolveAssetUrl(item.url)}
                placeholder={BLUR}
                contentFit="cover"
                transition={200}
                style={{ width, height: width }}
              />
            </Pressable>
          )}
        />

        {slides.length > 1 ? (
          <Badge
            label={`${index + 1} / ${slides.length}`}
            variant="neutral"
            style={styles.countBadge}
          />
        ) : null}
      </View>

      {/* Page dots centered below image */}
      {slides.length > 1 ? (
        <View style={styles.dotsContainer}>
          {slides.map((s, i) => (
            <View
              key={s.id}
              style={[
                styles.dot,
                {
                  backgroundColor: i === index ? colors.brandPrimary : colors.borderDefault,
                },
              ]}
            />
          ))}
        </View>
      ) : null}

      <Modal visible={zoomOpen} transparent onRequestClose={() => setZoomOpen(false)}>
        <ImageViewer
          imageUrls={zoomUrls}
          index={index}
          enableSwipeDown
          onSwipeDown={() => setZoomOpen(false)}
          onCancel={() => setZoomOpen(false)}
          backgroundColor="rgba(0,0,0,0.96)"
          renderIndicator={() => <View />}
        />
        <Pressable
          onPress={() => setZoomOpen(false)}
          style={[styles.close, { top: insets.top + Space[2] }]}
          hitSlop={12}
        >
          <Ionicons name="close" size={28} color="#FFFFFF" />
        </Pressable>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
  },
  imageArea: {
    position: 'relative',
    width: '100%',
    aspectRatio: 1,
  },
  countBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    zIndex: 3,
  },
  dotsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 6,
    paddingVertical: Space[3],
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  close: { position: 'absolute', right: Space[4] },
});
