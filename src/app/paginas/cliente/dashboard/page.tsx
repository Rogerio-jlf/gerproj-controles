'use client';

import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { ContainerDashboard } from '../../../../components/dashboard/Container_Dashboard';
import { LayoutDashboard } from '../../../../components/dashboard/Layout_Dashboard';
import { Filtros } from '../../../../components/shared/Filtros';
import { useIsLoggedIn } from '../../../../store/authStore';
import { useFilters } from '../../../../store/filtersStore'; // <- Mudança aqui

export default function DashboardPage() {
    const isLoggedIn = useIsLoggedIn();
    const { filters } = useFilters();
    const router = useRouter();

    useEffect(() => {
        if (!isLoggedIn) {
            router.push('/paginas/login');
        }
    }, [isLoggedIn, router]);

    if (!isLoggedIn) return null;

    return (
        <LayoutDashboard pageTitle="Dashboard">
            <div className="flex h-full flex-col gap-10 overflow-hidden">
                <div className="flex-shrink-0">
                    <Filtros />
                </div>

                <div className="min-h-0 flex-1">
                    <ContainerDashboard
                        filters={{
                            ano: filters.ano,
                            mes: filters.mes,
                            cliente: filters.cliente,
                            recurso: filters.recurso,
                            status: filters.status,
                        }}
                    />
                </div>
            </div>
        </LayoutDashboard>
    );
}
