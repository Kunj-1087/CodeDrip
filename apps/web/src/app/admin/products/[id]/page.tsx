'use client';
import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { api, ApiError } from '@/lib/api';
import { useToast } from '@/context/ToastContext';
import type { Category } from '@/types';

interface Form {
  name: string;
  slug: string;
  categoryId: string;
  brand: string;
  sku: string;
  basePrice: number;
  compareAtPrice: number | null;
  stockQuantity: number;
  shortDescription: string;
  description: string;
  isActive: boolean;
  isFeatured: boolean;
}
interface SpecRow {
  key: string;
  value: string;
}
interface Img {
  id: string;
  url: string;
}
interface Variant {
  id: string;
  name: string;
  price_modifier?: string;
  stock_quantity?: number;
}

const EMPTY: Form = {
  name: '', slug: '', categoryId: '', brand: '', sku: '', basePrice: 0, compareAtPrice: null,
  stockQuantity: 0, shortDescription: '', description: '', isActive: true, isFeatured: false,
};

export default function ProductEditor() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const { notify } = useToast();
  const isNew = params.id === 'new';

  const [form, setForm] = useState<Form>(EMPTY);
  const [specs, setSpecs] = useState<SpecRow[]>([{ key: '', value: '' }]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [images, setImages] = useState<Img[]>([]);
  const [variants, setVariants] = useState<Variant[]>([]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    api.get<{ categories: Category[] }>('/categories').then((r) => setCategories(r.categories)).catch(() => undefined);
    if (isNew) return;
    api
      .get<{ product: Record<string, unknown>; images: Img[]; variants: Variant[] }>(`/admin/products/${params.id}`)
      .then((r) => {
        const p = r.product as Record<string, unknown>;
        setForm({
          name: String(p.name ?? ''),
          slug: String(p.slug ?? ''),
          categoryId: String(p.category_id ?? ''),
          brand: String(p.brand ?? ''),
          sku: String(p.sku ?? ''),
          basePrice: Number(p.base_price ?? 0),
          compareAtPrice: p.compare_at_price !== null ? Number(p.compare_at_price) : null,
          stockQuantity: Number(p.stock_quantity ?? 0),
          shortDescription: String(p.short_description ?? ''),
          description: String(p.description ?? ''),
          isActive: Boolean(p.is_active),
          isFeatured: Boolean(p.is_featured),
        });
        const sp = (p.specs ?? {}) as Record<string, string>;
        const rows = Object.entries(sp).map(([key, value]) => ({ key, value: String(value) }));
        setSpecs(rows.length ? rows : [{ key: '', value: '' }]);
        setImages(r.images);
        setVariants(r.variants);
      })
      .catch(() => notify('Could not load product', 'error'));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params.id]);

  const set = <K extends keyof Form>(k: K, v: Form[K]) => setForm((f) => ({ ...f, [k]: v }));
  const autoSlug = (name: string) =>
    name.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');

  const save = async () => {
    setSaving(true);
    const specsObj = Object.fromEntries(specs.filter((s) => s.key.trim()).map((s) => [s.key.trim(), s.value]));
    const payload = {
      name: form.name,
      slug: form.slug || autoSlug(form.name),
      categoryId: form.categoryId,
      brand: form.brand || undefined,
      sku: form.sku || undefined,
      basePrice: Number(form.basePrice),
      compareAtPrice: form.compareAtPrice ? Number(form.compareAtPrice) : null,
      stockQuantity: Number(form.stockQuantity),
      shortDescription: form.shortDescription || undefined,
      description: form.description || undefined,
      isActive: form.isActive,
      isFeatured: form.isFeatured,
      specs: specsObj,
    };
    try {
      if (isNew) {
        const res = await api.post<{ id: string }>('/admin/products', payload);
        notify('Product created — add images next', 'success');
        router.replace(`/admin/products/${res.id}`);
      } else {
        await api.patch(`/admin/products/${params.id}`, payload);
        notify('Product saved', 'success');
      }
    } catch (err) {
      notify(err instanceof ApiError ? err.message : 'Could not save product', 'error');
    } finally {
      setSaving(false);
    }
  };

  const uploadImages = async (files: FileList | null) => {
    if (!files || files.length === 0 || isNew) return;
    const fd = new FormData();
    Array.from(files).slice(0, 8).forEach((f) => fd.append('images', f));
    try {
      const res = await api.upload<{ images: Img[] }>(`/admin/products/${params.id}/images`, fd);
      setImages((cur) => [...cur, ...res.images]);
      notify('Images uploaded', 'success');
    } catch (err) {
      notify(err instanceof ApiError ? err.message : 'Upload failed', 'error');
    }
  };

  const deleteImage = async (imageId: string) => {
    await api.del(`/admin/products/${params.id}/images/${imageId}`).catch(() => undefined);
    setImages((cur) => cur.filter((i) => i.id !== imageId));
  };

  return (
    <div className="p-6 lg:p-8">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-ink">{isNew ? 'New product' : 'Edit product'}</h1>
        <button onClick={save} disabled={saving || !form.name || !form.categoryId} className="btn-primary">
          {saving ? 'Saving…' : 'Save product'}
        </button>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Main fields */}
        <div className="space-y-4 lg:col-span-2">
          <div className="card space-y-4 p-6">
            <div>
              <label className="label">Name</label>
              <input className="input" value={form.name} onChange={(e) => set('name', e.target.value)} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="label">Slug</label>
                <input className="input" placeholder={autoSlug(form.name)} value={form.slug} onChange={(e) => set('slug', e.target.value)} />
              </div>
              <div>
                <label className="label">SKU</label>
                <input className="input" value={form.sku} onChange={(e) => set('sku', e.target.value)} />
              </div>
            </div>
            <div>
              <label className="label">Short description</label>
              <input className="input" value={form.shortDescription} onChange={(e) => set('shortDescription', e.target.value)} />
            </div>
            <div>
              <label className="label">Description</label>
              <textarea className="input min-h-[120px]" value={form.description} onChange={(e) => set('description', e.target.value)} />
            </div>
          </div>

          {/* Specs */}
          <div className="card p-6">
            <div className="mb-3 flex items-center justify-between">
              <h2 className="font-semibold text-ink">Specifications</h2>
              <button onClick={() => setSpecs((s) => [...s, { key: '', value: '' }])} className="text-sm text-primary">+ Add row</button>
            </div>
            <div className="space-y-2">
              {specs.map((row, i) => (
                <div key={i} className="flex gap-2">
                  <input className="input" placeholder="capacity" value={row.key} onChange={(e) => setSpecs((s) => s.map((r, j) => (j === i ? { ...r, key: e.target.value } : r)))} />
                  <input className="input" placeholder="16GB" value={row.value} onChange={(e) => setSpecs((s) => s.map((r, j) => (j === i ? { ...r, value: e.target.value } : r)))} />
                  <button onClick={() => setSpecs((s) => s.filter((_, j) => j !== i))} className="btn-ghost text-red-600">×</button>
                </div>
              ))}
            </div>
          </div>

          {/* Images */}
          <div className="card p-6">
            <h2 className="mb-3 font-semibold text-ink">Images {isNew && <span className="text-sm font-normal text-muted">(save first)</span>}</h2>
            <div className="flex flex-wrap gap-3">
              {images.map((img) => (
                <div key={img.id} className="relative h-24 w-24 overflow-hidden rounded-lg border border-border">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={img.url} alt="" className="h-full w-full object-cover" />
                  <button onClick={() => deleteImage(img.id)} className="absolute right-1 top-1 rounded bg-black/60 px-1 text-xs text-white">×</button>
                </div>
              ))}
            </div>
            <input type="file" accept="image/*" multiple disabled={isNew} onChange={(e) => uploadImages(e.target.files)} className="mt-3 text-sm" />
          </div>

          {/* Variants */}
          {!isNew && <VariantsEditor productId={params.id} variants={variants} onChange={setVariants} />}
        </div>

        {/* Sidebar */}
        <div className="space-y-4">
          <div className="card space-y-4 p-6">
            <div>
              <label className="label">Category</label>
              <select className="input" value={form.categoryId} onChange={(e) => set('categoryId', e.target.value)}>
                <option value="">Select…</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="label">Brand</label>
              <input className="input" value={form.brand} onChange={(e) => set('brand', e.target.value)} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="label">Price (₹)</label>
                <input type="number" className="input" value={form.basePrice} onChange={(e) => set('basePrice', Number(e.target.value))} />
              </div>
              <div>
                <label className="label">Compare-at</label>
                <input type="number" className="input" value={form.compareAtPrice ?? ''} onChange={(e) => set('compareAtPrice', e.target.value ? Number(e.target.value) : null)} />
              </div>
            </div>
            <div>
              <label className="label">Stock</label>
              <input type="number" className="input" value={form.stockQuantity} onChange={(e) => set('stockQuantity', Number(e.target.value))} />
            </div>
            <label className="flex items-center gap-2 text-sm text-ink">
              <input type="checkbox" checked={form.isActive} onChange={(e) => set('isActive', e.target.checked)} /> Active (visible in store)
            </label>
            <label className="flex items-center gap-2 text-sm text-ink">
              <input type="checkbox" checked={form.isFeatured} onChange={(e) => set('isFeatured', e.target.checked)} /> Featured
            </label>
          </div>
        </div>
      </div>
    </div>
  );
}

function VariantsEditor({
  productId,
  variants,
  onChange,
}: {
  productId: string;
  variants: Variant[];
  onChange: (v: Variant[]) => void;
}) {
  const { notify } = useToast();
  const [name, setName] = useState('');
  const [mod, setMod] = useState(0);
  const [stock, setStock] = useState(0);

  const add = async () => {
    if (!name) return;
    try {
      const res = await api.post<{ id: string }>(`/admin/products/${productId}/variants`, {
        name, priceModifier: Number(mod), stockQuantity: Number(stock),
      });
      onChange([...variants, { id: res.id, name, price_modifier: String(mod), stock_quantity: stock }]);
      setName(''); setMod(0); setStock(0);
      notify('Variant added', 'success');
    } catch {
      notify('Could not add variant', 'error');
    }
  };
  const remove = async (id: string) => {
    await api.del(`/admin/products/${productId}/variants/${id}`).catch(() => undefined);
    onChange(variants.filter((v) => v.id !== id));
  };

  return (
    <div className="card p-6">
      <h2 className="mb-3 font-semibold text-ink">Variants</h2>
      {variants.length > 0 && (
        <ul className="mb-3 divide-y divide-border">
          {variants.map((v) => (
            <li key={v.id} className="flex items-center justify-between py-2 text-sm">
              <span className="text-ink">{v.name} <span className="text-muted">(+₹{Number(v.price_modifier ?? 0)}, stock {v.stock_quantity ?? 0})</span></span>
              <button onClick={() => remove(v.id)} className="text-red-600">Remove</button>
            </li>
          ))}
        </ul>
      )}
      <div className="grid grid-cols-[1fr_auto_auto_auto] items-end gap-2">
        <input className="input" placeholder="16GB / DDR5" value={name} onChange={(e) => setName(e.target.value)} />
        <input className="input w-24" type="number" placeholder="+₹" value={mod} onChange={(e) => setMod(Number(e.target.value))} />
        <input className="input w-20" type="number" placeholder="stock" value={stock} onChange={(e) => setStock(Number(e.target.value))} />
        <button onClick={add} className="btn-secondary">Add</button>
      </div>
    </div>
  );
}
