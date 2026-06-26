'use client';
import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useCart } from '@/context/CartContext';
import { useAuth } from '@/context/AuthContext';
import { cn } from '@/lib/cn';

const iconProps = {
  viewBox: '0 0 24 24',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 1.75,
  strokeLinecap: 'round',
  strokeLinejoin: 'round',
  'aria-hidden': true,
} as const;

const HomeIcon = () => <svg {...iconProps} className="h-5 w-5"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" /><polyline points="9 22 9 12 15 12 15 22" /></svg>;
const ShopIcon = () => <svg {...iconProps} className="h-5 w-5"><rect x="3" y="3" width="7" height="7" /><rect x="14" y="3" width="7" height="7" /><rect x="3" y="14" width="7" height="7" /><rect x="14" y="14" width="7" height="7" /></svg>;
const SearchIcon = () => <svg {...iconProps} className="h-5 w-5"><circle cx="11" cy="11" r="7" /><path d="m21 21-4.3-4.3" /></svg>;
const HeartIcon = () => <svg {...iconProps} className="h-5 w-5"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" /></svg>;
const UserIcon = () => <svg {...iconProps} className="h-5 w-5"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" /></svg>;

interface TabItem {
  href: string;
  label: string;
  icon: React.ComponentType;
  requiresCount?: boolean;
  authRequired?: boolean;
  isSearchTrigger?: boolean;
}

const TABS: TabItem[] = [
  { href: '/', label: 'home', icon: HomeIcon },
  { href: '/shop', label: 'shop', icon: ShopIcon },
  { href: '#search', label: 'search', icon: SearchIcon, isSearchTrigger: true },
  { href: '/wishlist', label: 'wishlist', icon: HeartIcon },
  { href: '/auth/login', label: 'user', icon: UserIcon, authRequired: true },
];

export function BottomNav() {
  const pathname = usePathname();
  const { itemCount } = useCart();
  const { status } = useAuth();

  if (pathname === '/checkout') return null;

  const isActive = (href: string) => {
    if (pathname === '/checkout') return false;
    if (href === '/') return pathname === '/';
    if (href === '/auth/login') return pathname.startsWith('/auth/') || pathname === '/profile' || pathname === '/orders';
    return pathname.startsWith(href);
  };

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-50 border-t border-white/5 glass-panel md:hidden animate-[nav-slide-up_300ms_ease-out] shadow-xl pb-safe"
      aria-label="Mobile navigation"
    >
      <div className="flex items-center justify-around h-14 px-2">
        {TABS.map(({ href, label, icon: Icon, requiresCount, authRequired, isSearchTrigger }) => {
          const active = isActive(href);
          const resolvedHref = authRequired && status === 'authenticated' ? '/profile' : href;

          const handleClick = (e: React.MouseEvent) => {
            if (isSearchTrigger) {
              e.preventDefault();
              window.dispatchEvent(new CustomEvent('open-search'));
            }
          };

          return (
            <Link
              key={href}
              href={resolvedHref}
              onClick={handleClick}
              className={cn(
                'relative flex flex-col items-center justify-center gap-0.5 rounded-lg px-3 py-1 text-xs transition-all duration-200 active:scale-110 font-mono',
                active ? 'text-primary' : 'text-muted hover:text-ink',
              )}
              aria-current={active ? 'page' : undefined}
            >
              <span className="relative">
                <Icon />
                {requiresCount && itemCount > 0 && (
                  <span className="absolute -right-2 -top-1.5 grid h-4 min-w-[16px] place-items-center rounded-full bg-primary px-1 text-[9px] font-bold leading-none text-white animate-pulse-glow">
                    {itemCount > 99 ? '99+' : itemCount}
                  </span>
                )}
              </span>
              <span className="text-[9px] font-medium leading-none tracking-tighter">{label}</span>
              {active && (
                <span className="absolute bottom-0 h-1 w-1 rounded-full bg-accent animate-pulse-glow" />
              )}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
