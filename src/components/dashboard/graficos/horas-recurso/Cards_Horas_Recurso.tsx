'use client';

import { useAuth } from '@/context/AuthContext';
import { formatarHorasTotaisSufixo } from '../../../../formatters/formatar-hora';
import axios from 'axios';
import { useEffect, useState } from 'react';
import { FaClock, FaUsers } from 'react-icons/fa';
import { IoIosTrendingUp } from 'react-icons/io';
import { GiSandsOfTime } from 'react-icons/gi';

interface FiltersProps {
  mes: string;
  ano: string;
  cliente?: string;
  recurso?: string;
  status?: string;
}

interface ApiResponseProps {
  detalhesRecursos: Array<{
    codrec_os: string;
    nome_recurso: string | null;
    horasExecutadas: number;
    numeroClientesUnicos: number;
    percentual: number;
  }>;
  totalHorasExecutadas: number;
  numeroDeClientes: number;
  numeroDeRecursos: number;
  mediaHorasPorCliente: number;
}

export default function CardsHorasRecurso({
  filters,
}: {
  filters: FiltersProps;
}) {
  const [dados, setDados] = useState<ApiResponseProps | null>(null);
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState<string | null>(null);

  const { isAdmin, codCliente } = useAuth();

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setErro(null);

        const params = {
          ...filters,
          isAdmin: isAdmin.toString(),
          ...(!isAdmin && codCliente && { codCliente }),
        };

        const res = await axios.get('/api/metrica-grafico/hora_recurso', {
          params,
        });

        setDados(res.data as ApiResponseProps);
      } catch (err) {
        console.error('Erro ao carregar dados:', err);
        setErro('Erro ao carregar os dados');
        setDados(null);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [filters, isAdmin, codCliente]);

  const metricas = dados
    ? [
        {
          titulo: 'Total de Horas',
          valor: formatarHorasTotaisSufixo(dados.totalHorasExecutadas),
          descricao: 'Total horas executadas',
          icone: FaClock,
          bgColor: 'from-blue-100 to-indigo-100',
          iconColor: 'from-blue-500 to-indigo-600',
          borderColor: 'border-blue-200',
          textColor: 'text-blue-600',
          valueColor: 'text-blue-800',
        },
        {
          titulo: 'Recursos Ativos',
          valor: dados.numeroDeRecursos.toString(),
          descricao: 'Total recursos utilizados',
          icone: FaUsers,
          bgColor: 'from-purple-100 to-pink-100',
          iconColor: 'from-purple-500 to-pink-600',
          borderColor: 'border-purple-200',
          textColor: 'text-purple-600',
          valueColor: 'text-purple-800',
        },
        {
          titulo: 'Média por Recurso',
          valor: formatarHorasTotaisSufixo(dados.mediaHorasPorCliente),
          descricao: 'Total média horas recurso',
          icone: IoIosTrendingUp,
          bgColor: 'from-emerald-100 to-teal-100',
          iconColor: 'from-emerald-500 to-teal-600',
          borderColor: 'border-emerald-200',
          textColor: 'text-emerald-600',
          valueColor: 'text-emerald-800',
        },
      ]
    : [];

  return (
    <div className="space-y-2">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4">
        <div className="flex items-center gap-6">
          <div className="relative">
            <div className="w-12 h-12 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-md flex items-center justify-center shadow-md shadow-black">
              <GiSandsOfTime className="text-white" size={24} />
            </div>
          </div>

          <div>
            <h2 className="text-2xl font-extrabold text-black tracking-widest select-none">
              HORAS POR RECURSO
            </h2>
            <p className="text-sm text-slate-600 font-semibold italic select-none tracking-widest">
              Distribuição de horas executadas por recurso
            </p>
          </div>
        </div>

        {/* Badge de status */}
        <div className="flex items-center gap-2 bg-gradient-to-r from-green-100 to-green-100 px-6 py-2 rounded-full border border-green-500 shadow-md shadow-black">
          <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
          <span className="text-green-700 font-semibold text-sm tracking-widest select-none italic">
            {isAdmin ? 'Administrador' : ''}
          </span>
        </div>
      </div>

      {/* Cards das métricas */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 p-4">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl p-4 border border-blue-200 animate-pulse"
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-blue-200 rounded-lg"></div>
                <div className="flex-1">
                  <div className="h-3 bg-blue-200 rounded mb-1"></div>
                  <div className="h-5 bg-blue-200 rounded"></div>
                  <span className="mt-1 tracking-widest font-semibold italic text-slate-600 select-none">Carregando...</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : erro || !dados ? (
        <div className="grid grid-cols-1 gap-4 p-4 sm:grid-cols-3">
          <div className="col-span-full rounded-xl border border-red-200 bg-red-50 p-4 text-center">
            <div className="mx-auto mb-2 flex h-12 w-12 items-center justify-center rounded-full bg-red-100">
              <svg
                className="h-6 w-6 text-red-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.5 0L4.314 15.5c-.77.833.192 2.5 1.732 2.5z"
                />
              </svg>
            </div>
            <p className="font-medium text-red-600">
              {erro || 'Erro ao carregar dados'}
            </p>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 px-4">
          {metricas.map((metrica, index) => {
            const IconeComponent = metrica.icone;

            return (
              <div
                key={index}
                className={`bg-gradient-to-br ${metrica.bgColor} rounded-md border shadow-sm shadow-black p-4`}
              >
                <div className="flex items-center gap-4">
                  <div
                    className={`w-8 h-8 bg-gradient-to-br ${metrica.iconColor} rounded-md shadow-md shadow-black flex items-center justify-center`}
                  >
                    <IconeComponent className="w-4 h-4 text-white" />
                  </div>

                  <div>
                    <p className={`text-xs font-semibold tracking-widest select-none ${metrica.textColor}`}>
                      {metrica.descricao}
                    </p>
                    <p className={`text-xl font-extrabold tracking-widest select-none italic ${metrica.valueColor}`}>
                      {metrica.valor}
                    </p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}