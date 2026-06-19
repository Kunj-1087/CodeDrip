'use client';
import type { ReactNode } from 'react';
import { ThemeProvider } from '@/context/ThemeContext';
import { StoreProvider } from '@/context/StoreContext';
import { ToastProvider } from '@/context/ToastContext';
import { AuthProvider } from '@/context/AuthContext';
import { CartProvider } from '@/context/CartContext';
import { ToastViewport } from '@/components/ui/Toast';

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
              <ToastViewport />
            </CartProvider>
          </AuthProvider>
        </ToastProvider>
      </StoreProvider>
    </ThemeProvider>
  );
}
