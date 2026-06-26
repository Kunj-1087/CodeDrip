import React, { useCallback, useEffect, useState } from 'react';
import { View, Text, FlatList, StyleSheet, Pressable, Switch, TextInput } from 'react-native';
import { router } from 'expo-router';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../context/ThemeContext';
import { useToast } from '../../context/ToastContext';
import { SafeScreen } from '../../components/layout/SafeScreen';
import { Header } from '../../components/layout/Header';
import { Modal } from '../../components/ui/Modal';
import { Input } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';
import { ListRowSkeleton } from '../../components/ui/Skeleton';
import { EmptyState } from '../../components/ui/EmptyState';
import { useDebounce } from '../../hooks/useDebounce';
import { sanitizeSearchQuery } from '../../utils/sanitize';
import { apiGet, apiPost, apiPatch, resolveAssetUrl } from '../../lib/api';
import { formatCurrency } from '../../lib/formatters';
import { FontFamily, FontSize } from '../../constants/typography';
import { Radius } from '../../constants/radius';
import { Space } from '../../constants/spacing';
import { Shadows } from '../../constants/shadows';
import type { AdminProductRow, ProductListResponse, Category } from '../../types';

const slugify = (name: string) =>
  name.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

export default function AdminProductsScreen() {
  const { colors } = useTheme();
  const toast = useToast();

  const [search, setSearch] = useState('');
  const debounced = useDebounce(search, 350);
  const [products, setProducts] = useState<AdminProductRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [categories, setCategories] = useState<Category[]>([]);
  const [createOpen, setCreateOpen] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const qs = new URLSearchParams({ page: '1', limit: '40' });
      if (debounced.trim()) qs.set('search', debounced.trim());
      const r = await apiGet<ProductListResponse & { products: AdminProductRow[] }>(`/admin/products?${qs.toString()}`);
      setProducts(r.products);
    } catch {
      setProducts([]);
    } finally {
      setLoading(false);
    }
  }, [debounced]);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    apiGet<{ categories: Category[] }>('/categories').then((r) => setCategories(r.categories)).catch(() => undefined);
  }, []);

  const toggleActive = async (product: AdminProductRow) => {
    const next = !product.isActive;
    setProducts((prev) => prev.map((p) => (p.id === product.id ? { ...p, isActive: next } : p)));
    try {
      await apiPatch(`/admin/products/${product.id}`, { isActive: next });
    } catch (e) {
      // revert on failure
      setProducts((prev) => prev.map((p) => (p.id === product.id ? { ...p, isActive: !next } : p)));
      toast.error(e instanceof Error ? e.message : 'Update failed');
    }
  };

  return (
    <SafeScreen>
      <Header title="Products" />

      <View style={styles.searchWrap}>
        <View style={[styles.search, { backgroundColor: colors.bgSecondary, borderColor: colors.borderSubtle }]}>
          <Ionicons name="search" size={18} color={colors.textMuted} />
          <TextInput
            value={search}
            onChangeText={(t) => setSearch(sanitizeSearchQuery(t))}
            placeholder="Search products…"
            placeholderTextColor={colors.textMuted}
            style={[styles.searchInput, { color: colors.textPrimary }]}
            autoCorrect={false}
          />
        </View>
      </View>

      {loading ? (
        <View style={{ paddingHorizontal: Space[4] }}>
          {Array.from({ length: 6 }).map((_, i) => (
            <ListRowSkeleton key={i} />
          ))}
        </View>
      ) : (
        <FlatList
          data={products}
          keyExtractor={(p) => p.id}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          windowSize={5}
          maxToRenderPerBatch={8}
          updateCellsBatchingPeriod={50}
          initialNumToRender={6}
          removeClippedSubviews={true}
          scrollEventThrottle={16}
          renderItem={({ item }) => (
            <Pressable
              onPress={() => router.push(`/product/${item.slug}`)}
              style={[styles.row, { borderBottomColor: colors.borderSubtle }]}
            >
              <Image source={resolveAssetUrl(item.imageUrl)} style={[styles.thumb, { backgroundColor: colors.bgTertiary }]} contentFit="cover" />
              <View style={styles.body}>
                <Text style={[styles.name, { color: colors.textPrimary }]} numberOfLines={1}>{item.name}</Text>
                <Text style={[styles.meta, { color: colors.textMuted }]}>
                  {formatCurrency(item.basePrice)} · {item.stockQuantity} in stock
                </Text>
              </View>
              <Switch
                value={item.isActive}
                onValueChange={() => toggleActive(item)}
                trackColor={{ true: colors.brandPrimary, false: colors.borderDefault }}
                thumbColor={colors.white}
              />
            </Pressable>
          )}
          ListEmptyComponent={<EmptyState icon="cube-outline" title="No products" subtitle="Try a different search." />}
        />
      )}

      {/* FAB */}
      <Pressable onPress={() => setCreateOpen(true)} style={[styles.fab, Shadows.lg, { backgroundColor: colors.brandPrimary }]}>
        <Ionicons name="add" size={28} color="#FFFFFF" />
      </Pressable>

      <CreateProductModal
        visible={createOpen}
        onClose={() => setCreateOpen(false)}
        categories={categories}
        onCreated={load}
      />
    </SafeScreen>
  );
}

function CreateProductModal({
  visible,
  onClose,
  categories,
  onCreated,
}: {
  visible: boolean;
  onClose: () => void;
  categories: Category[];
  onCreated: () => void;
}) {
  const { colors } = useTheme();
  const toast = useToast();
  const [name, setName] = useState('');
  const [brand, setBrand] = useState('');
  const [price, setPrice] = useState('');
  const [stock, setStock] = useState('');
  const [categoryId, setCategoryId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const submit = async () => {
    if (!name.trim() || !price.trim() || !categoryId) {
      toast.warning('Name, price and category are required');
      return;
    }
    setSaving(true);
    try {
      const slug = slugify(name);
      await apiPost('/admin/products', {
        name: name.trim(),
        slug,
        sku: `${slug}-${Date.now().toString().slice(-5)}`.toUpperCase(),
        brand: brand.trim() || 'Generic',
        categoryId,
        basePrice: Number(price),
        stockQuantity: Number(stock) || 0,
        isActive: true,
        isFeatured: false,
        specs: {},
      });
      toast.success('Product created');
      setName('');
      setBrand('');
      setPrice('');
      setStock('');
      setCategoryId(null);
      onClose();
      onCreated();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Could not create product');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal visible={visible} onClose={onClose} position="bottom" title="Add Product">
      <View style={{ gap: Space[3] }}>
        <Input label="Name" value={name} onChangeText={setName} />
        <Input label="Brand" value={brand} onChangeText={setBrand} />
        <View style={{ flexDirection: 'row', gap: Space[3] }}>
          <View style={{ flex: 1 }}>
            <Input label="Price (₹)" value={price} onChangeText={setPrice} keyboardType="number-pad" />
          </View>
          <View style={{ flex: 1 }}>
            <Input label="Stock" value={stock} onChangeText={setStock} keyboardType="number-pad" />
          </View>
        </View>
        <Text style={[styles.pickerLabel, { color: colors.textSecondary }]}>Category</Text>
        <View style={styles.categoryRow}>
          {categories.map((c) => (
            <Pressable
              key={c.id}
              onPress={() => setCategoryId(c.id)}
              style={[
                styles.categoryPill,
                {
                  borderColor: categoryId === c.id ? colors.brandPrimary : colors.borderDefault,
                  backgroundColor: categoryId === c.id ? colors.brandPrimaryLight : colors.bgPrimary,
                },
              ]}
            >
              <Text style={{ fontFamily: FontFamily.medium, fontSize: FontSize.sm, color: categoryId === c.id ? colors.brandPrimary : colors.textSecondary }}>
                {c.name}
              </Text>
            </Pressable>
          ))}
        </View>
        <Button label="Create Product" onPress={submit} loading={saving} fullWidth size="lg" />
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  searchWrap: { paddingHorizontal: Space[4], paddingBottom: Space[3] },
  search: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Space[2],
    height: 44,
    borderRadius: Radius.lg,
    borderWidth: StyleSheet.hairlineWidth,
    paddingHorizontal: Space[3],
  },
  searchInput: { flex: 1, fontFamily: FontFamily.regular, fontSize: FontSize.base, padding: 0 },
  list: { paddingHorizontal: Space[4], paddingBottom: 100 },
  row: { flexDirection: 'row', alignItems: 'center', paddingVertical: Space[3], borderBottomWidth: StyleSheet.hairlineWidth },
  thumb: { width: 48, height: 48, borderRadius: Radius.md },
  body: { flex: 1, marginHorizontal: Space[3] },
  name: { fontFamily: FontFamily.semibold, fontSize: FontSize.sm },
  meta: { fontFamily: FontFamily.regular, fontSize: FontSize.xs, marginTop: 2 },
  fab: {
    position: 'absolute',
    bottom: Space[6],
    right: Space[5],
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pickerLabel: { fontFamily: FontFamily.semibold, fontSize: FontSize.sm },
  categoryRow: { flexDirection: 'row', flexWrap: 'wrap', gap: Space[2] },
  categoryPill: { borderWidth: 1, borderRadius: Radius.full, paddingHorizontal: Space[3], paddingVertical: Space[2] },
});
