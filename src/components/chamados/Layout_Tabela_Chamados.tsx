// src/components/chamados/Layout_Tabela_Chamados.tsx
'use client';

import { ReactNode } from 'react';
import { ProtecaoRotas } from '../utils/ProtecaoRotas';
import { Sidebar } from '../utils/Sidebar';

interface LayoutProps {
  children: ReactNode;
  pageTitle: string;
}

export function LayoutTabelaChamados({ children }: LayoutProps) {
  return (
    <ProtecaoRotas>
      <div
        className="flex bg-white overflow-hidden"
        style={{
          zoom: 0.75,
          minHeight: '100vh',
          height: '133.33vh', // Compensa o zoom
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
    </ProtecaoRotas>
  );
}
