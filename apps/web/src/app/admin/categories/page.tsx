'use client';
import { useEffect, useState } from 'react';
import { api, ApiError } from '@/lib/api';
import { useToast } from '@/context/ToastContext';

interface Cat {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  is_active: boolean;
  sort_order: number;
}

const EMPTY = { name: '', slug: '', description: '', sortOrder: 0, isActive: true };

export default function AdminCategories() {
  const { notify } = useToast();
  const [cats, setCats] = useState<Cat[]>([]);
  const [form, setForm] = useState({ ...EMPTY });
  const [editingId, setEditingId] = useState<string | null>(null);

  const load = () => api.get<{ categories: Cat[] }>('/admin/categories').then((r) => setCats(r.categories)).catch(() => undefined);
  useEffect(() => { void load(); }, []);

  const slugify = (s: string) => s.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');

  const save = async () => {
    const payload = { ...form, slug: form.slug || slugify(form.name), description: form.description || undefined };
    try {
      if (editingId) await api.patch(`/admin/categories/${editingId}`, payload);
      else await api.post('/admin/categories', payload);
      notify(editingId ? 'Category updated' : 'Category created', 'success');
      setForm({ ...EMPTY });
      setEditingId(null);
      load();
    } catch (err) {
      notify(err instanceof ApiError ? err.message : 'Could not save category', 'error');
    }
  };

  const edit = (c: Cat) => {
    setEditingId(c.id);
    setForm({ name: c.name, slug: c.slug, description: c.description ?? '', sortOrder: c.sort_order, isActive: c.is_active });
  };

  const remove = async (id: string) => {
    if (!confirm('Delete this category?')) return;
    try {
      await api.del(`/admin/categories/${id}`);
      notify('Category deleted', 'success');
      load();
    } catch (err) {
      notify(err instanceof ApiError ? err.message : 'Could not delete', 'error');
    }
  };

  return (
    <div className="p-6 lg:p-8">
      <h1 className="text-2xl font-bold text-ink">Categories</h1>
      <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_20rem]">
        <div className="card overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-left text-muted">
                <th className="px-4 py-3 font-medium">Name</th>
                <th className="px-4 py-3 font-medium">Slug</th>
                <th className="px-4 py-3 font-medium">Order</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody>
              {cats.map((c) => (
                <tr key={c.id} className="border-b border-border last:border-0">
                  <td className="px-4 py-3 font-medium text-ink">{c.name}{!c.is_active && <span className="ml-2 text-xs text-muted">(hidden)</span>}</td>
                  <td className="px-4 py-3 text-muted">{c.slug}</td>
                  <td className="px-4 py-3 text-muted">{c.sort_order}</td>
                  <td className="px-4 py-3 text-right">
                    <button onClick={() => edit(c)} className="text-primary hover:underline">Edit</button>
                    <button onClick={() => remove(c.id)} className="ml-3 text-danger hover:underline">Delete</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="card h-fit space-y-3 p-6">
          <h2 className="font-semibold text-ink">{editingId ? 'Edit category' : 'New category'}</h2>
          <div>
            <label className="label">Name</label>
            <input className="input" value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} />
          </div>
          <div>
            <label className="label">Slug</label>
            <input className="input" placeholder={slugify(form.name)} value={form.slug} onChange={(e) => setForm((f) => ({ ...f, slug: e.target.value }))} />
          </div>
          <div>
            <label className="label">Description</label>
            <textarea className="input" value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} />
          </div>
          <div>
            <label className="label">Sort order</label>
            <input type="number" className="input" value={form.sortOrder} onChange={(e) => setForm((f) => ({ ...f, sortOrder: Number(e.target.value) }))} />
          </div>
          <label className="flex items-center gap-2 text-sm text-ink">
            <input type="checkbox" checked={form.isActive} onChange={(e) => setForm((f) => ({ ...f, isActive: e.target.checked }))} /> Active
          </label>
          <div className="flex gap-2">
            <button onClick={save} disabled={!form.name} className="btn-primary flex-1">{editingId ? 'Update' : 'Create'}</button>
            {editingId && <button onClick={() => { setEditingId(null); setForm({ ...EMPTY }); }} className="btn-ghost">Cancel</button>}
          </div>
        </div>
      </div>
    </div>
  );
}
