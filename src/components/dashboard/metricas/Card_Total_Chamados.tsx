'use client';

import { useAuth } from '@/context/AuthContext';
import { useQuery } from '@tanstack/react-query';
import axios from 'axios';

interface FilterProps {
  filters: {
    ano: number;
    mes: number;
    cliente: string;
    recurso: string;
    status: string;
  };
}

interface ApiResponse {
  totalChamados: number;
}

export default function CardTotalChamados({ filters }: FilterProps) {
  const { isAdmin, codCliente } = useAuth();

  const fetchData = async (): Promise<ApiResponse> => {
    const params = new URLSearchParams();
    params.append('mes', filters.mes.toString());
    params.append('ano', filters.ano.toString());
    params.append('isAdmin', isAdmin.toString());

    if (!isAdmin && codCliente) {
      params.append('codCliente', codCliente);
    }

    if (filters.cliente) params.append('cliente', filters.cliente);
    if (filters.recurso) params.append('recurso', filters.recurso);
    if (filters.status) params.append('status', filters.status);

    const res = await axios.get<ApiResponse>(
      `/api/metrica/total_chamados?${params.toString()}`,
    );
    return res.data;
  };

  const { data, isLoading, isError } = useQuery({
    queryKey: ['totalChamados', filters, isAdmin, codCliente],
    queryFn: fetchData,
    enabled: !!filters && (isAdmin || codCliente !== null), // só executa quando tiver tudo necessário
  });

  if (isLoading) {
    return (
      <div className="flex h-48 cursor-pointer flex-col items-center justify-center rounded-xl border border-gray-300 bg-white shadow-md shadow-black transition-all duration-300 hover:bg-gray-50 hover:shadow-lg">
        <div className="flex h-full flex-col items-center justify-center">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-indigo-200 border-t-indigo-600"></div>
          <span className="mt-3 tracking-widest font-semibold italic text-slate-600 select-none">Carregando...</span>
        </div>
      </div>
    );
  }

  if (isError || !data) {
    return (
      <div className="flex h-48 flex-col items-center justify-center rounded-xl border border-red-300 bg-white shadow-md shadow-black">
        <span className="text-red-600">Erro ao carregar os dados.</span>
      </div>
    );
  }

  return (
    <div className="flex h-48 cursor-pointer flex-col items-center justify-center rounded-xl border bg-white shadow-md shadow-black transition-all">
      <div className="text-center">
        <span className="mb-4 block text-lg font-semibold text-black tracking-widest select-none">
          Total de chamados
        </span>
        <span className="text-5xl font-extrabold tracking-widest select-none italic text-purple-700">
          {data.totalChamados.toLocaleString('pt-BR')}
        </span>
      </div>
    </div>
  );
}
