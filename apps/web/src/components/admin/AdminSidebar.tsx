'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useStore } from '@/context/StoreContext';
import { useAuth } from '@/context/AuthContext';

const LINKS = [
  { href: '/admin', label: 'Dashboard', exact: true },
  { href: '/admin/products', label: 'Products' },
  { href: '/admin/orders', label: 'Orders' },
  { href: '/admin/customers', label: 'Customers' },
  { href: '/admin/categories', label: 'Categories' },
  { href: '/admin/coupons', label: 'Coupons' },
  { href: '/admin/settings', label: 'Settings' },
];

export function AdminSidebar() {
  const pathname = usePathname();
  const { settings } = useStore();
  const { logout } = useAuth();

  return (
    <aside className="flex w-60 flex-shrink-0 flex-col border-r border-border bg-surface">
      <div className="flex h-16 items-center gap-2 border-b border-border px-5">
        <span className="grid h-8 w-8 place-items-center rounded-lg bg-primary text-white">
          {(settings?.storeName ?? 'O').charAt(0)}
        </span>
        <div className="leading-tight">
          <p className="text-sm font-bold text-ink">{settings?.storeName ?? 'OursCart'}</p>
          <p className="text-xs text-muted">Admin</p>
        </div>
      </div>

      <nav className="flex-1 space-y-1 p-3">
        {LINKS.map((l) => {
          const active = l.exact ? pathname === l.href : pathname.startsWith(l.href);
          return (
            <Link
              key={l.href}
              href={l.href}
              className={`block rounded-lg px-3 py-2 text-sm font-medium ${
                active ? 'bg-primary text-white' : 'text-muted hover:bg-surface-2 hover:text-ink'
              }`}
            >
              {l.label}
            </Link>
          );
        })}
      </nav>

      <div className="border-t border-border p-3">
        <Link href="/" className="block rounded-lg px-3 py-2 text-sm text-muted hover:bg-surface-2">
          ← View storefront
        </Link>
        <button onClick={() => logout()} className="block w-full rounded-lg px-3 py-2 text-left text-sm text-red-600 hover:bg-surface-2">
          Sign out
        </button>
      </div>
    </aside>
  );
}
