'use client';

import { useAuth } from '@/context/AuthContext';
import { useQuery } from '@tanstack/react-query';
import {
    FaCheckCircle,
    FaClock,
    FaExclamationTriangle,
    FaHourglassHalf,
    FaPlay,
} from 'react-icons/fa';

interface FilterProps {
    filters: {
        ano: number;
        mes: number;
        cliente: string;
        recurso: string;
        status: string;
    };
}

interface TotalizadoresResponse {
    TOTAL_CHAMADOS: number;
    TOTAL_OS: number;
    CHAMADOS_FINALIZADO: number;
    CHAMADOS_STANDBY: number;
    CHAMADOS_EM_ATENDIMENTO: number;
    CHAMADOS_AGUARDANDO_VALIDACAO: number;
}

interface StatusCardProps {
    label: string;
    value: number;
    gradient: string;
    icon: React.ReactNode;
    position: 'left' | 'right';
}

const StatusCard = ({ label, value, gradient, icon, position }: StatusCardProps) => (
    <div
        className={`group flex flex-col gap-0.5 ${position === 'right' ? 'items-end' : 'items-start'}`}
    >
        <div className="flex items-center gap-1.5">
            {position === 'left' && (
                <div
                    className={`text-xs ${gradient} bg-clip-text text-transparent transition-transform group-hover:scale-110`}
                >
                    {icon}
                </div>
            )}
            <span className="text-[9px] font-bold tracking-wide text-slate-700 uppercase select-none sm:text-[10px] lg:text-xs">
                {label}
            </span>
            {position === 'right' && (
                <div
                    className={`text-xs ${gradient} bg-clip-text text-transparent transition-transform group-hover:scale-110`}
                >
                    {icon}
                </div>
            )}
        </div>
        <span
            className={`text-sm font-extrabold tracking-wide sm:text-base lg:text-lg ${gradient} bg-clip-text text-transparent transition-transform select-none group-hover:scale-105`}
        >
            {value}
        </span>
    </div>
);

export function CardTotalChamadosOS({ filters }: FilterProps) {
    const { isAdmin, codCliente } = useAuth();

    const fetchData = async (): Promise<TotalizadoresResponse> => {
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

        const response = await fetch(`/api/cards-metricas/total-chamados-os?${params.toString()}`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
            },
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.error('❌ [CARD TOTALIZADORES] Erro na resposta:', response.status, errorText);
            throw new Error(`Erro na requisição: ${response.status}`);
        }

        return response.json();
    };

    const { data, isLoading, isError, error } = useQuery({
        queryKey: ['totalizadoresChamados', filters, isAdmin, codCliente],
        queryFn: fetchData,
        enabled: !!filters && (isAdmin || codCliente !== null),
    });

    if (isLoading) {
        return (
            <div className="flex h-32 cursor-wait flex-col items-center justify-center rounded-xl border border-purple-200 bg-gradient-to-br from-white via-purple-50/30 to-purple-100/20 shadow-lg sm:h-36 lg:h-40">
                <div className="flex flex-col items-center justify-center gap-3">
                    <div className="relative">
                        <div className="h-10 w-10 animate-spin rounded-full border-4 border-purple-200 border-t-purple-600 sm:h-12 sm:w-12"></div>
                        <div className="absolute inset-0 h-10 w-10 animate-ping rounded-full border-4 border-purple-300 opacity-20 sm:h-12 sm:w-12"></div>
                    </div>
                    <span className="animate-pulse text-xs font-semibold tracking-wide text-purple-700 select-none sm:text-sm">
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

    const statusData = [
        {
            label: 'Finalizados',
            value: data.CHAMADOS_FINALIZADO ?? 0,
            gradient: 'bg-gradient-to-r from-green-600 to-emerald-600',
            icon: <FaCheckCircle className="h-3 w-3 sm:h-3.5 sm:w-3.5" />,
        },
        {
            label: 'Em Atendimento',
            value: data.CHAMADOS_EM_ATENDIMENTO ?? 0,
            gradient: 'bg-gradient-to-r from-blue-600 to-cyan-600',
            icon: <FaPlay className="h-3 w-3 sm:h-3.5 sm:w-3.5" />,
        },
        {
            label: 'Standby',
            value: data.CHAMADOS_STANDBY ?? 0,
            gradient: 'bg-gradient-to-r from-yellow-600 to-amber-600',
            icon: <FaHourglassHalf className="h-3 w-3 sm:h-3.5 sm:w-3.5" />,
        },
        {
            label: 'Aguard. Validação',
            value: data.CHAMADOS_AGUARDANDO_VALIDACAO ?? 0,
            gradient: 'bg-gradient-to-r from-orange-600 to-red-600',
            icon: <FaClock className="h-3 w-3 sm:h-3.5 sm:w-3.5" />,
        },
    ];

    return (
        <div className="group relative flex h-32 flex-col overflow-hidden rounded-xl border border-slate-200 bg-gradient-to-br from-white via-slate-50/50 to-purple-50/30 shadow-md shadow-black transition-all duration-300 hover:shadow-xl sm:h-36 lg:h-40">
            {/* Accent Line */}
            <div className="absolute top-0 right-0 left-0 h-2 bg-gradient-to-r from-purple-500 via-blue-500 to-purple-500"></div>

            {/* Total de Chamados - Centro Destaque */}
            <div className="absolute top-1/2 left-1/2 z-10 -translate-x-1/2 -translate-y-1/2">
                <div className="flex flex-col items-center gap-1 rounded-2xl border border-purple-100 bg-white/80 px-6 py-3 shadow-md shadow-black backdrop-blur-sm transition-transform duration-300 group-hover:scale-105">
                    <span className="text-[10px] font-bold tracking-widest text-slate-600 uppercase select-none sm:text-xs lg:text-sm">
                        Total Chamados
                    </span>
                    <span className="bg-gradient-to-r from-purple-600 via-blue-600 to-purple-600 bg-clip-text text-3xl font-black tracking-tight text-transparent select-none sm:text-4xl lg:text-5xl">
                        {data.TOTAL_CHAMADOS ?? 0}
                    </span>
                </div>
            </div>

            {/* Grid de Status */}
            <div className="absolute inset-0 p-3 sm:p-4">
                <div className="grid h-full grid-cols-2 gap-3 sm:gap-4">
                    {/* Superior Esquerdo */}
                    <div className="flex items-start justify-start">
                        <StatusCard {...statusData[0]} position="left" />
                    </div>

                    {/* Superior Direito */}
                    <div className="flex items-start justify-end">
                        <StatusCard {...statusData[1]} position="right" />
                    </div>

                    {/* Inferior Esquerdo */}
                    <div className="flex items-end justify-start">
                        <StatusCard {...statusData[2]} position="left" />
                    </div>

                    {/* Inferior Direito */}
                    <div className="flex items-end justify-end">
                        <StatusCard {...statusData[3]} position="right" />
                    </div>
                </div>
            </div>
        </div>
    );
}
