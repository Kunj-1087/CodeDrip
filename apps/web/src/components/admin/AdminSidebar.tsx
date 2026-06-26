'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { Logo } from '@/components/ui/Logo';
import { cn } from '@/lib/cn';

const LINKS = [
  { href: '/admin', label: 'Dashboard', exact: true },
  { href: '/admin/products', label: 'Products' },
  { href: '/admin/inventory', label: 'Inventory' },
  { href: '/admin/orders', label: 'Orders' },
  { href: '/admin/customers', label: 'Customers' },
  { href: '/admin/categories', label: 'Categories' },
  { href: '/admin/coupons', label: 'Coupons' },
  { href: '/admin/settings', label: 'Settings' },
  { href: '/admin/seo', label: 'SEO Diagnostics' },
];

export function AdminSidebar() {
  const pathname = usePathname();
  const { logout } = useAuth();

  return (
    <aside className="flex w-[220px] flex-shrink-0 flex-col border-r border-border bg-surface-2">
      <div className="flex h-16 items-center gap-2 border-b border-border px-5">
        <Logo size="md" />
        <span className="rounded-sm bg-primary-light px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-primary">
          Admin
        </span>
      </div>

      <nav className="flex-1 space-y-1 p-3">
        {LINKS.map((l) => {
          const active = l.exact ? pathname === l.href : pathname.startsWith(l.href);
          return (
            <Link
              key={l.href}
              href={l.href}
              aria-current={active ? 'page' : undefined}
              className={cn(
                'relative block rounded-md px-3 py-2 text-sm font-medium transition-colors',
                active
                  ? // Active: tinted brand surface, brand text, and a 3px left accent rail.
                    "bg-primary-light text-primary before:absolute before:left-0 before:top-1/2 before:h-5 before:w-[3px] before:-translate-y-1/2 before:rounded-full before:bg-primary before:content-['']"
                  : 'text-muted hover:bg-surface-3 hover:text-ink',
              )}
            >
              {l.label}
            </Link>
          );
        })}
      </nav>

      <div className="space-y-1 border-t border-border p-3">
        <Link href="/" className="block rounded-md px-3 py-2 text-sm text-muted transition-colors hover:bg-surface-3 hover:text-ink">
          ← View storefront
        </Link>
        <button
          onClick={() => logout()}
          className="block w-full rounded-md px-3 py-2 text-left text-sm text-danger transition-colors hover:bg-surface-3"
        >
          Sign out
        </button>
      </div>
    </aside>
  );
}
