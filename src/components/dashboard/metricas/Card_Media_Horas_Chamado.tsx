'use client'; // Indica que este componente é um componente do lado do cliente (Next.js).

import { useAuth } from '@/context/AuthContext'; // Importa o contexto de autenticação.
import { formatarHorasTotaisSufixo } from '../../../formatters/formatar-hora';
import { useQuery } from '@tanstack/react-query';
import axios from 'axios'; // Biblioteca para requisições HTTP.

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
  mediaHora: number;
}

// Componente principal que exibe a média de horas por chamado.
export default function CardMediaHoraChamado({ filters }: FilterProps) {
  const { isAdmin, codCliente } = useAuth(); // Obtém informações do usuário autenticado.

  // Efeito para buscar os dados sempre que os filtros ou dados do usuário mudarem.
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

    // Faz a requisição para a API.
    const res = await axios.get<ApiResponse>(
      `/api/metrica/media_hora_chamado?${params.toString()}`,
    );
    return res.data;
  };

  const { data, isLoading, isError } = useQuery({
    queryKey: ['mediaHoraChamado', filters, isAdmin, codCliente],
    queryFn: fetchData,
    enabled: !!filters && (isAdmin || codCliente !== null), // Só executa quando tiver tudo necessário
  });

  // Renderiza o loading enquanto os dados estão sendo carregados.
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

  // Renderiza o card com a média de horas por chamado.
  return (
    <div className="flex h-48 cursor-pointer flex-col items-center justify-center rounded-xl border bg-white shadow-md shadow-black transition-all">
      <div className="text-center">
        <span className="mb-4 block text-lg font-semibold text-black tracking-widest select-none">
          Média de horas por chamado
        </span>
        <span className="text-5xl font-extrabold tracking-widest select-none italic text-purple-700">
          {formatarHorasTotaisSufixo(data.mediaHora) !== null
            ? formatarHorasTotaisSufixo(data.mediaHora)
            : '--'}{' '}
        </span>
      </div>
    </div>
  );
}
