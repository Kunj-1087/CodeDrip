'use client';
import Link from 'next/link';
import { useCart } from '@/context/CartContext';
import { useStore } from '@/context/StoreContext';
import { formatCurrency } from '@/lib/format';
import { CartItem } from '@/components/cart/CartItem';
import { Skeleton } from '@/components/ui/Skeleton';

export default function CartPage() {
  const { items, subtotal, itemCount, loading } = useCart();
  const hasItems = items.length > 0;
  const { settings } = useStore();
  const currency = settings?.currency ?? 'INR';

  if (loading) {
    return (
      <div className="container-px py-10">
        <Skeleton className="h-8 w-40" />
        <div className="mt-6 space-y-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-24 w-full" />
          ))}
        </div>
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="container-px py-20 text-center">
        <h1 className="text-2xl font-bold text-ink font-mono">Staging is empty</h1>
        <p className="mt-2 text-muted font-mono">Nothing staged for deployment. Add some threads to your wardrobe.</p>
        <Link href="/shop" className="btn-primary mt-6 inline-flex px-6 py-3 font-mono">
          ls ./shop
        </Link>
      </div>
    );
  }

  return (
    <div className="container-px py-10">
      <h1 className="text-2xl font-bold text-ink font-mono">Staging Environment</h1>
      <p className="mt-1 text-sm text-muted font-mono">{itemCount} item{itemCount !== 1 ? 's' : ''} ready for review</p>
      <div className="mt-6 grid gap-8 lg:grid-cols-[1fr_22rem]">
        <div className="card divide-y divide-border px-5">
          {items.map((line) => (
            <CartItem key={line.id} line={line} />
          ))}
        </div>

        <aside className="card h-fit p-6">
          <h2 className="text-lg font-semibold text-ink font-mono">git diff --stat</h2>
          <div className="mt-4 flex justify-between text-sm">
            <span className="text-muted font-mono">Subtotal</span>
            <span className="font-medium text-ink font-mono">{formatCurrency(subtotal, currency)}</span>
          </div>
          <p className="mt-1 text-xs text-muted font-mono">Shipping, tax, and API keys are verified at deploy time.</p>
          <div className="mt-4 rounded-lg border border-border bg-surface p-3 text-xs leading-relaxed text-muted font-mono">
            Physical t-shirts will be shipped after deployment. Average delivery: 5-8 business days.
          </div>
          <Link href="/checkout" className="btn-primary mt-4 w-full py-3 font-mono">
            Push to Production →
          </Link>
          <Link href="/shop" className="btn-ghost mt-2 w-full font-mono">
            Continue shopping
          </Link>
        </aside>
      </div>
    </div>
  );
}
