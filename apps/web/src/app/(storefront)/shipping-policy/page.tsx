import type { Metadata } from 'next';
import { LegalPage } from '@/components/legal/LegalPage';

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';

export const metadata: Metadata = {
  title: 'Shipping Policy | CodeDrip',
  description: 'CodeDrip shipping times, costs, and delivery information for physical and print-on-demand products.',
  alternates: { canonical: `${SITE_URL}/shipping-policy` },
  openGraph: {
    title: 'Shipping Policy | CodeDrip',
    description: 'CodeDrip shipping times, costs, and delivery information for physical and print-on-demand products.',
    url: `${SITE_URL}/shipping-policy`,
    siteName: 'CodeDrip',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Shipping Policy | CodeDrip',
    description: 'CodeDrip shipping times, costs, and delivery information for physical and print-on-demand products.',
  },
};

export default function ShippingPolicyPage() {
  return (
    <LegalPage title="Shipping Policy" updated="19 June 2026">
      <p>
        This policy applies to all physical products sold through CodeDrip — planners, journals, notebooks,
        stationery, and desk accessories.
      </p>

      <h2>1. Shipping estimate</h2>
      <p>
        In-stock items ship within <strong>2–3 business days</strong>. Delivery typically takes
        <strong>5–8 business days</strong> depending on your location in India.
      </p>

      <h2>2. Shipping costs</h2>
      <p>
        Shipping is a flat <strong>₹199</strong> for orders under ₹5,000. Free shipping is available on orders
        above ₹5,000. Shipping is calculated at checkout.
      </p>

      <h2>3. Tracking</h2>
      <p>
        Once your order ships, you will receive an email with a tracking link. You can also check your order status
        anytime under <a href="/orders">My orders</a>.
      </p>

      <h2>4. Delays</h2>
      <p>
        Shipping delays may occur during peak seasons, holidays, or due to unforeseen circumstances. We will notify
        you if any significant delays affect your order.
      </p>
    </LegalPage>
  );
}
