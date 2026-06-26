'use client';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { AdminSidebar } from '@/components/admin/AdminSidebar';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const { status, user } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (status === 'anonymous') router.replace('/auth/login?redirect=/admin');
    else if (status === 'authenticated' && user?.role !== 'admin') router.replace('/');
  }, [status, user, router]);

  if (status === 'loading' || status === 'anonymous' || user?.role !== 'admin') {
    return <div className="grid min-h-screen place-items-center text-muted">Checking access…</div>;
  }

  return (
    <div className="flex min-h-screen">
      <AdminSidebar />
      <main className="flex-1 overflow-x-hidden bg-surface-2 pt-14 md:pt-0">{children}</main>
    </div>
  );
}
