// components/DashboardCharts.tsx
import ContainerHoraApontada from '@/components/dashboard/graficos/horas-apontadas/Container_Horas_Apontadas';
import ContainerHoraRecurso from '@/components/dashboard/graficos/horas-recurso/Container_Horas_Recurso';

interface FilterProps {
  filters: {
    ano: number;
    mes: number;
    cliente: string;
    recurso: string;
    status: string;
  };
}

export default function ContainerHorasRecursoHorasApontadas({
  filters,
}: FilterProps) {
  return (
    <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
      {/* Container de horas por recurso */}
      <div className="h-[486px] overflow-hidden rounded-xl border bg-white shadow-md shadow-black">
        <ContainerHoraRecurso
          filters={{
            ano: filters.ano.toString(),
            mes: filters.mes.toString(),
            cliente: filters.cliente,
            recurso: filters.recurso,
            status: filters.status,
          }}
        />
      </div>

      {/* Container de horas apontadas */}
      <div className="h-[486px] overflow-hidden rounded-xl border bg-white shadow-md shadow-black">
        <ContainerHoraApontada
          filters={{
            ano: filters.ano.toString(),
            cliente: filters.cliente,
            recurso: filters.recurso,
            status: filters.status,
          }}
        />
      </div>
    </div>
  );
}
