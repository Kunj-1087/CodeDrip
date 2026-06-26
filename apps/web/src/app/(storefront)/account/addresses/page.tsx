'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { api } from '@/lib/api';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/context/ToastContext';
import { Modal } from '@/components/ui/Modal';
import { Badge } from '@/components/ui/Badge';
import { Skeleton } from '@/components/ui/Skeleton';

// Address book. Matches the /addresses API exactly (label, line1, line2, city,
// state, postalCode, country, isDefault). Setting one default unsets the rest —
// the server enforces that, we just reflect it after each write.
interface Address {
  id: string;
  label: string | null;
  line1: string;
  line2: string | null;
  city: string;
  state: string | null;
  postalCode: string | null;
  country: string;
  isDefault: boolean;
}

const EMPTY = { label: '', line1: '', line2: '', city: '', state: '', postalCode: '', country: 'India', isDefault: false };

export default function AddressesPage() {
  const { status } = useAuth();
  const { notify } = useToast();
  const [addresses, setAddresses] = useState<Address[] | null>(null);
  const [editing, setEditing] = useState<Address | null>(null);
  const [form, setForm] = useState({ ...EMPTY });
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);

  const load = () => api.get<{ addresses: Address[] }>('/addresses').then((r) => setAddresses(r.addresses)).catch(() => setAddresses([]));

  useEffect(() => {
    if (status === 'authenticated') load();
    else if (status === 'anonymous') setAddresses([]);
  }, [status]);

  const openAdd = () => {
    setEditing(null);
    setForm({ ...EMPTY });
    setOpen(true);
  };
  const openEdit = (a: Address) => {
    setEditing(a);
    setForm({
      label: a.label ?? '',
      line1: a.line1,
      line2: a.line2 ?? '',
      city: a.city,
      state: a.state ?? '',
      postalCode: a.postalCode ?? '',
      country: a.country,
      isDefault: a.isDefault,
    });
    setOpen(true);
  };

  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm((f) => ({ ...f, [k]: k === 'isDefault' ? e.target.checked : e.target.value }));

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    // Only send optional fields when filled, so we don't write empty strings.
    const body = {
      label: form.label || undefined,
      line1: form.line1,
      line2: form.line2 || undefined,
      city: form.city,
      state: form.state || undefined,
      postalCode: form.postalCode || undefined,
      country: form.country || 'India',
      isDefault: form.isDefault,
    };
    try {
      if (editing) await api.patch(`/addresses/${editing.id}`, body);
      else await api.post('/addresses', body);
      notify(editing ? 'Address updated.' : 'Address saved.', 'success');
      setOpen(false);
      await load();
    } catch {
      notify('Could not save that address. Check the required fields and try again.', 'error');
    } finally {
      setSaving(false);
    }
  };

  const makeDefault = async (a: Address) => {
    try {
      await api.patch(`/addresses/${a.id}`, {
        label: a.label ?? undefined,
        line1: a.line1,
        line2: a.line2 ?? undefined,
        city: a.city,
        state: a.state ?? undefined,
        postalCode: a.postalCode ?? undefined,
        country: a.country,
        isDefault: true,
      });
      await load();
    } catch {
      notify('Could not update your default address.', 'error');
    }
  };

  const remove = async (a: Address) => {
    try {
      await api.del(`/addresses/${a.id}`);
      notify('Address removed.', 'success');
      await load();
    } catch {
      notify('Could not remove that address.', 'error');
    }
  };

  if (status === 'anonymous') {
    return (
      <div className="container-px py-16 text-center">
        <h1 className="text-2xl font-bold text-ink">Sign in to manage addresses</h1>
        <p className="mt-2 text-muted">Your saved addresses make checkout a one-tap affair.</p>
        <Link href="/auth/login?redirect=/account/addresses" className="btn-primary mt-6 inline-flex">
          Sign in
        </Link>
      </div>
    );
  }

  return (
    <div className="container-px py-10">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-ink">Your addresses</h1>
          <p className="text-sm text-muted">Where we ship your parts. Set a default to skip a step at checkout.</p>
        </div>
        <button onClick={openAdd} className="btn bg-gradient-to-r from-primary to-accent hover:from-primary-hover hover:to-accent text-white h-11 flex items-center justify-center font-mono text-xs rounded-xl shadow-md transition-all active:scale-[0.98] px-5">
          Add address
        </button>
      </div>

      <div className="mt-6">
        {addresses === null ? (
          <div className="grid gap-4 sm:grid-cols-2">
            <Skeleton className="h-36 w-full" />
            <Skeleton className="h-36 w-full" />
          </div>
        ) : addresses.length === 0 ? (
          <div className="card p-12 text-center bg-surface-2 border-border rounded-2xl">
            <p className="text-lg font-semibold text-ink font-mono">// empty_address_book</p>
            <p className="mx-auto mt-2 max-w-md text-sm text-muted font-sans leading-relaxed">
              Add the address you want parts delivered to and it’ll be ready to pick at checkout.
            </p>
            <button onClick={openAdd} className="btn bg-gradient-to-r from-primary to-accent hover:from-primary-hover hover:to-accent text-white h-11 inline-flex items-center justify-center font-mono text-xs rounded-xl shadow-md transition-all active:scale-[0.98] mt-5 px-6">
              Add your first address
            </button>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2">
            {addresses.map((a) => (
              <div key={a.id} className="card flex flex-col p-5 bg-surface-2 border-border rounded-2xl">
                <div className="flex items-start justify-between gap-2">
                  <p className="font-semibold text-ink font-mono text-sm">{a.label || 'Address'}</p>
                  {a.isDefault && <Badge tone="brand">Default</Badge>}
                </div>
                <address className="mt-3 flex-1 text-xs not-italic leading-relaxed text-muted font-mono">
                  {a.line1}
                  {a.line2 ? `, ${a.line2}` : ''}
                  <br />
                  {[a.city, a.state, a.postalCode].filter(Boolean).join(', ')}
                  <br />
                  {a.country}
                </address>
                <div className="mt-5 flex items-center gap-4 text-xs font-mono">
                  <button onClick={() => openEdit(a)} className="text-primary hover:underline">
                    [Edit]
                  </button>
                  {!a.isDefault && (
                    <button onClick={() => makeDefault(a)} className="text-muted hover:text-ink">
                      [Make default]
                    </button>
                  )}
                  <button onClick={() => remove(a)} className="ml-auto text-danger hover:underline">
                    [Remove]
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <Modal open={open} onClose={() => setOpen(false)} title={editing ? 'Edit Address' : 'Add Address'}>
        <form onSubmit={save} className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <label className="text-[10px] font-mono text-muted uppercase tracking-wider block mb-1" htmlFor="label">Label (optional) — e.g. Home, Office</label>
            <input id="label" className="input h-[52px] font-mono" value={form.label} onChange={set('label')} />
          </div>
          <div className="sm:col-span-2">
            <label className="text-[10px] font-mono text-muted uppercase tracking-wider block mb-1" htmlFor="line1">Address line 1</label>
            <input id="line1" className="input h-[52px] font-mono" autoComplete="address-line1" required value={form.line1} onChange={set('line1')} />
          </div>
          <div className="sm:col-span-2">
            <label className="text-[10px] font-mono text-muted uppercase tracking-wider block mb-1" htmlFor="line2">Address line 2 (optional)</label>
            <input id="line2" className="input h-[52px] font-mono" autoComplete="address-line2" value={form.line2} onChange={set('line2')} />
          </div>
          <div>
            <label className="text-[10px] font-mono text-muted uppercase tracking-wider block mb-1" htmlFor="city">City</label>
            <input id="city" className="input h-[52px] font-mono" autoComplete="address-level2" required value={form.city} onChange={set('city')} />
          </div>
          <div>
            <label className="text-[10px] font-mono text-muted uppercase tracking-wider block mb-1" htmlFor="state">State</label>
            <input id="state" className="input h-[52px] font-mono" autoComplete="address-level1" value={form.state} onChange={set('state')} />
          </div>
          <div>
            <label className="text-[10px] font-mono text-muted uppercase tracking-wider block mb-1" htmlFor="postalCode">PIN code</label>
            <input id="postalCode" className="input h-[52px] font-mono" autoComplete="postal-code" inputMode="numeric" pattern="[0-9]*" value={form.postalCode} onChange={set('postalCode')} />
          </div>
          <div>
            <label className="text-[10px] font-mono text-muted uppercase tracking-wider block mb-1" htmlFor="country">Country</label>
            <input id="country" className="input h-[52px] font-mono" autoComplete="country-name" value={form.country} onChange={set('country')} />
          </div>
          <label className="flex items-center gap-2 sm:col-span-2 cursor-pointer py-1">
            <input type="checkbox" checked={form.isDefault} onChange={set('isDefault')} className="h-4 w-4 accent-primary rounded border-white/10 bg-black/20" />
            <span className="text-xs font-mono text-ink">Use as my default shipping address</span>
          </label>
          <div className="sm:col-span-2 flex flex-col-reverse sm:flex-row justify-end gap-3 mt-4">
            <button type="button" onClick={() => setOpen(false)} className="btn border border-white/10 bg-black/20 text-white hover:bg-white/[0.05] w-full sm:w-auto h-12 flex items-center justify-center font-mono text-xs rounded-xl transition-all active:scale-[0.98]">
              Cancel
            </button>
            <button className="btn bg-gradient-to-r from-primary to-accent hover:from-primary-hover hover:to-accent text-white w-full sm:w-auto h-12 flex items-center justify-center font-mono text-xs rounded-xl shadow-md transition-all active:scale-[0.98] disabled:opacity-40" disabled={saving}>
              {saving ? 'Compiling…' : editing ? 'Save changes' : 'Add address'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
