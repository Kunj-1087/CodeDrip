import './globals.css';
import type { Metadata } from 'next';
import { Providers } from '@/components/Providers';

const storeName = process.env.NEXT_PUBLIC_STORE_NAME || 'OursCart';
const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';

// Base metadata. Per-page files extend this; product/category pages set their own
// title + description dynamically (see Phase 6 SEO).
export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: `${storeName} — RAM, SSDs, hard drives & PC parts`,
    template: `%s · ${storeName}`,
  },
  description:
    'Genuine RAM, SSDs, hard drives and PC accessories with real specs, honest pricing, and fast shipping.',
  openGraph: { type: 'website', siteName: storeName, url: siteUrl },
  robots: { index: true, follow: true },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="min-h-screen">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
