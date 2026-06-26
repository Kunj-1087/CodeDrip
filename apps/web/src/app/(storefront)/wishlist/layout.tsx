import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Your Wishlist | CodeDrip',
  description: 'View saved CodeDrip planners, templates, notebooks, and desk accessories.',
  robots: { index: false, follow: false },
};

export default function WishlistLayout({ children }: { children: React.ReactNode }) {
  return children;
}
