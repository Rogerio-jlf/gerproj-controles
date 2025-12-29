'use client';

import { useAuth } from '@/context/AuthContext';
import { formatarHorasTotaisSufixo } from '@/formatters/formatar-hora';
import { useQuery } from '@tanstack/react-query';
import { FaChartLine, FaExclamationTriangle } from 'react-icons/fa';

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
    totalHorasContratadas: number;
    totalHorasExecutadas: number;
    detalhes: any[];
}

export function CardHorasContratadasHorasExecutadas({ filters }: FilterProps) {
    const { isAdmin, codCliente } = useAuth();

    const fetchData = async (): Promise<ApiResponse> => {
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
            `/api/cards-metricas/hrs-contratadas-hrs-executadas?${params.toString()}`,
            {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                },
            }
        );

        if (!response.ok) {
            throw new Error(`Erro na requisição: ${response.status}`);
        }

        return response.json();
    };

    const { data, isLoading, isError, error } = useQuery({
        queryKey: ['horasContratadasExecutadas', filters, isAdmin, codCliente],
        queryFn: fetchData,
        enabled: !!filters && (isAdmin || codCliente !== null),
    });

    if (isLoading) {
        return (
            <div className="flex h-32 cursor-wait flex-col items-center justify-center rounded-xl border border-blue-200 bg-gradient-to-br from-white via-blue-50/30 to-blue-100/20 shadow-lg sm:h-36 lg:h-40">
                <div className="flex flex-col items-center justify-center gap-3">
                    <div className="relative">
                        <div className="h-10 w-10 animate-spin rounded-full border-4 border-blue-200 border-t-blue-600 sm:h-12 sm:w-12"></div>
                        <div className="absolute inset-0 h-10 w-10 animate-ping rounded-full border-4 border-blue-300 opacity-20 sm:h-12 sm:w-12"></div>
                    </div>
                    <span className="animate-pulse text-xs font-semibold tracking-wide text-blue-700 select-none sm:text-sm">
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

    const totalHorasContratadas = data.totalHorasContratadas;
    const totalHorasExecutadas = data.totalHorasExecutadas;
    const percentual =
        totalHorasContratadas > 0 ? (totalHorasExecutadas / totalHorasContratadas) * 100 : 0;
    const diferenca = totalHorasExecutadas - totalHorasContratadas;

    const getBarColor = () => {
        if (diferenca > 0.5) return 'from-red-500 to-red-600';
        if (diferenca < -0.5) return 'from-emerald-500 to-emerald-600';
        return 'from-blue-500 to-blue-600';
    };

    const getStatusColor = () => {
        if (diferenca > 0.5) return 'text-red-600';
        if (diferenca < -0.5) return 'text-emerald-600';
        return 'text-blue-600';
    };

    const getStatusIcon = () => {
        if (diferenca > 0.5) return '⚠️';
        if (diferenca < -0.5) return '✅';
        return '📊';
    };

    return (
        <div className="group relative flex h-32 flex-col justify-center overflow-hidden rounded-xl border border-slate-200 bg-gradient-to-br from-white via-blue-50/30 to-slate-50/30 px-3 shadow-md shadow-black transition-all duration-300 hover:shadow-xl sm:h-36 sm:px-4 lg:h-40">
            {/* Accent Line */}
            <div className="absolute top-0 right-0 left-0 h-2 bg-gradient-to-r from-blue-500 via-indigo-500 to-blue-500"></div>

            {/* Título com Ícone */}
            <div className="relative z-10 mb-2 flex items-center justify-center gap-2 sm:mb-3">
                <div className="rounded-lg bg-gradient-to-br from-blue-500 to-indigo-500 p-1.5 shadow-sm">
                    <FaChartLine className="h-3 w-3 text-white sm:h-3.5 sm:w-3.5" />
                </div>
                <span className="text-[10px] font-bold tracking-widest text-slate-800 uppercase select-none sm:text-xs lg:text-sm">
                    Horas Contratadas × Executadas
                </span>
            </div>

            {/* Barras de progresso */}
            <div className="relative z-10 flex w-full flex-col gap-2 sm:gap-2.5 lg:gap-3">
                {/* Contratadas */}
                <div className="group/bar">
                    <div className="mb-1 flex items-center justify-between">
                        <span className="text-[9px] font-bold tracking-widest text-slate-800 uppercase select-none sm:text-[11px]">
                            Contratadas
                        </span>
                        <span className="text-[10px] font-bold tracking-widest text-blue-600 select-none sm:text-xs">
                            {formatarHorasTotaisSufixo(totalHorasContratadas)}
                        </span>
                    </div>
                    <div className="h-2 w-full overflow-hidden rounded-full bg-gray-200 shadow-inner transition-all group-hover/bar:h-2.5 sm:h-2.5">
                        <div
                            className="h-full rounded-full bg-gradient-to-r from-blue-400 to-blue-500 shadow-sm transition-all duration-500"
                            style={{ width: '100%' }}
                        />
                    </div>
                </div>

                {/* Executadas */}
                <div className="group/bar">
                    <div className="mb-1 flex items-center justify-between">
                        <div className="flex items-center gap-1.5">
                            <span className="text-sm">{getStatusIcon()}</span>
                            <span className="text-[9px] font-bold tracking-widest text-slate-800 uppercase select-none sm:text-[11px]">
                                Executadas
                            </span>
                        </div>
                        <span
                            className={`text-[10px] font-bold tracking-widest select-none sm:text-xs ${getStatusColor()}`}
                        >
                            {formatarHorasTotaisSufixo(totalHorasExecutadas)}
                        </span>
                    </div>
                    <div className="relative h-2 w-full overflow-hidden rounded-full bg-gray-200 shadow-inner transition-all group-hover/bar:h-2.5 sm:h-2.5">
                        <div
                            className={`h-full rounded-full bg-gradient-to-r ${getBarColor()} shadow-md transition-all duration-500 ${
                                percentual > 100 ? 'animate-pulse' : ''
                            }`}
                            style={{ width: `${Math.min(percentual, 100)}%` }}
                        />
                        {percentual > 100 && (
                            <div className="absolute inset-0 animate-pulse rounded-full border-2 border-red-400"></div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
