import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Checkout | CodeDrip',
  description: 'Complete your CodeDrip order for digital planners, templates, stationery, and desk accessories.',
  robots: { index: false, follow: false },
};

export default function CheckoutLayout({ children }: { children: React.ReactNode }) {
  return children;
}
