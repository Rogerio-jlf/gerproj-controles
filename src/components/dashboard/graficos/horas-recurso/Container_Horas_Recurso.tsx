'use client';

import CardsHorasRecurso from './Cards_Horas_Recurso';
import GraficoHorasRecurso from './Grafico_Horas_Recurso';

interface FiltersProps {
  filters: {
    mes: string;
    ano: string;
    cliente?: string;
    recurso?: string;
    status?: string;
  };
}

export default function ContainerHorasRecurso({ filters }: FiltersProps) {
  return (
    <div className="space-y-2">
      {/* Componente das Métricas */}
      <CardsHorasRecurso filters={filters} />

      {/* Componente do Gráfico */}
      <GraficoHorasRecurso filters={filters} />
    </div>
  );
}
