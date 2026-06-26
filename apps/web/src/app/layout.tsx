import './globals.css';
import type { Metadata, Viewport } from 'next';
import { JetBrains_Mono, Space_Mono } from 'next/font/google';
import { Providers } from '@/components/Providers';
import { ErrorBoundary } from '@/components/ui/ErrorBoundary';
import { OrganizationJsonLd, WebSiteJsonLd } from '@/components/seo/JsonLd';
import { fetchJSON } from '@/lib/server-api';
import type { StoreSettings } from '@/types';

const storeName = process.env.NEXT_PUBLIC_STORE_NAME || 'CodeDrip';
const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';

const jetbrainsMono = JetBrains_Mono({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-mono',
  display: 'swap',
});

const spaceMono = Space_Mono({
  subsets: ['latin'],
  weight: ['400', '700'],
  variable: '--font-display',
  display: 'swap',
});

const themeBootstrap = `(function(){try{var t=localStorage.getItem('codedrip-theme')||'dark';document.documentElement.classList.add(t);}catch(e){}})();`;

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: 'CodeDrip | Developer T-Shirts for Code-Slinging Folks',
    template: '%s | CodeDrip',
  },
  description:
    'Witty, clever, and uncomfortably relatable developer t-shirts. For coders who like their humor compiled and their sleeves rolled up. Free shipping across India.',
  keywords: [
    'developer t-shirts',
    'programmer shirts',
    'coding tees',
    'developer humor',
    'tech apparel',
    'CodeDrip',
    'nerdy shirts',
  ],
  authors: [{ name: 'CodeDrip' }],
  creator: 'CodeDrip',
  publisher: 'CodeDrip',
  formatDetection: { email: false, address: false, telephone: false },

  openGraph: {
    type: 'website',
    locale: 'en_IN',
    url: siteUrl,
    siteName: 'CodeDrip',
    title: 'CodeDrip | Developer T-Shirts for Code-Slinging Folks',
    description: 'Witty, clever, and uncomfortably relatable developer t-shirts. For coders who like their humor compiled and their sleeves rolled up.',
    images: [
      {
        url: '/og-default.svg',
        width: 1200,
        height: 630,
        alt: 'CodeDrip | Developer T-Shirts',
      },
    ],
  },

  twitter: {
    card: 'summary_large_image',
    title: 'CodeDrip | Developer T-Shirts',
    description: 'Witty, clever, and uncomfortably relatable developer t-shirts. For coders who like their humor compiled and their sleeves rolled up.',
    images: ['/og-default.svg'],
    creator: '@codedrip',
  },

  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },

  verification: {
    google: process.env.GOOGLE_SEARCH_CONSOLE_VERIFICATION ?? '',
  },

  alternates: {
    canonical: siteUrl,
  },

  icons: {
    icon: [{ url: '/favicon.png', type: 'image/png' }],
    shortcut: ['/favicon.png'],
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
  viewportFit: 'cover',
  themeColor: [
    { media: '(prefers-color-scheme: dark)', color: '#0A0A0A' },
    { media: '(prefers-color-scheme: light)', color: '#FFFFFF' },
  ],
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const settings = await fetchJSON<StoreSettings>('/store-settings');

  return (
    <html lang="en" className={`${jetbrainsMono.variable} ${spaceMono.variable}`} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeBootstrap }} />

      </head>
      <body className="min-h-screen antialiased">
        <OrganizationJsonLd settings={settings} />
        <WebSiteJsonLd />
        <Providers>
          <ErrorBoundary>{children}</ErrorBoundary>
        </Providers>
      </body>
    </html>
  );
}
