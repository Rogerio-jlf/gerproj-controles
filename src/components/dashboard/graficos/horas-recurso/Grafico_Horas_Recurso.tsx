'use client';

import { useAuth } from '@/context/AuthContext';
import axios from 'axios';
import { useEffect, useState } from 'react';
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

interface DetalhesRecursoProps {
  codrec_os: string;
  nome_recurso: string | null;
  horasExecutadas: number;
  percentual: number;
  numeroClientesUnicos: number;
}

interface FiltersProps {
  filters: {
    mes: string;
    ano: string;
    cliente?: string;
    recurso?: string;
    status?: string;
  };
}

interface ApiResponseProps {
  detalhesRecursos: DetalhesRecursoProps[];
  totalHorasExecutadas: number;
  numeroDeClientes: number;
  mediaHorasPorCliente: number;
}

type CustomBottomLabelsProps = {
  x?: number;
  y?: number;
  width?: number;
  height?: number;
  value: number;
  percentual: number;
};

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

function CustomBottomLabels({
  x,
  y,
  width,
  height,
  value,
  percentual,
}: CustomBottomLabelsProps) {
  const labelX = (x ?? 0) + (width ?? 0) + 7;
  const labelY = (y ?? 0) + (height ?? 0) / 2 + 1;

  const horasFormatada = Math.floor(value);
  const minutosFormatados = Math.round((value - horasFormatada) * 60);
  const hhmm = `${String(horasFormatada).padStart(2, '0')}:${String(minutosFormatados).padStart(2, '0')}`;

  return (
    <text
      x={labelX}
      y={labelY}
      textAnchor="start"
      fontSize={11}
      fill="#334155"
      fontWeight="600"
      className="font-mono"
    >
      {hhmm} ({percentual.toFixed(1)}%)
    </text>
  );
}

export default function GraficoHorasRecurso({ filters }: FiltersProps) {
  const [dados, setDados] = useState<DetalhesRecursoProps[]>([]);
  const [totais, setTotais] = useState({
    totalHorasExecutadas: 0,
    numeroDeClientes: 0,
    mediaHorasPorCliente: 0,
  });
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState<string | null>(null);

  const { isAdmin, codCliente, isLoggedIn } = useAuth();

  useEffect(() => {
    const fetchData = async () => {
      if (!isLoggedIn) {
        setErro('Usuário não autenticado');
        setLoading(false);
        return;
      }

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

        const data = res.data as ApiResponseProps;
        setDados(data.detalhesRecursos);
        setTotais({
          totalHorasExecutadas: data.totalHorasExecutadas,
          numeroDeClientes: data.numeroDeClientes,
          mediaHorasPorCliente: data.mediaHorasPorCliente,
        });
      } catch (err) {
        console.error('Erro ao carregar dados:', err);
        setErro('Erro ao carregar os dados');
        setDados([]);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [filters, isAdmin, codCliente, isLoggedIn]);

  // Formata os dados para exibição - usa nome do recurso ou código se não tiver nome
  const dadosFormatados = dados.map((dado) => {
    let nomeExibido = dado.nome_recurso || dado.codrec_os;

    // Se for um nome longo, pega só as primeiras palavras
    if (nomeExibido && nomeExibido.length > 20) {
      const palavras = nomeExibido.trim().split(/\s+/);
      nomeExibido = palavras.slice(0, 2).join(' ');
      if (palavras.length > 2) nomeExibido += '...';
    }

    return {
      ...dado,
      nomeExibido,
    };
  });

  return (
    <div className="relative h-[300px] w-full overflow-hidden">
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
                  Nenhum recurso encontrado para os filtros selecionados.
                </p>
              </div>
            </div>
          ) : (
            <div className="h-full w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={dadosFormatados}
                  layout="vertical"
                  margin={{ top: 20, right: 120, left: 80, bottom: 20 }}
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
                    type="number"
                    axisLine={false}
                    tickLine={false}
                    tick={{ fontSize: 11, fill: '#64748b', fontWeight: 500 }}
                    tickFormatter={(value) => `${value}h`}
                    domain={[0, 'dataMax']}
                  />
                  <YAxis
                    dataKey="nomeExibido"
                    type="category"
                    axisLine={false}
                    tickLine={false}
                    width={140}
                    interval={0}
                    tick={({ x, y, payload }) => (
                      <text
                        x={x}
                        y={y}
                        dy={4}
                        textAnchor="end"
                        fill="#374151"
                        fontWeight={600}
                        fontSize={12}
                        style={{ whiteSpace: 'nowrap' }}
                      >
                        {payload.value}
                      </text>
                    )}
                  />

                  <Bar
                    dataKey="horasExecutadas"
                    radius={[0, 8, 8, 0]}
                    stroke="#ffffff"
                    strokeWidth={1}
                  >
                    {dadosFormatados.map((_, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={`url(#gradient-${index})`}
                        className="cursor-pointer transition-all duration-300 hover:opacity-90"
                        style={{
                          filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.1))',
                        }}
                      />
                    ))}
                    <LabelList
                      position="bottom"
                      content={({ x, y, width, height, index }) => {
                        if (typeof index !== 'number') return null;
                        const dado = dadosFormatados[index];
                        return (
                          <CustomBottomLabels
                            x={typeof x === 'string' ? parseFloat(x) : x}
                            y={typeof y === 'string' ? parseFloat(y) : y}
                            width={
                              typeof width === 'string'
                                ? parseFloat(width)
                                : width
                            }
                            height={
                              typeof height === 'string'
                                ? parseFloat(height)
                                : height
                            }
                            value={dado.horasExecutadas}
                            percentual={dado.percentual}
                          />
                        );
                      }}
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
                        x2="1"
                        y2="0"
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
