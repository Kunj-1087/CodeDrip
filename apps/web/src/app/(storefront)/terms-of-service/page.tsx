import type { Metadata } from 'next';
import { LegalPage } from '@/components/legal/LegalPage';

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';

export const metadata: Metadata = {
  title: 'Terms of Service | CodeDrip',
  description: 'The terms governing your use of CodeDrip marketplace and purchases made through the store.',
  alternates: { canonical: `${SITE_URL}/terms-of-service` },
  openGraph: {
    title: 'Terms of Service | CodeDrip',
    description: 'The terms governing your use of CodeDrip marketplace and purchases made through the store.',
    url: `${SITE_URL}/terms-of-service`,
    siteName: 'CodeDrip',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Terms of Service | CodeDrip',
    description: 'The terms governing your use of CodeDrip marketplace and purchases made through the store.',
  },
};

export default function TermsOfServicePage() {
  return (
    <LegalPage title="Terms of Service" updated="19 June 2026">
      <p>
        By using CodeDrip, you agree to the following terms. Please read them carefully before browsing or purchasing.
      </p>

      <h2>1. General</h2>
      <p>
        CodeDrip is a marketplace for digital planners, Notion templates, printable stationery, journals, notebooks,
        and desk accessories. By accessing or using our website, you agree to be bound by these terms.
      </p>

      <h2>2. Account responsibilities</h2>
      <p>
        You are responsible for maintaining the confidentiality of your account and password. You agree to accept
        responsibility for all activities that occur under your account.
      </p>

      <h2>3. Product purchasing</h2>
      <p>
        All prices are listed in Indian Rupees (INR) and include applicable taxes unless stated otherwise. Payment is
        due at the time of purchase. We reserve the right to refuse or cancel any order.
      </p>

      <h2>4. Digital product usage</h2>
      <p>
        Digital products (templates, printables, spreadsheets) are licensed for personal use only. You may not
        resell, redistribute, sublicense, or share downloaded files. Commercial use requires a separate license.
      </p>

      <h2>5. Intellectual property</h2>
      <p>
        All product designs, templates, content, and branding on CodeDrip are the intellectual property of CodeDrip
        or its licensors. You may not copy, modify, or reproduce any content without permission.
      </p>

      <h2>6. Limitation of liability</h2>
      <p>
        CodeDrip is not liable for any indirect, incidental, or consequential damages arising from your use of the
        website or products purchased through the marketplace.
      </p>

      <h2>7. Changes to terms</h2>
      <p>
        We reserve the right to update these terms at any time. Changes will be posted on this page with the updated
        date. Continued use of the site after changes constitutes acceptance.
      </p>

      <h2>8. Contact</h2>
      <p>
        For questions about these terms, contact us at <strong>hello@codedrip.dev</strong>.
      </p>
    </LegalPage>
  );
}
