import CardHoraContratadaExecutada from './Card_Horas_Contratadas_Horas_Executadas';
import CardMediaHoraChamado from './Card_Media_Horas_Chamado';
import CardTotalChamado from './Card_Total_Chamados';

interface FilterProps {
  filters: {
    ano: number;
    mes: number;
    cliente: string;
    recurso: string;
    status: string;
  };
}

export default function ContainerMetrica({ filters }: FilterProps) {
  return (
    <div className="mb-8 grid grid-cols-1 gap-6 md:grid-cols-3">
      <CardTotalChamado filters={filters} />
      <CardHoraContratadaExecutada filters={filters} />
      <CardMediaHoraChamado filters={filters} />
    </div>
  );
}
