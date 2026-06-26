'use client';
import { useEffect, useState } from 'react';
import { api, ApiError } from '@/lib/api';
import { useToast } from '@/context/ToastContext';
import { Badge } from '@/components/ui/Badge';

interface Coupon {
  id: string;
  code: string;
  type: 'percent' | 'fixed';
  value: number;
  minOrderValue: number;
  maxUses: number | null;
  usedCount: number;
  expiresAt: string | null;
  isActive: boolean;
}

const EMPTY = { code: '', type: 'percent' as 'percent' | 'fixed', value: 10, minOrderValue: 0, maxUses: '', isActive: true };

export default function AdminCoupons() {
  const { notify } = useToast();
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [form, setForm] = useState({ ...EMPTY });

  const load = () => api.get<{ coupons: Coupon[] }>('/admin/coupons').then((r) => setCoupons(r.coupons)).catch(() => undefined);
  useEffect(() => { void load(); }, []);

  const create = async () => {
    try {
      await api.post('/admin/coupons', {
        code: form.code,
        type: form.type,
        value: Number(form.value),
        minOrderValue: Number(form.minOrderValue),
        maxUses: form.maxUses ? Number(form.maxUses) : null,
        isActive: form.isActive,
      });
      notify('Coupon created', 'success');
      setForm({ ...EMPTY });
      load();
    } catch (err) {
      notify(err instanceof ApiError ? err.message : 'Could not create coupon', 'error');
    }
  };

  const toggle = async (c: Coupon) => {
    await api.patch(`/admin/coupons/${c.id}`, {
      code: c.code, type: c.type, value: c.value, minOrderValue: c.minOrderValue, maxUses: c.maxUses, isActive: !c.isActive,
    }).catch(() => undefined);
    load();
  };

  const remove = async (id: string) => {
    if (!confirm('Delete this coupon?')) return;
    await api.del(`/admin/coupons/${id}`).catch(() => undefined);
    load();
  };

  return (
    <div className="p-6 lg:p-8">
      <h1 className="text-2xl font-bold text-ink">Coupons</h1>
      <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_22rem]">
        <div className="card overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-left text-muted">
                <th className="px-4 py-3 font-medium">Code</th>
                <th className="px-4 py-3 font-medium">Discount</th>
                <th className="px-4 py-3 font-medium">Min order</th>
                <th className="px-4 py-3 font-medium">Used</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody>
              {coupons.map((c) => (
                <tr key={c.id} className="border-b border-border last:border-0">
                  <td className="px-4 py-3 font-mono font-medium text-ink">{c.code}</td>
                  <td className="px-4 py-3 text-ink">{c.type === 'percent' ? `${c.value}%` : `₹${c.value}`}</td>
                  <td className="px-4 py-3 text-muted">₹{c.minOrderValue}</td>
                  <td className="px-4 py-3 text-muted">{c.usedCount}{c.maxUses ? ` / ${c.maxUses}` : ''}</td>
                  <td className="px-4 py-3"><Badge tone={c.isActive ? 'success' : 'neutral'}>{c.isActive ? 'Active' : 'Off'}</Badge></td>
                  <td className="px-4 py-3 text-right">
                    <button onClick={() => toggle(c)} className="text-primary hover:underline">{c.isActive ? 'Disable' : 'Enable'}</button>
                    <button onClick={() => remove(c.id)} className="ml-3 text-danger hover:underline">Delete</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="card h-fit space-y-3 p-6">
          <h2 className="font-semibold text-ink">New coupon</h2>
          <div>
            <label className="label">Code</label>
            <input className="input font-mono" value={form.code} onChange={(e) => setForm((f) => ({ ...f, code: e.target.value.toUpperCase() }))} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">Type</label>
              <select className="input" value={form.type} onChange={(e) => setForm((f) => ({ ...f, type: e.target.value as 'percent' | 'fixed' }))}>
                <option value="percent">Percent</option>
                <option value="fixed">Fixed ₹</option>
              </select>
            </div>
            <div>
              <label className="label">Value</label>
              <input type="number" className="input" value={form.value} onChange={(e) => setForm((f) => ({ ...f, value: Number(e.target.value) }))} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">Min order ₹</label>
              <input type="number" className="input" value={form.minOrderValue} onChange={(e) => setForm((f) => ({ ...f, minOrderValue: Number(e.target.value) }))} />
            </div>
            <div>
              <label className="label">Max uses</label>
              <input type="number" className="input" placeholder="∞" value={form.maxUses} onChange={(e) => setForm((f) => ({ ...f, maxUses: e.target.value }))} />
            </div>
          </div>
          <button onClick={create} disabled={!form.code} className="btn-primary w-full">Create coupon</button>
        </div>
      </div>
    </div>
  );
}
