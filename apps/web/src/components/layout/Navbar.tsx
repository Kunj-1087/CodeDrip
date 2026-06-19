'use client';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { useStore } from '@/context/StoreContext';
import { useCart } from '@/context/CartContext';
import { useAuth } from '@/context/AuthContext';
import { useTheme } from '@/context/ThemeContext';

const NAV_LINKS = [
  { href: '/shop', label: 'All products' },
  { href: '/shop?category=ram', label: 'RAM' },
  { href: '/shop?category=ssd', label: 'SSD' },
  { href: '/shop?category=hdd', label: 'HDD' },
  { href: '/shop?category=accessories', label: 'Accessories' },
];

export function Navbar() {
  const { settings } = useStore();
  const { itemCount } = useCart();
  const { user, status, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const router = useRouter();
  const [query, setQuery] = useState('');
  const [menuOpen, setMenuOpen] = useState(false);

  const onSearch = (e: React.FormEvent) => {
    e.preventDefault();
    router.push(query.trim() ? `/shop?q=${encodeURIComponent(query.trim())}` : '/shop');
  };

  return (
    <header className="sticky top-0 z-50 border-b border-border bg-surface/90 backdrop-blur">
      <div className="container-px flex h-16 items-center gap-4">
        {/* Brand */}
        <Link href="/" className="flex items-center gap-2 font-bold text-ink">
          {settings?.logoUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={settings.logoUrl} alt={settings.storeName} className="h-8 w-auto" />
          ) : (
            <span className="grid h-8 w-8 place-items-center rounded-lg bg-primary text-white">
              {(settings?.storeName ?? 'O').charAt(0)}
            </span>
          )}
          <span className="hidden text-lg sm:inline">{settings?.storeName ?? 'OursCart'}</span>
        </Link>

        {/* Search */}
        <form onSubmit={onSearch} className="hidden flex-1 md:block" role="search">
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search RAM, SSDs, hard drives…"
            aria-label="Search products"
            className="input"
          />
        </form>

        <div className="ml-auto flex items-center gap-1">
          <button
            onClick={toggleTheme}
            className="btn-ghost px-3"
            aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
          >
            {theme === 'dark' ? '☀️' : '🌙'}
          </button>

          <Link href="/wishlist" className="btn-ghost px-3" aria-label="Wishlist">
            ♥
          </Link>

          <Link href="/cart" className="btn-ghost relative px-3" aria-label={`Cart with ${itemCount} items`}>
            <span aria-hidden>🛒</span>
            {itemCount > 0 && (
              <span className="absolute -right-0.5 -top-0.5 grid h-5 min-w-[1.25rem] place-items-center rounded-full bg-accent px-1 text-xs font-bold text-white">
                {itemCount}
              </span>
            )}
          </Link>

          {/* Account */}
          {status === 'authenticated' && user ? (
            <div className="relative">
              <button onClick={() => setMenuOpen((o) => !o)} className="btn-secondary" aria-haspopup="menu" aria-expanded={menuOpen}>
                {user.firstName ?? 'Account'}
              </button>
              {menuOpen && (
                <div
                  className="card absolute right-0 mt-2 w-48 p-1.5 animate-fade-in"
                  role="menu"
                  onMouseLeave={() => setMenuOpen(false)}
                >
                  <Link href="/profile" className="block rounded-lg px-3 py-2 text-sm hover:bg-surface-2" role="menuitem">
                    My profile
                  </Link>
                  <Link href="/orders" className="block rounded-lg px-3 py-2 text-sm hover:bg-surface-2" role="menuitem">
                    My orders
                  </Link>
                  {user.role === 'admin' && (
                    <Link href="/admin" className="block rounded-lg px-3 py-2 text-sm font-medium text-primary hover:bg-surface-2" role="menuitem">
                      Admin dashboard
                    </Link>
                  )}
                  <button
                    onClick={() => {
                      setMenuOpen(false);
                      void logout();
                    }}
                    className="block w-full rounded-lg px-3 py-2 text-left text-sm text-red-600 hover:bg-surface-2"
                    role="menuitem"
                  >
                    Sign out
                  </button>
                </div>
              )}
            </div>
          ) : (
            <Link href="/auth/login" className="btn-primary">
              Sign in
            </Link>
          )}
        </div>
      </div>

      {/* Category row */}
      <nav className="container-px hidden items-center gap-6 overflow-x-auto pb-2 text-sm md:flex" aria-label="Categories">
        {NAV_LINKS.map((l) => (
          <Link key={l.href} href={l.href} className="whitespace-nowrap text-muted hover:text-ink">
            {l.label}
          </Link>
        ))}
      </nav>
    </header>
  );
}
