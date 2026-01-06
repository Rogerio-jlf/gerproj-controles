'use client';

import { useRouter } from 'next/navigation';
import { ReactNode, useEffect } from 'react';
import { useIsLoggedIn } from '../../store/authStore';
import { Sidebar } from '../shared/Sidebar';

interface LayoutProps {
    children: ReactNode;
    pageTitle: string;
}

// ===== CONFIGURAÇÃO DE ZOOM =====
const ZOOM_LEVEL = 0.67; // Mude apenas este valor
const ZOOM_COMPENSATION = 100 / ZOOM_LEVEL; // Calcula automaticamente (ex: 100 / 0.75 = 133.33)
// ================================

export function LayoutDashboard({ children }: LayoutProps) {
    const isLoggedIn = useIsLoggedIn();
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
            className="flex overflow-hidden bg-white"
            style={{
                zoom: ZOOM_LEVEL,
                minHeight: '100vh',
                height: `${ZOOM_COMPENSATION}vh`, // Compensa automaticamente
            }}
        >
            {/* ========== SIDEBAR ========== */}
            <div className="h-full py-6 pl-6">
                <Sidebar />
            </div>
            {/* ===== */}

            {/* ========== MAIN ========== */}
            <main className="flex flex-1 flex-col overflow-hidden p-6">{children}</main>
            {/* ===== */}
        </div>
    );
}
