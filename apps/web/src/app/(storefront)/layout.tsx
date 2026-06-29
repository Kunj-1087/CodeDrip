import { Suspense } from 'react';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import { BottomNav } from '@/components/layout/BottomNav';
import { CookieConsent } from '@/components/ui/CookieConsent';
import { PageAnimatePresence } from '@/components/layout/PageAnimatePresence';

// Storefront chrome. Admin pages live outside this route group and render their
// own shell, so the customer navbar/footer (and cookie banner) never appear in
// the dashboard.
//
// MOBILE: includes a bottom navigation bar and extra bottom padding so content
// is never obscured by the fixed nav. On desktop (>768px) the bottom nav is
// hidden via Tailwind's `md:hidden` on the component itself.
export default function StorefrontLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col">
      <Suspense fallback={<div className="h-16 bg-background" />}>
        <Navbar />
      </Suspense>
      <main className="flex-1 page-content">
        <PageAnimatePresence>{children}</PageAnimatePresence>
      </main>
      <Footer />
      <BottomNav />
      <CookieConsent />
    </div>
  );
}
