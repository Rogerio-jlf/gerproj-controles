'use client';

import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import { useCallback, useEffect } from 'react';
import './style_dashboard.css';

// components
import { useFilters } from '@/context/FiltersContext';
import ContainerHoraRecursoHoraApontada from '../../components/dashboard/Container_Cards_Graficos';
import DashboardLayout from '../../components/dashboard/Layout_Dashboard';
import ContainerCardsMetricas from '../../components/dashboard/metricas/Container_Cards';
import Filtros from '../../components/Filtros';

export default function DashboardPage() {
  const { isLoggedIn, isAdmin, codCliente } = useAuth();
  const { filters, setFilters } = useFilters();
  const router = useRouter();

  // Redireciona para a página de login se o usuário não estiver logado
  useEffect(() => {
    if (!isLoggedIn) {
      router.push('/login');
    }
  }, [isLoggedIn, router]);

  // Atualiza os filtros com o código do cliente se não for admin
  const handleFiltersChange = useCallback(
    (newFilters: typeof filters) => {
      const updatedFilters = !isAdmin
        ? { ...newFilters, cliente: codCliente || '' }
        : newFilters;

      setFilters(updatedFilters);
    },
    [isAdmin, codCliente, setFilters],
  );

  // Se o usuário não estiver logado, não renderiza nada
  if (!isLoggedIn) return null;

  return (
    <DashboardLayout pageTitle="Dashboard">
      <Filtros onFiltersChange={handleFiltersChange} />
      <ContainerCardsMetricas filters={filters} />
      <ContainerHoraRecursoHoraApontada filters={filters} />
    </DashboardLayout>
  );
}
