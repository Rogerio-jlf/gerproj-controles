'use client';

import { useFilters } from '@/context/FiltersContext';
import { useEffect } from 'react';

/**
 * Componente de Debug para visualizar o estado dos filtros
 * Adicione este componente temporariamente nas suas páginas
 * para ver o que está acontecendo com os filtros
 */
export function DebugFilters() {
  const { filters } = useFilters();

  useEffect(() => {
    console.log('🐛 DEBUG - Estado atual dos filtros:', filters);
  }, [filters]);

  if (process.env.NODE_ENV !== 'development') {
    return null; // Não renderiza em produção
  }

  return (
    <div className="fixed bottom-4 right-4 z-[9999] bg-black/90 text-white p-4 rounded-lg shadow-xl max-w-md">
      <div className="font-bold mb-2 text-yellow-400">🐛 DEBUG - Filtros</div>
      <pre className="text-xs">
        {JSON.stringify(filters, null, 2)}
      </pre>
    </div>
  );
}