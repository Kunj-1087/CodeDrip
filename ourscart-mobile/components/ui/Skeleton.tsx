import React, { useEffect, useRef, useState } from 'react';
import { Animated, View, StyleSheet, Easing, type ViewStyle, type DimensionValue } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../../context/ThemeContext';
import { Radius } from '../../constants/radius';
import { Space } from '../../constants/spacing';

interface SkeletonProps {
  width?: DimensionValue;
  height?: number;
  radius?: number;
  style?: ViewStyle;
}

export function Skeleton({ width = '100%', height = 16, radius = Radius.sm, style }: SkeletonProps) {
  const { colors } = useTheme();
  const shimmer = useRef(new Animated.Value(0)).current;
  const [layoutWidth, setLayoutWidth] = useState(300);

  useEffect(() => {
    const loop = Animated.loop(
      Animated.timing(shimmer, {
        toValue: 1,
        duration: 1400,
        easing: Easing.inOut(Easing.ease),
        useNativeDriver: true,
      })
    );
    loop.start();
    return () => loop.stop();
  }, [shimmer]);

  const translateX = shimmer.interpolate({
    inputRange: [0, 1],
    outputRange: [-layoutWidth, layoutWidth],
  });

  return (
    <View
      onLayout={(e) => {
        const w = e.nativeEvent.layout.width;
        if (w > 0) setLayoutWidth(w);
      }}
      style={[
        {
          width,
          height,
          borderRadius: radius,
          backgroundColor: colors.bgTertiary,
          overflow: 'hidden',
        },
        style,
      ]}
    >
      <Animated.View
        style={[
          StyleSheet.absoluteFill,
          {
            width: '100%',
            transform: [{ translateX }],
          },
        ]}
      >
        <LinearGradient
          colors={[colors.bgTertiary, colors.bgSecondary, colors.bgTertiary]}
          start={{ x: 0, y: 0.5 }}
          end={{ x: 1, y: 0.5 }}
          style={StyleSheet.absoluteFill}
        />
      </Animated.View>
    </View>
  );
}

/** Matches ProductCard proportions exactly for grid loading states. */
export function ProductCardSkeleton({ width }: { width?: number }) {
  return (
    <View
      style={[
        styles.card,
        width ? { width } : styles.flexCard,
      ]}
    >
      {/* Image Area Aspect Ratio 1:1 */}
      <Skeleton width="100%" style={styles.imageSkeleton} radius={Radius.lg} />
      
      {/* Info Section padding: sp3 (12) */}
      <View style={styles.bodySkeleton}>
        {/* Brand */}
        <Skeleton width="40%" height={10} style={{ marginBottom: Space[1] }} />
        
        {/* Name (2 lines) */}
        <Skeleton width="90%" height={14} style={{ marginBottom: 4 }} />
        <Skeleton width="65%" height={14} style={{ marginBottom: Space[2] }} />
        
        {/* Spec Pills Row */}
        <View style={styles.row}>
          <Skeleton width={50} height={18} radius={Radius.sm} style={{ marginRight: Space[2] }} />
          <Skeleton width={60} height={18} radius={Radius.sm} />
        </View>
        
        {/* Rating Row */}
        <Skeleton width={80} height={12} style={{ marginTop: Space[2], marginBottom: Space[2] }} />
        
        {/* Price Row */}
        <Skeleton width={70} height={20} style={{ marginBottom: Space[2] }} />
        
        {/* Add to Cart button */}
        <Skeleton width="100%" height={36} radius={Radius.md} style={{ marginTop: Space[2] }} />
      </View>
    </View>
  );
}

/** Matches a 48px thumbnail row + 3 lines of text */
export function ListRowSkeleton() {
  return (
    <View style={styles.listRow}>
      <Skeleton width={48} height={48} radius={Radius.md} />
      <View style={styles.listRowBody}>
        <Skeleton width="75%" height={12} style={{ marginBottom: 6 }} />
        <Skeleton width="50%" height={10} style={{ marginBottom: 6 }} />
        <Skeleton width="30%" height={10} />
      </View>
    </View>
  );
}

/** Renders n lines of shimmering text skeleton */
export function TextSkeleton({ lines = 3 }: { lines?: number }) {
  return (
    <View>
      {Array.from({ length: lines }).map((_, i) => (
        <Skeleton
          key={i}
          width={i === lines - 1 ? '60%' : '100%'}
          height={12}
          style={{ marginBottom: Space[2] }}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: '#E8E7E3', // borderSubtle color default fallback
    backgroundColor: '#FFFFFF',
    overflow: 'hidden',
  },
  flexCard: { flex: 1 },
  imageSkeleton: { width: '100%', aspectRatio: 1 },
  bodySkeleton: { padding: Space[3] },
  row: { flexDirection: 'row', alignItems: 'center', marginBottom: Space[2] },
  listRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: Space[4], paddingHorizontal: Space[4] },
  listRowBody: { flex: 1, marginLeft: Space[4] },
  detailInfo: { padding: Space[4] },
  detailSpecsRow: { flexDirection: 'row', gap: Space[2], marginTop: Space[3], marginBottom: Space[3] },
});

export function ProductDetailSkeleton() {
  return (
    <View style={styles.flexCard}>
      {/* Gallery area */}
      <Skeleton width="100%" style={{ aspectRatio: 1 }} radius={0} />
      
      {/* Info Section padding sp4 */}
      <View style={styles.detailInfo}>
        {/* Brand */}
        <Skeleton width={60} height={12} style={{ marginTop: Space[4] }} />
        
        {/* Name */}
        <Skeleton width="90%" height={24} style={{ marginTop: Space[1], marginBottom: 6 }} />
        <Skeleton width="60%" height={24} style={{ marginBottom: Space[3] }} />
        
        {/* Spec pills row */}
        <View style={styles.detailSpecsRow}>
          <Skeleton width={50} height={20} radius={Radius.sm} />
          <Skeleton width={50} height={20} radius={Radius.sm} />
          <Skeleton width={50} height={20} radius={Radius.sm} />
        </View>
        
        {/* Rating row */}
        <Skeleton width={120} height={16} style={{ marginTop: Space[3] }} />
        
        <View style={{ height: 1, backgroundColor: '#E8E7E3', marginVertical: Space[4] }} />
        
        {/* Price row */}
        <Skeleton width={140} height={32} style={{ marginTop: Space[2] }} />
      </View>
    </View>
  );
}
