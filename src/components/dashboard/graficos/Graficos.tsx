import { IsError } from '@/components/utils/IsError';
import { IsLoading } from '@/components/utils/IsLoading';
import { useAuth } from '@/context/AuthContext';
import { formatarHorasArredondadas, formatarHorasTotaisSufixo } from '@/formatters/formatar-hora';
import { formatarNumeros } from '@/formatters/formatar-numeros';
import { corrigirTextoCorrompido } from '@/formatters/formatar-texto-corrompido';
import {
    renderizarDoisPrimeirosNomes,
    renderizarPrimeiroNome,
} from '@/formatters/remover-acentuacao';
import { useQuery } from '@tanstack/react-query';
import React from 'react';
import {
    Bar,
    BarChart,
    CartesianGrid,
    Cell,
    Legend,
    Line,
    LineChart,
    Pie,
    PieChart,
    ResponsiveContainer,
    Tooltip,
    XAxis,
    YAxis,
} from 'recharts';
import { ContainerCardsMetricas } from '../metricas/Container_Cards_Metricas';

// Cores para os gráficos
const COLORS = {
    primary: '#3b82f6',
    secondary: '#8b5cf6',
    success: '#10b981',
    warning: '#f59e0b',
    danger: '#ef4444',
    info: '#06b6d4',
    gradient: '#f97316',
    pie: ['#3b82f6', '#8b5cf6', '#10b981', '#f59e0b', '#ef4444', '#06b6d4', '#ec4899', '#6366f1'],
};

// Componente de Tooltip customizado
type CustomTooltipProps = {
    active?: boolean;
    payload?: Array<{ name?: string; value?: any; color?: string }>;
    label?: any;
    labelFormatter?: (label: any) => string;
    valueFormatter?: (value: any) => string;
};

const CustomTooltip: React.FC<CustomTooltipProps> = ({
    active,
    payload,
    label,
    labelFormatter,
    valueFormatter,
}) => {
    if (!active || !payload || !payload.length) return null;

    return (
        <div className="rounded-md border bg-white p-2 shadow-md shadow-black sm:p-3">
            <p className="mb-1 text-xs font-semibold tracking-widest text-slate-800 select-none sm:mb-2 sm:text-sm">
                {labelFormatter ? labelFormatter(label) : label}
            </p>
            {payload.map((entry, index) => (
                <p
                    key={index}
                    className="text-[10px] tracking-widest select-none sm:text-xs"
                    style={{ color: entry?.color || undefined }}
                >
                    {entry?.name}:{' '}
                    <span className="font-bold tracking-widest select-none">
                        {valueFormatter ? valueFormatter(entry?.value) : entry?.value}
                    </span>
                </p>
            ))}
        </div>
    );
};

// Componente de card para os gráficos
type ChartCardProps = {
    title: string;
    children?: React.ReactNode;
    variant?: 'primary' | 'secondary' | 'success' | 'warning' | 'danger' | 'info';
};

const borderColorClasses = {
    primary: 'border-l-blue-600',
    secondary: 'border-l-purple-600',
    success: 'border-l-green-600',
    warning: 'border-l-orange-600',
    danger: 'border-l-red-600',
    info: 'border-l-cyan-600',
};

const ChartCard: React.FC<ChartCardProps> = ({ title, children, variant = 'primary' }) => (
    <div
        className={`rounded-lg border border-l-8 ${borderColorClasses[variant]} bg-white p-3 shadow-md shadow-black transition-all duration-300 hover:shadow-xl sm:rounded-xl sm:p-4 lg:p-6`}
    >
        <h3 className="mb-3 text-sm font-extrabold tracking-widest text-black uppercase select-none sm:mb-4 sm:text-base lg:text-lg">
            {title}
        </h3>
        {children}
    </div>
);

// Componente de Erro
type ErrorMessageProps = {
    message: string;
    onRetry?: () => void;
};

const ErrorMessage: React.FC<ErrorMessageProps> = ({ message, onRetry }) => (
    <div className="rounded-lg border border-red-200 bg-red-50 p-3 sm:p-4">
        <p className="mb-2 text-xs text-red-800 sm:text-sm">❌ {message}</p>
        {onRetry && (
            <button
                onClick={onRetry}
                className="rounded-md bg-red-600 px-3 py-1.5 text-xs text-white transition-all hover:bg-red-700 sm:px-4 sm:py-2 sm:text-sm"
            >
                Tentar Novamente
            </button>
        )}
    </div>
);

// Interface para os filtros recebidos via props
interface FilterProps {
    filters: {
        ano: number;
        mes: number;
        cliente: string;
        recurso: string;
        status: string;
    };
}

// Função para buscar os dados da API
const fetchOrdensServico = async (
    filters: FilterProps['filters'],
    isAdmin: boolean,
    codCliente: string | null
) => {
    const params = new URLSearchParams({
        isAdmin: isAdmin.toString(),
        mes: filters.mes.toString(),
        ano: filters.ano.toString(),
    });

    if (!isAdmin && codCliente) {
        params.append('codCliente', codCliente);
    }
    if (filters.cliente) {
        params.append('codClienteFilter', filters.cliente);
    }
    if (filters.recurso) {
        params.append('codRecursoFilter', filters.recurso);
    }
    if (filters.status) {
        params.append('status', filters.status);
    }

    const response = await fetch(`/api/cards-metricas/graficos?${params.toString()}`);

    if (!response.ok) {
        throw new Error(`Erro HTTP: ${response.status}`);
    }

    return response.json();
};

export function Graficos({ filters }: FilterProps) {
    const { isAdmin, codCliente } = useAuth();

    const {
        data: dados,
        isLoading,
        error,
        refetch,
    } = useQuery({
        queryKey: ['graficos', filters, isAdmin, codCliente],
        queryFn: () => fetchOrdensServico(filters, isAdmin, codCliente),
        staleTime: 1000 * 60 * 5,
        retry: 1,
    });

    if (isLoading) {
        return <IsLoading isLoading={isLoading} title="Aguarde, buscando dados do servidor" />;
    }

    if (error) {
        return (
            <IsError isError={!!error} error={error as Error} title="Erro ao Carregar Chamados" />
        );
    }

    if (!dados || !dados.graficos) {
        return (
            <div className="rounded-lg border border-gray-200 bg-gradient-to-br from-white via-indigo-50/20 to-purple-50/30 p-4 shadow-md sm:rounded-xl sm:p-6">
                <h1 className="mb-6 text-xl font-bold text-gray-900 sm:mb-8 sm:text-2xl lg:text-3xl">
                    GRÁFICOS DE ANÁLISES
                </h1>
                <p className="text-sm text-gray-600 sm:text-base">Nenhum dado disponível</p>
            </div>
        );
    }

    const {
        horasPorDia,
        topChamados,
        horasPorStatus,
        horasPorRecurso,
        horasPorCliente,
        horasPorMes,
    } = dados.graficos;
    const { totalizadores } = dados;

    return (
        <div className="h-full overflow-y-auto border-b-slate-500 px-3 pb-4 sm:px-4 sm:pb-6">
            <div className="flex w-full flex-col gap-6 sm:gap-8 lg:gap-10">
                <div className="flex flex-col gap-2">
                    <ContainerCardsMetricas filters={filters} />
                </div>

                {/* Grid de gráficos - área com scroll */}
                <div className="grid grid-cols-1 gap-4 sm:gap-6 lg:grid-cols-2 lg:gap-10">
                    {/* Gráfico 1: Evolução Diária de Horas */}
                    {horasPorDia && horasPorDia.length > 0 && (
                        <ChartCard
                            title={`Evolução Diária de Horas - ${filters.mes}/${filters.ano}`}
                            variant="primary"
                        >
                            <ResponsiveContainer
                                width="100%"
                                height={300}
                                className="sm:h-[320px] lg:h-[350px]"
                            >
                                <LineChart data={horasPorDia}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                                    <XAxis
                                        dataKey="data"
                                        stroke="#6b7280"
                                        tickLine={false}
                                        axisLine={{ stroke: '#d1d5db', strokeWidth: 1 }}
                                        tick={{
                                            fill: '#111827',
                                            fontSize: 11,
                                            fontWeight: 800,
                                            letterSpacing: '0.2em',
                                            textAnchor: 'middle',
                                        }}
                                        tickFormatter={(value) => {
                                            const day = value.split(/[\/\-]/)[0];
                                            return day;
                                        }}
                                    />
                                    <YAxis
                                        stroke="#6b7280"
                                        tickLine={false}
                                        axisLine={{ stroke: '#d1d5db', strokeWidth: 1 }}
                                        tick={{
                                            fill: '#111827',
                                            fontSize: 11,
                                            fontWeight: 800,
                                            letterSpacing: '0.2em',
                                        }}
                                    />
                                    <Tooltip
                                        content={
                                            <CustomTooltip
                                                labelFormatter={(label) => `Data: ${label}`}
                                                valueFormatter={(value) =>
                                                    `${formatarHorasTotaisSufixo(value)}`
                                                }
                                            />
                                        }
                                    />
                                    <Legend wrapperStyle={{ fontSize: '12px' }} />
                                    <Line
                                        type="monotone"
                                        dataKey="horas"
                                        stroke={COLORS.primary}
                                        strokeWidth={2}
                                        dot={{ fill: COLORS.primary, r: 3 }}
                                        activeDot={{ r: 5 }}
                                        name="Horas Trabalhadas"
                                    />
                                </LineChart>
                            </ResponsiveContainer>
                            <div className="mt-3 rounded-md border bg-slate-100 p-2 shadow-xs shadow-black sm:mt-4 sm:p-3">
                                <p className="text-xs font-extrabold tracking-widest text-black select-none sm:text-sm lg:text-base">
                                    <span>Total no período:</span>{' '}
                                    {formatarHorasTotaisSufixo(totalizadores?.TOTAL_HRS || 0)}
                                </p>
                            </div>
                        </ChartCard>
                    )}

                    {/* Gráfico 2: Top Chamados */}
                    {topChamados && topChamados.length > 0 && (
                        <ChartCard
                            title={`Top 5 Chamados por Horas - ${filters.mes}/${filters.ano}`}
                            variant="secondary"
                        >
                            <ResponsiveContainer
                                width="100%"
                                height={300}
                                className="sm:h-[320px] lg:h-[350px]"
                            >
                                <BarChart
                                    data={topChamados.slice(0, 5)}
                                    margin={{ top: 20, right: 10, left: 10, bottom: 20 }}
                                >
                                    <XAxis
                                        dataKey="chamado"
                                        stroke="#6b7280"
                                        tickLine={false}
                                        axisLine={{ stroke: '#d1d5db', strokeWidth: 1 }}
                                        tick={{
                                            fill: '#111827',
                                            fontSize: 11,
                                            fontWeight: 800,
                                            letterSpacing: '0.2em',
                                            textAnchor: 'middle',
                                        }}
                                        tickFormatter={(value) => `#${formatarNumeros(value)}`}
                                        textAnchor="end"
                                        interval={0}
                                        height={60}
                                    />
                                    <YAxis
                                        stroke="#6b7280"
                                        tickLine={false}
                                        axisLine={{ stroke: '#d1d5db', strokeWidth: 1 }}
                                        tick={{
                                            fill: '#111827',
                                            fontSize: 11,
                                            fontWeight: 800,
                                            letterSpacing: '0.2em',
                                        }}
                                    />
                                    <Tooltip
                                        content={
                                            <CustomTooltip
                                                labelFormatter={(label) =>
                                                    `Chamado - #${formatarNumeros(label)}`
                                                }
                                                valueFormatter={(value) =>
                                                    `${formatarHorasTotaisSufixo(value)}`
                                                }
                                            />
                                        }
                                    />
                                    <Legend wrapperStyle={{ fontSize: '12px' }} />
                                    <Bar
                                        dataKey="horas"
                                        fill={COLORS.secondary}
                                        radius={[8, 8, 0, 0]}
                                        name="Horas Consumidas"
                                        label={{
                                            position: 'top',
                                            fill: '#111827',
                                            fontSize: 10,
                                            fontWeight: 800,
                                            letterSpacing: '0.2em',
                                            formatter: (value: number) =>
                                                formatarHorasArredondadas(value),
                                        }}
                                    />
                                </BarChart>
                            </ResponsiveContainer>
                            <div className="mt-3 space-y-1 sm:mt-4">
                                {topChamados.slice(0, 3).map(
                                    (
                                        chamado: {
                                            chamado: string | number;
                                            cliente: string;
                                            horas: number;
                                        },
                                        index: number
                                    ) => (
                                        <div
                                            key={chamado.chamado}
                                            className="flex items-center justify-between text-xs sm:text-sm"
                                        >
                                            <span className="font-extrabold tracking-widest text-black select-none">
                                                {index + 1} - {chamado.cliente}
                                            </span>
                                            <span className="font-extrabold tracking-widest text-black select-none">
                                                {formatarHorasTotaisSufixo(chamado.horas)}
                                            </span>
                                        </div>
                                    )
                                )}
                            </div>
                        </ChartCard>
                    )}

                    {/* Gráfico 3: Distribuição por Status */}
                    {isAdmin && horasPorStatus && horasPorStatus.length > 0 && (
                        <ChartCard
                            title={`Distribuição de Horas por Status - ${filters.mes}/${filters.ano}`}
                            variant="success"
                        >
                            <ResponsiveContainer
                                width="100%"
                                height={300}
                                className="sm:h-[320px] lg:h-[350px]"
                            >
                                <PieChart>
                                    <Pie
                                        data={horasPorStatus}
                                        cx="50%"
                                        cy="50%"
                                        labelLine={false}
                                        label={(entry: { status?: string; percentual?: number }) =>
                                            `${entry.status}: ${entry.percentual}%`
                                        }
                                        outerRadius={80}
                                        fill="#8884d8"
                                        dataKey="horas"
                                    >
                                        {horasPorStatus.map(
                                            (
                                                entry: {
                                                    status: string;
                                                    horas: number;
                                                    percentual?: number;
                                                },
                                                index: number
                                            ) => (
                                                <Cell
                                                    key={`cell-${index}`}
                                                    fill={COLORS.pie[index % COLORS.pie.length]}
                                                />
                                            )
                                        )}
                                    </Pie>
                                    <Tooltip
                                        content={
                                            <CustomTooltip
                                                valueFormatter={(value) =>
                                                    `${formatarHorasTotaisSufixo(value)}`
                                                }
                                            />
                                        }
                                    />
                                </PieChart>
                            </ResponsiveContainer>
                            <div className="mt-3 grid grid-cols-2 gap-2 sm:mt-4">
                                {horasPorStatus.map(
                                    (
                                        status: {
                                            status: string;
                                            horas: number;
                                            percentual?: number;
                                        },
                                        index: number
                                    ) => (
                                        <div
                                            key={status.status}
                                            className="flex items-center gap-2"
                                        >
                                            <div
                                                className="h-2.5 w-2.5 rounded-full sm:h-3 sm:w-3"
                                                style={{
                                                    backgroundColor:
                                                        COLORS.pie[index % COLORS.pie.length],
                                                }}
                                            />
                                            <span className="text-[10px] font-semibold tracking-widest text-slate-800 select-none sm:text-xs lg:text-sm">
                                                {status.status}
                                            </span>
                                        </div>
                                    )
                                )}
                            </div>
                        </ChartCard>
                    )}

                    {/* Gráfico 4: Horas por Recurso */}
                    {horasPorRecurso && horasPorRecurso.length > 0 && (
                        <ChartCard
                            title={`Horas por Recurso - ${filters.mes}/${filters.ano}`}
                            variant="info"
                        >
                            <ResponsiveContainer
                                width="100%"
                                height={300}
                                className="sm:h-[320px] lg:h-[350px]"
                            >
                                <BarChart data={horasPorRecurso} layout="vertical">
                                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                                    <XAxis
                                        type="number"
                                        stroke="#6b7280"
                                        tickLine={false}
                                        axisLine={{ stroke: '#d1d5db', strokeWidth: 1 }}
                                        tick={{
                                            fill: '#111827',
                                            fontSize: 11,
                                            fontWeight: 800,
                                            letterSpacing: '0.2em',
                                            textAnchor: 'middle',
                                        }}
                                    />
                                    <YAxis
                                        dataKey="recurso"
                                        type="category"
                                        width={120}
                                        stroke="#6b7280"
                                        tickLine={false}
                                        axisLine={{ stroke: '#d1d5db', strokeWidth: 1 }}
                                        tick={{
                                            fill: '#111827',
                                            fontSize: 11,
                                            fontWeight: 800,
                                            letterSpacing: '0.2em',
                                        }}
                                        tickFormatter={renderizarPrimeiroNome}
                                        interval={0}
                                        height={60}
                                    />
                                    <Tooltip
                                        content={
                                            <CustomTooltip
                                                labelFormatter={(label) =>
                                                    renderizarDoisPrimeirosNomes(
                                                        corrigirTextoCorrompido(label)
                                                    )
                                                }
                                                valueFormatter={(value) =>
                                                    `${formatarHorasTotaisSufixo(value)}`
                                                }
                                            />
                                        }
                                    />
                                    <Legend wrapperStyle={{ fontSize: '12px' }} />
                                    <Bar
                                        dataKey="horas"
                                        fill={COLORS.success}
                                        radius={[0, 8, 8, 0]}
                                        name="Horas Trabalhadas"
                                    />
                                </BarChart>
                            </ResponsiveContainer>
                            <div className="mt-3 rounded-md border bg-slate-100 p-2 shadow-xs shadow-black sm:mt-4 sm:p-3">
                                <p className="text-xs font-extrabold tracking-widest text-black select-none sm:text-sm lg:text-base">
                                    <span className="font-semibold">Média por recurso:</span>{' '}
                                    {formatarHorasTotaisSufixo(
                                        horasPorRecurso.reduce(
                                            (acc: number, r: { horas: number }) => acc + r.horas,
                                            0
                                        ) / horasPorRecurso.length
                                    )}
                                </p>
                            </div>
                        </ChartCard>
                    )}

                    {/* Gráfico 5: Horas por Cliente */}
                    {isAdmin && horasPorCliente && horasPorCliente.length > 0 && (
                        <ChartCard
                            title={`Horas por Cliente - ${filters.mes}/${filters.ano}`}
                            variant="warning"
                        >
                            <ResponsiveContainer
                                width="100%"
                                height={300}
                                className="sm:h-[320px] lg:h-[350px]"
                            >
                                <BarChart
                                    data={horasPorCliente.slice(0, 10)}
                                    margin={{ top: 20, right: 10, left: 10, bottom: 20 }}
                                >
                                    <XAxis
                                        dataKey="cliente"
                                        stroke="#6b7280"
                                        tickLine={false}
                                        axisLine={{ stroke: '#d1d5db', strokeWidth: 1 }}
                                        tick={{
                                            fill: '#111827',
                                            fontSize: 11,
                                            fontWeight: 800,
                                            letterSpacing: '0.2em',
                                        }}
                                        tickFormatter={renderizarPrimeiroNome}
                                        angle={-35}
                                        textAnchor="end"
                                        interval={0}
                                        height={100}
                                    />
                                    <YAxis
                                        stroke="#6b7280"
                                        tickLine={false}
                                        axisLine={{ stroke: '#d1d5db', strokeWidth: 1 }}
                                        tick={{
                                            fill: '#111827',
                                            fontSize: 11,
                                            fontWeight: 800,
                                            letterSpacing: '0.2em',
                                        }}
                                    />
                                    <Tooltip
                                        content={
                                            <CustomTooltip
                                                valueFormatter={(value) =>
                                                    `${formatarHorasTotaisSufixo(value)}`
                                                }
                                            />
                                        }
                                    />
                                    <Legend wrapperStyle={{ fontSize: '12px' }} />
                                    <Bar
                                        dataKey="horas"
                                        fill={COLORS.info}
                                        radius={[8, 8, 0, 0]}
                                        name="Horas"
                                        label={{
                                            position: 'top',
                                            fill: '#111827',
                                            fontSize: 10,
                                            fontWeight: 800,
                                            letterSpacing: '0.2em',
                                            formatter: (value: number) =>
                                                formatarHorasArredondadas(value),
                                        }}
                                    />
                                </BarChart>
                            </ResponsiveContainer>
                        </ChartCard>
                    )}

                    {/* Gráfico 6: Horas por Mês */}
                    {horasPorMes && horasPorMes.length > 0 && (
                        <ChartCard title={`Horas Totais por Mês - ${filters.ano}`} variant="danger">
                            <ResponsiveContainer
                                width="100%"
                                height={300}
                                className="sm:h-[320px] lg:h-[350px]"
                            >
                                <BarChart
                                    data={horasPorMes}
                                    margin={{ top: 20, right: 10, left: 10, bottom: 20 }}
                                >
                                    <XAxis
                                        dataKey="mes"
                                        stroke="#6b7280"
                                        tickLine={false}
                                        axisLine={{ stroke: '#d1d5db', strokeWidth: 1 }}
                                        tick={{
                                            fill: '#111827',
                                            fontSize: 11,
                                            fontWeight: 800,
                                            letterSpacing: '0.2em',
                                            textAnchor: 'middle',
                                        }}
                                        interval={0}
                                        height={60}
                                    />
                                    <YAxis
                                        stroke="#6b7280"
                                        tickLine={false}
                                        axisLine={{ stroke: '#d1d5db', strokeWidth: 1 }}
                                        tick={{
                                            fill: '#111827',
                                            fontSize: 11,
                                            fontWeight: 800,
                                            letterSpacing: '0.2em',
                                        }}
                                    />
                                    <Tooltip
                                        content={
                                            <CustomTooltip
                                                labelFormatter={(label) => label}
                                                valueFormatter={(value) =>
                                                    `${formatarHorasTotaisSufixo(value)}`
                                                }
                                            />
                                        }
                                    />
                                    <Legend wrapperStyle={{ fontSize: '12px' }} />
                                    <Bar
                                        dataKey="horas"
                                        fill={COLORS.gradient}
                                        radius={[8, 8, 0, 0]}
                                        name="Total de Horas"
                                        label={{
                                            position: 'top',
                                            fill: '#111827',
                                            fontSize: 10,
                                            fontWeight: 800,
                                            letterSpacing: '0.2em',
                                            formatter: (value: number) =>
                                                formatarHorasArredondadas(value),
                                        }}
                                    >
                                        {horasPorMes.map((entry: any, index: number) => (
                                            <Cell
                                                key={`cell-${index}`}
                                                fill={
                                                    entry.mesNum === filters.mes
                                                        ? COLORS.danger
                                                        : COLORS.gradient
                                                }
                                            />
                                        ))}
                                    </Bar>
                                </BarChart>
                            </ResponsiveContainer>
                            <div className="mt-3 flex flex-col items-start justify-between gap-2 rounded-md border bg-slate-100 p-2 text-xs font-extrabold tracking-widest text-black shadow-xs shadow-black select-none sm:mt-4 sm:flex-row sm:items-center sm:gap-0 sm:p-3 sm:text-sm lg:text-base">
                                <div>
                                    <span className="font-semibold">Total anual:</span>{' '}
                                    {formatarHorasTotaisSufixo(
                                        horasPorMes.reduce(
                                            (acc: number, m: { horas: number }) => acc + m.horas,
                                            0
                                        )
                                    )}
                                </div>
                                <div>
                                    <span className="font-semibold">Média mensal:</span>{' '}
                                    {formatarHorasTotaisSufixo(
                                        horasPorMes.reduce(
                                            (acc: number, m: { horas: number }) => acc + m.horas,
                                            0
                                        ) / 12
                                    )}
                                </div>
                            </div>
                        </ChartCard>
                    )}
                </div>
            </div>
        </div>
    );
}
