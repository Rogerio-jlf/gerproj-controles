'use client';

import { useAuth } from '@/context/AuthContext';
import axios from 'axios';
import { useEffect, useState } from 'react';
import MetricasHorasApontadas from './Cards_Horas_Apontadas';
import GraficoHorasApontadas from './Grafico_Horas_Apontadas';

const meses = [
  'Jan',
  'Fev',
  'Mar',
  'Abr',
  'Mai',
  'Jun',
  'Jul',
  'Ago',
  'Set',
  'Out',
  'Nov',
  'Dez',
];

interface FiltersProps {
  filters: {
    ano: string;
    mes?: string;
    cliente?: string;
    recurso?: string;
    status?: string;
  };
}

interface MesProps {
  mes: number;
  ano: number;
  periodo: string;
  totalHoras: number;
  totalApontamentos: number;
  labelMes: string;
}

interface APIResponseProps {
  dados_grafico: {
    mes: number;
    ano: number;
    periodo: string;
    total_horas: number;
    total_apontamentos: number;
    label_mes: string;
  };
}

export default function ContainerHorasApontadas({ filters }: FiltersProps) {
  const [dados, setDados] = useState<MesProps[]>([]);
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState<string | null>(null);

  const { isAdmin, codCliente, isLoggedIn } = useAuth();

  useEffect(() => {
    const fetchDataForAllMonths = async () => {
      if (!isLoggedIn) {
        setErro('Usuário não autenticado');
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setErro(null);

        const ano = parseInt(filters.ano);

        const promises = Array.from({ length: 12 }, async (_, index) => {
          const mes = index + 1;

          try {
            const params = {
              ...filters,
              mes: mes.toString(),
              isAdmin: isAdmin.toString(),
              ...(!isAdmin && codCliente && { codCliente }),
            };

            const res = await axios.get<APIResponseProps>(
              '/api/metrica-grafico/hora_apontamento',
              {
                params,
              },
            );

            const { dados_grafico } = res.data;

            return {
              mes: dados_grafico.mes,
              ano: dados_grafico.ano,
              periodo: dados_grafico.periodo,
              totalHoras: dados_grafico.total_horas,
              totalApontamentos: dados_grafico.total_apontamentos,
              labelMes: dados_grafico.label_mes,
            };
          } catch (error) {
            return {
              mes,
              ano,
              periodo: `${mes.toString().padStart(2, '0')}/${ano}`,
              totalHoras: 0,
              totalApontamentos: 0,
              labelMes: `${meses[mes - 1]} de ${ano}`,
            };
          }
        });

        const resultados = await Promise.all(promises);
        const dadosOrdenados = resultados.sort((a, b) => a.mes - b.mes);

        setDados(dadosOrdenados);
      } catch (err) {
        console.error('Erro ao carregar dados:', err);
        setErro('Erro ao carregar os dados.');
      } finally {
        setLoading(false);
      }
    };

    fetchDataForAllMonths();
  }, [filters, isAdmin, codCliente, isLoggedIn]);

  // Cálculo das métricas
  const totalHoras = dados.reduce((acc, cur) => acc + cur.totalHoras, 0);
  const mesesComDados = dados.filter((item) => item.totalHoras > 0).length;
  const mediaHoras = dados.length ? totalHoras / mesesComDados : 0;

  return (
    <div className="space-y-6">
      {/* Componente de Métricas */}
      <MetricasHorasApontadas
        totalHoras={totalHoras}
        mediaHoras={mediaHoras}
        mesesComDados={mesesComDados}
        loading={loading}
      />

      {/* Componente do Gráfico */}
      <GraficoHorasApontadas
        dados={dados}
        loading={loading}
        erro={erro}
        altura="300px"
      />
    </div>
  );
}
