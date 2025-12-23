'use client';

import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import { ReactNode, useEffect } from 'react';
import { Sidebar } from '../utils/Sidebar';

interface LayoutProps {
  children: ReactNode;
  pageTitle: string;
}

export function LayoutDashboard({ children }: LayoutProps) {
  const { isLoggedIn } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoggedIn) {
      router.replace('/paginas/login');
    }
  }, [isLoggedIn, router]);

  if (!isLoggedIn) {
    return null;
  }

  return (
    <div 
      className="flex bg-white overflow-hidden"
      style={{
        zoom: 0.75,
        minHeight: '100vh',
        height: '133.33vh' // Compensa o zoom
      }}
    >
      {/* ========== SIDEBAR ========== */}
      <div className="h-full p-6">
        <Sidebar />
      </div>
      {/* ===== */}

      {/* ========== MAIN ========== */}
      <main className="flex-1 flex flex-col p-6 overflow-hidden">
        {children}
      </main>
      {/* ===== */}
    </div>
  );
}