import type { Metadata } from 'next';
import { LegalPage } from '@/components/legal/LegalPage';

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';

export const metadata: Metadata = {
  title: 'Refund Policy | CodeDrip',
  description: 'CodeDrip refund, return, and cancellation terms for digital and physical products.',
  alternates: { canonical: `${SITE_URL}/refund-policy` },
  openGraph: {
    title: 'Refund Policy | CodeDrip',
    description: 'CodeDrip refund, return, and cancellation terms for digital and physical products.',
    url: `${SITE_URL}/refund-policy`,
    siteName: 'CodeDrip',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Refund Policy | CodeDrip',
    description: 'CodeDrip refund, return, and cancellation terms for digital and physical products.',
  },
};

export default function RefundPolicyPage() {
  return (
    <LegalPage title="Refund Policy" updated="19 June 2026">
      <p>
        We want you to be happy with your purchase. This policy covers refunds and returns for products bought on
        CodeDrip.
      </p>

      <h2>1. Digital products</h2>
      <p>
        Digital products (Notion templates, printables, spreadsheets, Canva templates) are non-refundable once
        downloaded or accessed. If you experience technical issues, contact us within <strong>7 days</strong> and we
        will resolve the issue or issue a refund if the product is defective.
      </p>

      <h2>2. Physical products</h2>
      <p>
        Unopened physical items in original packaging can be returned within <strong>7 days</strong> of delivery.
        To initiate a return, contact us with your order number via the contact page.
      </p>

      <h2>3. Bundle refunds</h2>
      <p>
        Bundles containing mixed digital and physical products are subject to the same policies above. Digital
        components of a bundle are non-refundable once downloaded. Physical components can be returned if unopened.
      </p>

      <h2>4. Damaged or defective items</h2>
      <p>
        Report damaged physical items within 48 hours of delivery. We will replace the item or issue a full refund,
        including return shipping costs.
      </p>

      <h2>5. How to request a refund</h2>
      <p>
        Email us at <strong>hello@codedrip.dev</strong> with your order number and reason for the request. We
        respond within 24 hours on business days.
      </p>

      <h2>6. Refund processing time</h2>
      <p>
        Approved refunds are issued to your original payment method. Refunds typically reflect within 5–7 business
        days, depending on your bank or payment provider.
      </p>
    </LegalPage>
  );
}
