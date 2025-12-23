// ========== Container_Cards_Metricas.tsx ==========
import { CardHorasContratadasHorasExecutadas } from './Card_Horas_Contratadas_Horas_Executadas';
import { CardMediaHorasChamado } from './Card_Media_Horas_Chamado';
import { CardTotalChamadosOS } from './Card_Total_Chamados_OS';

interface FilterProps {
  filters: {
    ano: number;
    mes: number;
    cliente: string;
    recurso: string;
    status: string;
  };
}

export function ContainerCardsMetricas({ filters }: FilterProps) {
  return (
    <div className="grid gap-3 sm:gap-4 lg:gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
      <CardTotalChamadosOS filters={filters} />
      <CardHorasContratadasHorasExecutadas filters={filters} />
      <CardMediaHorasChamado filters={filters} />
    </div>
  );
}