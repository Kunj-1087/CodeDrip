'use client';
import Link from 'next/link';
import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import { useState, useEffect } from 'react';
import { useStore } from '@/context/StoreContext';
import { useCart } from '@/context/CartContext';
import { useAuth } from '@/context/AuthContext';
import { useTheme } from '@/context/ThemeContext';
import { Logo } from '@/components/ui/Logo';
import { cn } from '@/lib/cn';

const PLACEHOLDERS = [
  'grep react tees...',
  'grep python tees...',
  'grep javascript tees...',
  'grep ai tees...'
];

const LINKS = [
  { href: '/shop', label: '/shop', category: null },
  { href: '/shop?category=developer-t-shirts', label: 'T-Shirts', category: 'developer-t-shirts' },
  { href: '/shop?category=limited-drops', label: 'Limited Drops', category: 'limited-drops' },
  { href: '/shop?category=hoodies-outerwear', label: 'Outerwear', category: 'hoodies-outerwear' },
  { href: '/about', label: 'README.md', category: null, isAbout: true },
  { href: '/contact', label: 'Contact', category: null, isContact: true },
];

export function Navbar() {
  const { settings } = useStore();
  const { itemCount } = useCart();
  const { user, status, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const [query, setQuery] = useState('');
  const [menuOpen, setMenuOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [phIdx, setPhIdx] = useState(0);

  // Cycling placeholder timer
  useEffect(() => {
    const timer = setInterval(() => {
      setPhIdx((prev) => (prev + 1) % PLACEHOLDERS.length);
    }, 4000);
    return () => clearInterval(timer);
  }, []);

  // Keyboard shortcut Ctrl+K / Cmd+K listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        const searchInput = document.getElementById('search-input');
        searchInput?.focus();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const onSearch = (e: React.FormEvent) => {
    e.preventDefault();
    router.push(query.trim() ? `/shop?q=${encodeURIComponent(query.trim())}` : '/shop');
  };

  const isLinkActive = (l: typeof LINKS[number]) => {
    if (l.isAbout) return pathname === '/about';
    if (l.isContact) return pathname === '/contact';
    if (l.category) {
      return pathname === '/shop' && searchParams.get('category') === l.category;
    }
    if (l.href === '/shop') {
      return pathname === '/shop' && !searchParams.get('category');
    }
    return pathname === l.href;
  };

  return (
    <header className="sticky top-0 z-50 w-full font-mono">
      {/* Announcement Bar */}
      <div className="bg-[#FF4D4D] text-white text-[10px] font-mono font-bold tracking-[0.18em] uppercase flex h-9 items-center justify-center select-none text-center px-4">
        $ FREE SHIPPING ON ORDERS ABOVE ₹999
      </div>

      {/* Main Header Container */}
      <div className="bg-[#0A0A0A]/90 backdrop-blur-md border-b border-white/[0.05] h-14 md:h-[58px] flex items-center justify-between px-4 md:px-8 gap-4 text-white">
        
        {/* Left: Brand */}
        <Link href="/" className="flex items-center gap-2 hover:opacity-90 active:scale-95 transition-all" aria-label="CodeDrip Home">
          <Logo size="md" />
        </Link>

        {/* Center: Search input (Desktop) */}
        <form onSubmit={onSearch} className="hidden md:flex items-center relative flex-1 max-w-md mx-4" role="search">
          <span className="absolute left-3 text-[#FF4D4D] font-bold text-sm pointer-events-none">{`>`}</span>
          <input
            id="search-input"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={PLACEHOLDERS[phIdx]}
            aria-label="Search products"
            className="w-full bg-[#16161A] text-white pl-8 pr-16 py-1.5 text-xs font-mono border border-white/10 rounded-lg focus:border-[#FF4D4D] focus:ring-1 focus:ring-[#FF4D4D]/40 focus:outline-none transition-all placeholder-zinc-500"
          />
          <div className="absolute right-2 flex items-center pointer-events-none">
            <kbd className="text-[9px] font-mono bg-zinc-800 text-zinc-400 px-1.5 py-0.5 rounded border border-zinc-700 select-none shadow-sm">
              Ctrl+K
            </kbd>
          </div>
        </form>

        {/* Right: Actions */}
        <div className="flex items-center gap-3">
          {/* Theme Toggle */}
          <button
            onClick={toggleTheme}
            className="text-zinc-400 hover:text-[#FF4D4D] p-1.5 focus:outline-none transition-colors hidden md:block"
            aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
          >
            {theme === 'dark' ? (
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5 transition-colors">
                <circle cx="12" cy="12" r="5" />
                <line x1="12" y1="1" x2="12" y2="3" />
                <line x1="12" y1="21" x2="12" y2="23" />
                <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" />
                <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
                <line x1="1" y1="12" x2="3" y2="12" />
                <line x1="21" y1="12" x2="23" y2="12" />
                <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" />
                <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
              </svg>
            ) : (
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5 transition-colors">
                <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
              </svg>
            )}
          </button>

          {/* Wishlist */}
          <Link 
            href="/wishlist" 
            className="text-zinc-400 hover:text-[#FF4D4D] p-1.5 focus:outline-none transition-colors hidden md:block" 
            aria-label="Wishlist"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5 transition-colors">
              <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
            </svg>
          </Link>

          {/* Cart */}
          <Link 
            href="/cart" 
            className="text-zinc-400 hover:text-[#FF4D4D] p-1.5 focus:outline-none transition-colors relative" 
            aria-label={`Cart with ${itemCount} items`}
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5 transition-colors">
              <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z" />
              <line x1="3" y1="6" x2="21" y2="6" />
              <path d="M16 10a4 4 0 0 1-8 0" />
            </svg>
            {itemCount > 0 && (
              <span 
                key={itemCount}
                className="absolute -top-1.5 -right-1.5 bg-[#FF4D4D] text-white text-[9px] font-mono font-bold rounded-full h-4 min-w-[1rem] flex items-center justify-center px-1 shadow-[0_0_8px_rgba(255,77,77,0.5)] transition-transform scale-110 duration-200 animate-pulse"
              >
                {itemCount}
              </span>
            )}
          </Link>

          {/* Account/Auth Dropdown */}
          {status === 'authenticated' && user ? (
            <div className="relative">
              <button 
                onClick={() => setMenuOpen((o) => !o)} 
                className="text-xs font-mono font-bold tracking-wider uppercase bg-zinc-900 border border-zinc-800 hover:border-zinc-700 px-3 py-1.5 rounded-md hover:text-[#FF4D4D] active:scale-95 transition-all text-white" 
                aria-haspopup="menu" 
                aria-expanded={menuOpen}
              >
                {user.firstName ?? 'Account'}
              </button>
              {menuOpen && (
                <div
                  className="absolute right-0 mt-2 w-48 p-1.5 bg-[#0D0D11] border border-white/[0.08] rounded-lg shadow-2xl z-50 font-mono text-xs animate-fade-in"
                  role="menu"
                  onMouseLeave={() => setMenuOpen(false)}
                >
                  <Link href="/profile" className="block rounded-md px-3 py-2 text-zinc-300 hover:text-white hover:bg-white/[0.05]" role="menuitem">
                    $ cd ~/profile
                  </Link>
                  <Link href="/orders" className="block rounded-md px-3 py-2 text-zinc-300 hover:text-white hover:bg-white/[0.05]" role="menuitem">
                    $ cd ~/orders
                  </Link>
                  {user.role === 'admin' && (
                    <Link href="/admin" className="block rounded-md px-3 py-2 font-semibold text-[#FF4D4D] hover:bg-white/[0.05]" role="menuitem">
                      $ sudo ./admin
                    </Link>
                  )}
                  <button
                    onClick={() => {
                      setMenuOpen(false);
                      void logout();
                    }}
                    className="block w-full rounded-md px-3 py-2 text-left text-red-400 hover:text-red-300 hover:bg-red-500/10"
                    role="menuitem"
                  >
                    $ exit (signout)
                  </button>
                </div>
              )}
            </div>
          ) : (
            <Link 
              href="/auth/login" 
              className="bg-[#FF4D4D] text-white px-3.5 py-1.5 font-mono text-xs font-bold tracking-wider uppercase rounded-md shadow-md hover:bg-[#E03E3E] hover:shadow-[0_0_15px_rgba(255,77,77,0.45)] transition-all duration-200 active:scale-95 text-center hidden md:inline-block"
            >
              AUTH.LOGIN()
            </Link>
          )}

          {/* Hamburger Mobile Menu Toggle */}
          <button
            onClick={() => setMobileMenuOpen((o) => !o)}
            className="text-zinc-400 hover:text-white p-1.5 focus:outline-none transition-colors md:hidden"
            aria-label="Toggle mobile menu"
            aria-expanded={mobileMenuOpen}
          >
            {mobileMenuOpen ? (
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-6 w-6">
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            ) : (
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-6 w-6">
                <line x1="3" y1="12" x2="21" y2="12" />
                <line x1="3" y1="6" x2="21" y2="6" />
                <line x1="3" y1="18" x2="21" y2="18" />
              </svg>
            )}
          </button>
        </div>
      </div>

      {/* Category Row (Desktop only) */}
      <nav className="bg-[#121212] border-b border-white/[0.03] h-10 hidden md:flex items-center justify-center gap-8 overflow-x-auto text-[11px] font-mono tracking-[0.1em] text-zinc-400 select-none px-4" aria-label="Categories">
        {LINKS.map((l) => {
          const active = isLinkActive(l);
          return (
            <Link 
              key={l.href} 
              href={l.href} 
              className={cn(
                "h-full flex items-center relative transition-all duration-200 hover:text-[#FF4D4D] py-2",
                active ? "text-[#FF4D4D] after:absolute after:bottom-0 after:left-0 after:right-0 after:h-[2px] after:bg-[#FF4D4D]" : ""
              )}
            >
              {l.label}
            </Link>
          );
        })}
      </nav>

      {/* Subtle bottom red gradient line */}
      <div className="bg-gradient-to-r from-transparent via-[#FF4D4D]/35 to-transparent h-[1px] w-full" />

      {/* Mobile Drawer Overlay */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 top-[128px] bg-[#0A0A0A]/95 backdrop-blur-lg z-40 md:hidden flex flex-col font-mono text-zinc-300 p-6 gap-6 transition-all duration-300 animate-fade-in border-t border-white/[0.05]">
          {/* Mobile Search */}
          <form onSubmit={(e) => { e.preventDefault(); setMobileMenuOpen(false); onSearch(e); }} className="relative w-full flex items-center mb-2" role="search">
            <span className="absolute left-3 text-[#FF4D4D] font-bold text-sm pointer-events-none">{`>`}</span>
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="search codedrip..."
              className="w-full bg-[#16161A] text-white pl-8 pr-4 py-2.5 text-sm font-mono border border-white/10 rounded-lg focus:border-[#FF4D4D] focus:ring-1 focus:ring-[#FF4D4D]/40 focus:outline-none transition-all"
            />
          </form>

          {/* Categories/Nav Links */}
          <div className="flex flex-col gap-4 text-sm font-mono">
            <p className="text-[10px] text-zinc-500 font-mono tracking-wider uppercase mb-1">// Categories</p>
            {LINKS.map((l) => {
              const active = isLinkActive(l);
              return (
                <Link
                  key={l.href}
                  href={l.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className={cn(
                    "flex items-center gap-2 hover:text-[#FF4D4D] transition-colors py-1.5",
                    active ? "text-[#FF4D4D] font-bold" : ""
                  )}
                >
                  <span className="text-[#FF4D4D]/60">{`$`}</span>
                  <span>{`cd ${l.label.toLowerCase()}`}</span>
                </Link>
              );
            })}
          </div>

          <hr className="border-white/5 my-2" />

          {/* User Links / Controls */}
          <div className="flex flex-col gap-4 text-sm font-mono">
            <p className="text-[10px] text-zinc-500 font-mono tracking-wider uppercase mb-1">// Settings & Session</p>
            
            {/* Wishlist Mobile */}
            <Link
              href="/wishlist"
              onClick={() => setMobileMenuOpen(false)}
              className="flex items-center gap-2 hover:text-[#FF4D4D] transition-colors py-1"
            >
              <span className="text-zinc-500 font-bold">{`♥`}</span>
              <span>Wishlist</span>
            </Link>

            {/* Toggle Theme Mobile */}
            <button
              onClick={() => {
                toggleTheme();
                setMobileMenuOpen(false);
              }}
              className="flex items-center gap-2 text-left hover:text-[#FF4D4D] transition-colors py-1 w-full"
            >
              <span>{theme === 'dark' ? '☀️' : '🌙'}</span>
              <span>{`Switch Theme (${theme === 'dark' ? 'light' : 'dark'})`}</span>
            </button>

            {/* Auth / Account Mobile */}
            {status === 'authenticated' && user ? (
              <>
                <Link
                  href="/profile"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center gap-2 hover:text-[#FF4D4D] transition-colors py-1"
                >
                  <span className="text-[#FF4D4D]/60">~</span>
                  <span>My Profile</span>
                </Link>
                <Link
                  href="/orders"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center gap-2 hover:text-[#FF4D4D] transition-colors py-1"
                >
                  <span className="text-[#FF4D4D]/60">~</span>
                  <span>My Orders</span>
                </Link>
                <button
                  onClick={() => {
                    setMobileMenuOpen(false);
                    void logout();
                  }}
                  className="flex items-center gap-2 text-left text-red-400 hover:text-red-300 transition-colors py-1 w-full"
                >
                  <span>{`!`}</span>
                  <span>Sign Out</span>
                </button>
              </>
            ) : (
              <Link
                href="/auth/login"
                onClick={() => setMobileMenuOpen(false)}
                className="mt-2 bg-[#FF4D4D] text-white text-center py-2.5 font-mono text-xs font-bold tracking-wider uppercase rounded-md shadow-md hover:bg-[#E03E3E] transition-all duration-200"
              >
                AUTH.LOGIN()
              </Link>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
