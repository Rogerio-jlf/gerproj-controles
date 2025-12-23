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

  // Redireciona para login se o usuário não estiver autenticado
  useEffect(() => {
    if (!isLoggedIn) {
      router.replace('/paginas/login');
    }
  }, [isLoggedIn, router]);

  // Não renderiza nada se o usuário não estiver autenticado
  if (!isLoggedIn) {
    return null;
  }

  return (
    <div className="flex h-screen bg-white overflow-hidden">
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