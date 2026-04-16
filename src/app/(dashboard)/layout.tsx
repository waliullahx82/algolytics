'use client';

import { useAuth } from '@/lib/AuthContext';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { SyncProvider } from '@/lib/SyncContext';
import Sidebar from '@/components/Sidebar';
import Header from '@/components/Header';

function DashboardContent({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) {
      router.push('/');
    }
  }, [user, loading, router]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0a0f14] flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 bg-gradient-to-br from-[#81ecff] to-[#00e3fd] rounded-xl flex items-center justify-center animate-pulse">
            <span className="text-2xl">⚡</span>
          </div>
          <p className="text-[#a7abb2] font-mono text-sm">Initializing...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="flex min-h-screen bg-[#0a0f14]">
      <Sidebar />
      <main className="flex-1 min-w-0">
        <Header />
        <div className="p-8 max-w-7xl mx-auto">
          {children}
        </div>
      </main>
    </div>
  );
}

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <SyncProvider>
      <DashboardContent>{children}</DashboardContent>
    </SyncProvider>
  );
}
