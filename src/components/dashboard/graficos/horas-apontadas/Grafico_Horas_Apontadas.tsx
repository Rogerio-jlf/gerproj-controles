'use client';

import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  LabelList,
  ResponsiveContainer,
  XAxis,
  YAxis,
} from 'recharts';

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

// Usando as mesmas cores do primeiro componente
const cores = [
  '#000000',
  '#6A5ACD',
  '#0000FF',
  '#008000',
  '#A020F0',
  '#FF00FF',
  '#DC143C',
  '#FFD700',
  '#008080',
  '#D2691E',
  '#FF4500',
  '#00C49F',
  '#FFBB28',
  '#FF8042',
  '#0088FE',
  '#FFBB28',
  '#FF8042',
];

interface MesProps {
  mes: number;
  ano: number;
  periodo: string;
  totalHoras: number;
  totalApontamentos: number;
  labelMes: string;
}

interface GraficoProps {
  dados: MesProps[];
  loading?: boolean;
  erro?: string | null;
  altura?: string;
}

export default function GraficoHorasApontadas({
  dados,
  loading = false,
  erro = null,
  altura = '300px',
}: GraficoProps) {
  const dadosFormatados = dados.map((item) => ({
    mes: meses[item.mes - 1],
    horas: item.totalHoras,
    mesNumero: item.mes,
  }));

  return (
    <div
      className={`relative w-full overflow-hidden`}
      style={{ height: altura }}
    >
      {/* Background */}
      <div className="absolute inset-0 bg-white"></div>
      <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/20 to-purple-50/30"></div>

      {/* Container principal */}
      <div className="relative flex h-full flex-col bg-white/40 backdrop-blur-sm">
        {/* Gráfico */}
        <div className="flex-1">
          {loading ? (
            <div className="flex h-full flex-col items-center justify-center">
              <div className="mb-4 h-10 w-10 animate-spin rounded-full border-4 border-indigo-200 border-t-indigo-600 lg:h-12 lg:w-12"></div>
              <p className="tracking-widest font-semibold italic text-slate-600 select-none">
                Carregando gráfico...
              </p>
            </div>
          ) : dados.length === 0 ? (
            <div className="flex h-full items-center justify-center text-gray-400">
              <div className="text-center">
                <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-gray-100">
                  <svg
                    className="h-8 w-8 text-gray-400"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z"
                    />
                  </svg>
                </div>
                <p className="text-sm lg:text-base">
                  Nenhum dado encontrado para o período selecionado.
                </p>
              </div>
            </div>
          ) : (
            <div className="h-full w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={dadosFormatados}
                  margin={{ top: 20, right: 30, left: 20, bottom: 40 }}
                  barCategoryGap={15}
                >
                  <CartesianGrid
                    strokeDasharray="2 4"
                    stroke="#e2e8f0"
                    horizontal
                    vertical={false}
                    opacity={0.6}
                  />
                  <XAxis
                    dataKey="mes"
                    axisLine={false}
                    tickLine={false}
                    tick={{ fontSize: 12, fill: '#374151', fontWeight: 600 }}
                    height={50}
                    interval={0}
                    textAnchor="middle"
                  />
                  <YAxis
                    axisLine={false}
                    tickLine={false}
                    tick={{ fontSize: 11, fill: '#64748b', fontWeight: 500 }}
                    tickFormatter={(value: number) => `${value}h`}
                    domain={[0, 'dataMax']}
                  />
                  <Bar
                    dataKey="horas"
                    barSize={35}
                    radius={[8, 8, 0, 0]}
                    stroke="#ffffff"
                    strokeWidth={1}
                  >
                    {dadosFormatados.map((entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={
                          entry.horas > 0
                            ? `url(#gradient-${index})`
                            : '#e5e7eb'
                        }
                        className="cursor-pointer transition-all duration-300 hover:opacity-90"
                        style={{
                          filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.1))',
                        }}
                      />
                    ))}
                    <LabelList
                      dataKey="horas"
                      position="top"
                      offset={8}
                      formatter={(value: number) => {
                        if (value === 0) return '';
                        const horas = Math.floor(value);
                        const minutos = Math.round((value - horas) * 60);
                        return minutos > 0
                          ? `${horas}h${minutos}m`
                          : `${horas}h`;
                      }}
                      style={{
                        fill: '#334155',
                        fontSize: 11,
                        fontWeight: 600,
                        textAnchor: 'middle',
                      }}
                      className="font-mono"
                    />
                  </Bar>

                  {/* Definindo gradientes para as barras */}
                  <defs>
                    {cores.map((cor, index) => (
                      <linearGradient
                        key={index}
                        id={`gradient-${index}`}
                        x1="0"
                        y1="0"
                        x2="0"
                        y2="1"
                      >
                        <stop offset="0%" stopColor={cor} stopOpacity={0.8} />
                        <stop offset="100%" stopColor={cor} stopOpacity={1} />
                      </linearGradient>
                    ))}
                  </defs>
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
