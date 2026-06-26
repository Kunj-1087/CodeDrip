'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { AnimatePresence, motion } from 'framer-motion';
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
  { href: '/admin/media', label: 'Media' },
  { href: '/admin/analytics', label: 'Analytics' },
  { href: '/admin/seo', label: 'SEO' },
  { href: '/admin/settings', label: 'Settings' },
];

function SidebarContent({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();
  const { logout } = useAuth();

  return (
    <>
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
              onClick={onNavigate}
              className={cn(
                'relative block rounded-md px-3 py-2 text-sm font-medium transition-colors',
                active
                  ? "bg-primary-light text-primary before:absolute before:left-0 before:top-1/2 before:h-5 before:w-[3px] before:-translate-y-1/2 before:rounded-full before:bg-primary before:content-['']"
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
          onClick={() => { logout(); onNavigate?.(); }}
          className="block w-full rounded-md px-3 py-2 text-left text-sm text-danger transition-colors hover:bg-surface-3"
        >
          Sign out
        </button>
      </div>
    </>
  );
}

export function AdminSidebar() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  return (
    <>
      {/* Mobile hamburger button */}
      <button
        onClick={() => setMobileOpen(true)}
        className="fixed left-4 top-3 z-50 flex h-10 w-10 items-center justify-center rounded-lg border border-border bg-surface text-ink shadow-sm md:hidden"
        aria-label="Open menu"
      >
        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
        </svg>
      </button>

      {/* Desktop sidebar */}
      <aside className="hidden md:flex w-[220px] flex-shrink-0 flex-col border-r border-border bg-surface-2">
        <SidebarContent />
      </aside>

      {/* Mobile overlay */}
      <AnimatePresence>
        {mobileOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="fixed inset-0 z-40 bg-black/50 md:hidden"
              onClick={() => setMobileOpen(false)}
            />
            <motion.aside
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', stiffness: 300, damping: 30 }}
              className="fixed inset-y-0 left-0 z-50 flex w-[260px] flex-col border-r border-border bg-surface-2 md:hidden"
            >
              <div className="flex h-16 items-center justify-between border-b border-border px-5">
                <div className="flex items-center gap-2">
                  <Logo size="md" />
                  <span className="rounded-sm bg-primary-light px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-primary">
                    Admin
                  </span>
                </div>
                <button
                  onClick={() => setMobileOpen(false)}
                  className="flex h-8 w-8 items-center justify-center rounded-lg text-muted hover:bg-surface-3 hover:text-ink"
                  aria-label="Close menu"
                >
                  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              <SidebarContent onNavigate={() => setMobileOpen(false)} />
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
