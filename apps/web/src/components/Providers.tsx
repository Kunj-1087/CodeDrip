'use client';
import type { ReactNode } from 'react';
import { ThemeProvider } from '@/context/ThemeContext';
import { StoreProvider } from '@/context/StoreContext';
import { ToastProvider } from '@/context/ToastContext';
import { AuthProvider } from '@/context/AuthContext';
import { CartProvider } from '@/context/CartContext';
import { ToastViewport } from '@/components/ui/Toast';
import { KonamiEasterEgg } from '@/components/ui/KonamiEasterEgg';
import { CartFlyAnimation } from '@/components/cart/CartFlyAnimation';
import { SearchModal } from '@/components/layout/SearchModal';

// Single client boundary that composes all app-wide providers. Order matters:
// Cart depends on Auth; everything can surface Toasts.
export function Providers({ children }: { children: ReactNode }) {
  return (
    <ThemeProvider>
      <StoreProvider>
        <ToastProvider>
          <AuthProvider>
            <CartProvider>
              {children}
              <CartFlyAnimation />
              <SearchModal />
              <ToastViewport />
              <KonamiEasterEgg />
            </CartProvider>
          </AuthProvider>
        </ToastProvider>
      </StoreProvider>
    </ThemeProvider>
  );
}
