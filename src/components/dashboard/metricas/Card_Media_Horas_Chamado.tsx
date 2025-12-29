'use client';

import { useAuth } from '@/context/AuthContext';
import { formatarHorasTotaisSufixo } from '@/formatters/formatar-hora';
import { useQuery } from '@tanstack/react-query';
import { FaClock, FaExclamationTriangle } from 'react-icons/fa';

interface FilterProps {
    filters: {
        ano: number;
        mes: number;
        cliente: string;
        recurso: string;
        status: string;
    };
}

interface MediasResponse {
    MEDIA_HRS_POR_CHAMADO: number;
    MEDIA_HRS_POR_TAREFA: number;
    TOTAL_CHAMADOS_COM_HORAS: number;
    TOTAL_TAREFAS_COM_HORAS: number;
}

export function CardMediaHorasChamado({ filters }: FilterProps) {
    const { isAdmin, codCliente } = useAuth();

    const fetchData = async (): Promise<MediasResponse> => {
        const params = new URLSearchParams();
        params.append('mes', filters.mes.toString());
        params.append('ano', filters.ano.toString());
        params.append('isAdmin', isAdmin.toString());

        if (!isAdmin && codCliente) {
            params.append('codCliente', codCliente);
        }

        if (filters.cliente) params.append('codClienteFilter', filters.cliente);
        if (filters.recurso) params.append('codRecursoFilter', filters.recurso);
        if (filters.status) params.append('status', filters.status);

        const response = await fetch(
            `/api/cards-metricas/media-hrs-chamado-tarefa?${params.toString()}`,
            {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                },
            }
        );

        if (!response.ok) {
            const errorText = await response.text();
            console.error('❌ [CARD MÉDIAS] Erro na resposta:', response.status, errorText);
            throw new Error(`Erro na requisição: ${response.status}`);
        }

        return response.json();
    };

    const { data, isLoading, isError, error } = useQuery({
        queryKey: ['mediasHoras', filters, isAdmin, codCliente],
        queryFn: fetchData,
        enabled: !!filters && (isAdmin || codCliente !== null),
    });

    if (isLoading) {
        return (
            <div className="flex h-32 cursor-wait flex-col items-center justify-center rounded-xl border border-cyan-200 bg-gradient-to-br from-white via-cyan-50/30 to-cyan-100/20 shadow-lg sm:h-36 lg:h-40">
                <div className="flex flex-col items-center justify-center gap-3">
                    <div className="relative">
                        <div className="h-10 w-10 animate-spin rounded-full border-4 border-cyan-200 border-t-cyan-600 sm:h-12 sm:w-12"></div>
                        <div className="absolute inset-0 h-10 w-10 animate-ping rounded-full border-4 border-cyan-300 opacity-20 sm:h-12 sm:w-12"></div>
                    </div>
                    <span className="animate-pulse text-xs font-semibold tracking-wide text-cyan-700 select-none sm:text-sm">
                        Carregando dados...
                    </span>
                </div>
            </div>
        );
    }

    if (isError || !data) {
        return (
            <div className="flex h-32 cursor-not-allowed flex-col items-center justify-center rounded-xl border border-red-200 bg-gradient-to-br from-white via-red-50/30 to-red-100/20 shadow-lg sm:h-36 lg:h-40">
                <div className="flex flex-col items-center justify-center gap-2 px-4">
                    <FaExclamationTriangle className="animate-pulse text-red-500" size={24} />
                    <span className="text-center text-xs font-semibold text-red-700 select-none sm:text-sm">
                        Erro ao carregar os dados
                    </span>
                    {error && (
                        <span className="max-w-xs text-center text-[10px] text-red-600 select-none sm:text-xs">
                            {error instanceof Error ? error.message : 'Erro desconhecido'}
                        </span>
                    )}
                </div>
            </div>
        );
    }

    const mediaHorasChamado = data.MEDIA_HRS_POR_CHAMADO;

    return (
        <div className="group relative flex h-32 flex-col items-center justify-center overflow-hidden rounded-xl border border-slate-200 bg-gradient-to-br from-white via-cyan-50/30 to-blue-50/30 shadow-md shadow-black transition-all duration-300 hover:shadow-xl sm:h-36 lg:h-40">
            {/* Accent Line */}
            <div className="absolute top-0 right-0 left-0 h-2 bg-gradient-to-r from-cyan-500 via-blue-500 to-cyan-500"></div>

            {/* Conteúdo Centralizado */}
            <div className="relative z-10 flex flex-col items-center gap-2 px-4 sm:gap-3">
                <div className="flex items-center gap-2">
                    <div className="rounded-full bg-gradient-to-br from-cyan-500 to-blue-500 p-2 shadow-md transition-transform group-hover:scale-110">
                        <FaClock className="h-4 w-4 text-white sm:h-5 sm:w-5" />
                    </div>
                    <span className="text-[10px] font-bold tracking-widest text-slate-800 uppercase select-none sm:text-sm">
                        Média por Chamado
                    </span>
                </div>
                <div className="flex items-baseline gap-1">
                    <span className="bg-gradient-to-r from-cyan-600 via-blue-600 to-cyan-600 bg-clip-text text-3xl font-black tracking-tight text-transparent transition-transform select-none group-hover:scale-105 sm:text-4xl lg:text-5xl">
                        {mediaHorasChamado !== null && mediaHorasChamado !== undefined
                            ? formatarHorasTotaisSufixo(mediaHorasChamado)
                            : '--'}
                    </span>
                </div>
            </div>
        </div>
    );
}
