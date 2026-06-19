import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';

// Storefront chrome. Admin pages live outside this route group and render their
// own shell, so the customer navbar/footer never appear in the dashboard.
export default function StorefrontLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />
      <main className="flex-1">{children}</main>
      <Footer />
    </div>
  );
}
