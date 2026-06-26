import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Your Cart | CodeDrip',
  description: 'Review your CodeDrip planners, templates, stationery, and desk tools before checkout.',
  robots: { index: false, follow: false },
};

export default function CartLayout({ children }: { children: React.ReactNode }) {
  return children;
}
