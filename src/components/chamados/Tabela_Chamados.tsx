// src/components/chamados/Tabela_Chamados.tsx
'use client';

import { useAuth } from '@/context/AuthContext';
import { useFilters } from '@/context/FiltersContext';
import { useQuery } from '@tanstack/react-query';
import {
  ColumnFiltersState,
  flexRender,
  getCoreRowModel,
  useReactTable,
} from '@tanstack/react-table';
import React, { useCallback, useMemo, useState } from 'react';
import { FaEraser } from 'react-icons/fa';
import { FiRefreshCw } from 'react-icons/fi';
import { IoCall } from 'react-icons/io5';
import { IsError } from '../utils/IsError';
import { IsLoading } from '../utils/IsLoading';
import {
  ChamadoRowProps,
  getColumnWidth,
  getColunasChamados,
} from './Colunas_Tabela_Chamados';
import {
  getColumnWidthOS,
  getColunasOS,
  OSRowProps,
} from './Colunas_Tabela_OS';
import {
  FiltroHeaderChamados,
  useFiltrosChamados,
} from './Filtro_Header_Tabela_Chamados';
import { ModalOS } from './Modal_OS';

// ==================== INTERFACE ====================
interface ApiResponseChamados {
  success: boolean;
  total: number;
  data: ChamadoRowProps[];
}

interface ApiResponseOS {
  success: boolean;
  codChamado: number;
  totais: {
    totalOS: number;
    totalHoras: number;
    totalValor: number;
  };
  data: OSRowProps[];
}

// ==================== UTILITÁRIOS ====================
const createAuthHeaders = () => ({
  'Content-Type': 'application/json',
  'x-is-logged-in': localStorage.getItem('isLoggedIn') || 'false',
  'x-is-admin': localStorage.getItem('isAdmin') || 'false',
  'x-user-email': localStorage.getItem('userEmail') || '',
  'x-cod-cliente': localStorage.getItem('codCliente') || '',
});

// ==================== FUNÇÕES DE FETCH ====================
// Fetch de Chamados
const fetchChamados = async ({
  ano,
  mes,
  isAdmin,
  codCliente,
  cliente,
  recurso,
  status,
}: {
  ano: string;
  mes: string;
  isAdmin: boolean;
  codCliente: string | null;
  cliente?: string;
  recurso?: string;
  status?: string;
}): Promise<ApiResponseChamados> => {
  const params = new URLSearchParams({
    ano,
    mes,
    isAdmin: String(isAdmin),
    ...(cliente && { codClienteFilter: cliente }),
    ...(recurso && { codRecursoFilter: recurso }),
    ...(status && { statusFilter: status }),
  });

  if (!isAdmin && codCliente) {
    params.append('codCliente', codCliente);
  }

  const response = await fetch(`/api/chamados?${params.toString()}`, {
    headers: createAuthHeaders(),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || 'Erro ao carregar chamados');
  }

  return response.json();
};

// Fetch de OS por Chamado
const fetchOSByChamado = async ({
  codChamado,
  isAdmin,
  codCliente,
}: {
  codChamado: number;
  isAdmin: boolean;
  codCliente: string | null;
}): Promise<ApiResponseOS> => {
  const params = new URLSearchParams({
    isAdmin: String(isAdmin),
  });

  if (!isAdmin && codCliente) {
    params.append('codCliente', codCliente);
  }

  const response = await fetch(
    `/api/chamados/${codChamado}/os?${params.toString()}`,
    {
      headers: createAuthHeaders(),
    },
  );

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || 'Erro ao carregar OS');
  }

  return response.json();
};

// ==================== COMPONENTE PRINCIPAL ====================
export function TabelaChamados() {
  const { isAdmin, codCliente, isLoggedIn } = useAuth();
  const { filters } = useFilters();
  const { ano, mes, cliente, recurso, status } = filters;

  // Estados
  const [expandedRows, setExpandedRows] = useState<Set<number>>(new Set());
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedOS, setSelectedOS] = useState<OSRowProps | null>(null);

  const { columnFilterFn } = useFiltrosChamados();
  const hasExpandedRow = expandedRows.size > 0;

  // Query de Chamados
  const {
    data: apiData,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: [
      'tabela-chamados',
      ano ?? 0,
      mes ?? 0,
      cliente ?? '',
      recurso ?? '',
      status ?? '',
      isAdmin,
      codCliente ?? '',
    ],
    queryFn: () =>
      fetchChamados({
        ano: String(ano ?? new Date().getFullYear()),
        mes: String(mes ?? new Date().getMonth() + 1),
        isAdmin,
        codCliente,
        cliente: cliente ?? '',
        recurso: recurso ?? '',
        status: status ?? '',
      }),
    enabled: isLoggedIn && !!ano && !!mes,
    staleTime: 1000 * 60 * 5,
    retry: 2,
  });

  const data = useMemo(() => {
    const chamados = apiData?.data ?? [];
    return chamados;
  }, [apiData?.data]);

// Função para expandir/recolher linha
  const toggleRow = useCallback((codChamado: number) => {
    setExpandedRows((prev) => {
      if (prev.size > 0 && !prev.has(codChamado)) {
        return prev;
      }

      const newSet = new Set(prev);
      const isExpanding = !newSet.has(codChamado);
      
      if (newSet.has(codChamado)) {
        newSet.delete(codChamado);
      } else {
        newSet.add(codChamado);
        
        // Scroll automático após expandir
        setTimeout(() => {
          const rowElement = document.querySelector(`[data-chamado-id="${codChamado}"]`) as HTMLElement;
          if (rowElement) {
            const container = rowElement.closest('.overflow-y-auto') as HTMLElement;
            const thead = document.querySelector('thead');
            
            if (container && thead) {
              const theadHeight = thead.getBoundingClientRect().height;
              const containerRect = container.getBoundingClientRect();
              const rowRect = rowElement.getBoundingClientRect();
              
              // Calcula a posição relativa da linha dentro do container
              const rowRelativeTop = rowRect.top - containerRect.top;
              const currentScroll = container.scrollTop;
              
              // Scroll suave para posicionar a linha logo abaixo do header
              container.scrollTo({
                top: currentScroll + rowRelativeTop - 80, // 10px de margem
                behavior: 'smooth'
              });
            }
          }
        }, 100); // Pequeno delay para garantir que o DOM foi atualizado
      }
      return newSet;
    });
  }, []);

  // Colunas dinâmicas
  const columns = useMemo(
    () => getColunasChamados(isAdmin, expandedRows),
    [isAdmin, expandedRows],
  );

  // ==================== CALLBACKS ====================
  const clearAllFilters = useCallback(() => {
    setColumnFilters([]);
  }, []);

  const openModal = useCallback((row: OSRowProps) => {
    setSelectedOS(row);
    setIsModalOpen(true);
  }, []);

  const closeModal = useCallback(() => {
    setIsModalOpen(false);
    setSelectedOS(null);
  }, []);

  const handleSaveValidation = useCallback(
    (updatedRow: OSRowProps) => {
      refetch();
    },
    [refetch],
  );

  // ==================== MEMORIZAÇÕES ====================
  const hasActiveFilters = useMemo(() => {
    return columnFilters.some((filter) => {
      const value = filter.value;
      if (value == null) return false;
      if (typeof value === 'string') {
        return value.trim() !== '';
      }
      return true;
    });
  }, [columnFilters]);

  const dadosFiltrados = useMemo(() => {
    if (!hasActiveFilters) {
      return data;
    }

    return data.filter((row) => {
      return columnFilters.every((filter) => {
        const columnId = filter.id;
        const filterValue = filter.value;

        if (
          !filterValue ||
          (typeof filterValue === 'string' && filterValue.trim() === '')
        ) {
          return true;
        }

        const normalizedFilterValue =
          typeof filterValue === 'string' ? filterValue : String(filterValue);

        const fakeRow: any = {
          getValue: (id: string) => row[id as keyof ChamadoRowProps],
        };

        return columnFilterFn(
          fakeRow,
          columnId as string,
          normalizedFilterValue,
        );
      });
    });
  }, [data, columnFilters, hasActiveFilters, columnFilterFn]);

  const table = useReactTable<ChamadoRowProps>({
    data: dadosFiltrados,
    columns,
    getCoreRowModel: getCoreRowModel(),
    state: {
      columnFilters,
    },
    onColumnFiltersChange: setColumnFilters,
    meta: {
      toggleRow,
    },
  });

  const totalChamados = useMemo(() => data.length, [data]);
  const totalChamadosFiltrados = useMemo(
    () => dadosFiltrados.length,
    [dadosFiltrados],
  );
  const chamadosExibidos = useMemo(() => {
    return hasActiveFilters ? totalChamadosFiltrados : totalChamados;
  }, [hasActiveFilters, totalChamadosFiltrados, totalChamados]);

  // ==================== RENDERIZAÇÃO CONDICIONAL ====================
  if (!isLoggedIn) {
    return (
      <IsError
        isError={true}
        error={
          new Error('Você precisa estar logado para visualizar os chamados')
        }
        title="Acesso Negado"
      />
    );
  }

  if (isLoading) {
    return (
      <IsLoading
        isLoading={isLoading}
        title="Aguarde, buscando dados no servidor"
      />
    );
  }

  if (error) {
    return (
      <IsError
        isError={!!error}
        error={error as Error}
        title="Erro ao Carregar Chamados"
      />
    );
  }

  // ==================== RENDERIZAÇÃO PRINCIPAL ====================
  return (
    <>
      <div className="relative flex h-full flex-col overflow-hidden border bg-white shadow-md shadow-black w-full border-b-slate-500">
        <HeaderSection
          isAdmin={isAdmin}
          totalChamados={totalChamados}
          totalChamadosFiltrados={chamadosExibidos}
          hasActiveFilters={hasActiveFilters}
          clearAllFilters={clearAllFilters}
          mes={String(mes)}
          ano={String(ano)}
          onRefresh={() => {
            clearAllFilters();
            setExpandedRows(new Set());
            setTimeout(() => {
              if (typeof window !== 'undefined') window.location.reload();
            }, 100);
          }}
        />

        <div className="relative z-10 flex flex-1 flex-col overflow-hidden">
          {hasExpandedRow && (
            <div className="absolute inset-0 bg-black/30 backdrop-blur-xs z-20 animate-fadeIn pointer-events-none" />
          )}

          <div
            className="flex-1 overflow-y-auto scrollbar-thin scrollbar-track-white/5 scrollbar-thumb-indigo-500/30 hover:scrollbar-thumb-indigo-500/50"
            style={{ maxHeight: 'calc(100vh - 370px)' }}
          >
            <table
              className="w-full border-separate border-spacing-0"
              style={{ tableLayout: 'fixed' }}
            >
              <TableHeader table={table} isAdmin={isAdmin} />
              <TableBody
                table={table}
                columns={columns}
                expandedRows={expandedRows}
                isAdmin={isAdmin}
                codCliente={codCliente}
                clearAllFilters={clearAllFilters}
                openModal={openModal}
              />
            </table>
          </div>
        </div>
      </div>

      {/* Modal */}
      <ModalOS
        isOpen={isModalOpen}
        selectedRow={selectedOS}
        onClose={closeModal}
        onSave={handleSaveValidation}
      />
    </>
  );
}

// ==================== SUBCOMPONENTES ====================
interface HeaderSectionProps {
  isAdmin: boolean;
  totalChamados: number;
  totalChamadosFiltrados: number;
  hasActiveFilters: boolean;
  clearAllFilters: () => void;
  mes: string;
  ano: string;
  onRefresh: () => void;
}

function HeaderSection({
  isAdmin,
  totalChamados,
  totalChamadosFiltrados,
  hasActiveFilters,
  clearAllFilters,
  mes,
  ano,
  onRefresh,
}: HeaderSectionProps) {
  return (
    <header className="flex flex-col gap-10 bg-indigo-900 p-6">
      <div className="flex w-full items-center justify-between">
        <div className="flex items-center gap-6">
          <div className="flex h-16 w-16 items-center justify-center rounded-md bg-white/30 shadow-md shadow-black">
            <IoCall className="text-white animate-pulse" size={48} />
          </div>
          <h2 className="text-4xl tracking-widest select-none font-bold text-white">
            TABELA DE CHAMADOS - {mes}/{ano}
          </h2>
        </div>

        <FiRefreshCw
          onClick={onRefresh}
          title="Atualizar Dados"
          className="cursor-pointer text-white transition-all hover:scale-125 hover:rotate-180 active:scale-95 mr-7"
          size={52}
        />
      </div>

      <div className="flex w-full items-center justify-between gap-4">
        <div className="flex items-center justify-start flex-1 gap-4">
          <BadgeTotalizador
            label={totalChamadosFiltrados === 1 ? 'Chamado' : 'Chamados'}
            valor={totalChamadosFiltrados}
            valorTotal={hasActiveFilters ? totalChamados : undefined}
          />
        </div>

        <div className="flex items-center justify-end gap-20">
          {hasActiveFilters && (
            <button
              onClick={clearAllFilters}
              title="Limpar Filtros"
              className="group cursor-pointer rounded-full border-none bg-gradient-to-br from-red-600 to-red-700 px-6 py-4 text-lg font-extrabold tracking-widest text-white shadow-md shadow-black transition-all hover:scale-110 active:scale-95"
            >
              <FaEraser
                size={20}
                className="text-white group-hover:scale-110"
              />
            </button>
          )}

          {isAdmin && (
            <div className="flex items-center gap-2 rounded-full bg-gradient-to-r from-emerald-500/20 to-teal-500/20 px-6 py-2 ring-2 ring-emerald-400/80 shadow-md shadow-black">
              <div className="h-2 w-2 animate-pulse rounded-full bg-emerald-300"></div>
              <span className="text-base font-bold text-emerald-300 tracking-widest select-none italic">
                Administrador
              </span>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}

interface BadgeTotalizadorProps {
  label: string;
  valor: string | number;
  valorTotal?: number;
}

function BadgeTotalizador({ label, valor, valorTotal }: BadgeTotalizadorProps) {
  return (
    <div className="group flex items-center gap-2 rounded-md bg-white px-6 py-2 transition-all shadow-md shadow-black w-[300px]">
      <div className="h-2 w-2 animate-pulse rounded-full bg-indigo-500"></div>
      <span className="text-lg tracking-widest font-bold select-none text-black">
        {label}:{' '}
        <span className="text-lg tracking-widest font-bold select-none text-indigo-500">
          {valor}
          {valorTotal !== undefined && (
            <span className="ml-1">/{valorTotal}</span>
          )}
        </span>
      </span>
    </div>
  );
}

function TableHeader({ table, isAdmin }: { table: any; isAdmin: boolean }) {
  return (
    <thead className="sticky top-0 z-20">
      {table.getHeaderGroups().map((headerGroup: any) => (
        <tr key={headerGroup.id}>
          {headerGroup.headers.map((header: any) => (
            <th
              key={header.id}
              className="bg-teal-700 py-6 pl-2 pr-4.5"
              style={{ width: getColumnWidth(header.id, isAdmin) }}
            >
              {header.isPlaceholder
                ? null
                : flexRender(
                    header.column.columnDef.header,
                    header.getContext(),
                  )}
            </th>
          ))}
        </tr>
      ))}

      <tr className="shadow-sm shadow-black bg-teal-700">
        {table.getAllColumns().map((column: any) => (
          <th
            key={column.id}
            className="py-4 pl-2 pr-4"
            style={{ width: getColumnWidth(column.id, isAdmin) }}
          >
            {column.id === 'expander' ? (
              <div className="h-[42px]" />
            ) : (
              <FiltroHeaderChamados
                value={(column.getFilterValue() as string) ?? ''}
                onChange={(value: string) => column.setFilterValue(value)}
                columnId={column.id}
              />
            )}
          </th>
        ))}
      </tr>
    </thead>
  );
}

interface TableBodyProps {
  table: any;
  columns: any;
  expandedRows: Set<number>;
  isAdmin: boolean;
  codCliente: string | null;
  clearAllFilters: () => void;
  openModal: (row: OSRowProps) => void;
}

function TableBody({
  table,
  columns,
  expandedRows,
  isAdmin,
  codCliente,
  clearAllFilters,
  openModal,
}: TableBodyProps) {
  const rows = table.getRowModel().rows;
  const hasExpandedRow = expandedRows.size > 0;

  if (rows.length === 0) {
    return (
      <tbody>
        <tr>
          <td colSpan={columns.length} className="py-40 text-center">
            <EmptyState clearAllFilters={clearAllFilters} />
          </td>
        </tr>
      </tbody>
    );
  }

  return (
    <tbody className="relative">
      {rows.map((row: any, rowIndex: number) => {
        const isExpanded = expandedRows.has(row.original.COD_CHAMADO);
        const toggleRow = table.options.meta?.toggleRow;
        const temOS = row.original.TEM_OS ?? false;

        return (
          <React.Fragment key={row.id}>
            <tr
              data-chamado-id={row.original.COD_CHAMADO}
              onClick={() => {
                if (temOS && toggleRow) {
                  toggleRow(row.original.COD_CHAMADO);
                }
              }}
              className={`group transition-all duration-300 relative ${
                temOS ? 'cursor-pointer' : 'cursor-not-allowed'
              } ${
                isExpanded
                  ? 'bg-black z-30'
                  : rowIndex % 2 === 0
                    ? 'bg-gray-100 hover:bg-orange-200'
                    : 'bg-gray-100 hover:bg-orange-200'
              } ${
                hasExpandedRow && !isExpanded ? 'z-10 pointer-events-none' : ''
              } ${temOS ? 'hover:shadow-lg hover:shadow-indigo-500/20' : ''}`}
            >
              {row.getVisibleCells().map((cell: any, cellIndex: number) => (
                <td
                  key={cell.id}
                  style={{ width: getColumnWidth(cell.column.id, isAdmin) }}
                  className={`border-b border-gray-300 p-3 transition-all ${
                    cellIndex === 0 ? 'pl-6' : ''
                  } ${cellIndex === row.getVisibleCells().length - 1 ? 'pr-6' : ''} ${
                    isExpanded ? 'font-semibold' : ''
                  }`}
                >
                  {flexRender(cell.column.columnDef.cell, cell.getContext())}
                </td>
              ))}
            </tr>

            {isExpanded && temOS && (
              <tr key={`${row.id}-expanded`} className="relative z-30">
                <td
                  colSpan={table.getAllColumns().length}
                  className="px-6 pt-6 pb-12 bg-white rounded-b-lg relative border-b border-gray-800"
                >
                  <div className="relative z-10">
                    <SubTabelaOS
                      codChamado={row.original.COD_CHAMADO}
                      isAdmin={isAdmin}
                      codCliente={codCliente}
                      openModal={openModal}
                    />
                  </div>
                </td>
              </tr>
            )}
          </React.Fragment>
        );
      })}
    </tbody>
  );
}

function EmptyState({ clearAllFilters }: { clearAllFilters: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center gap-4">
      <FaEraser className="text-slate-300 mb-6" size={80} />
      <div className="text-3xl font-extrabold text-black select-none tracking-widest">
        Nenhum resultado encontrado
      </div>
      <div className="text-lg text-slate-600 select-none tracking-widest italic font-semibold mb-6">
        Tente ajustar os filtros para encontrar o que procura
      </div>
      <button
        className="group cursor-pointer rounded-md border-none bg-gradient-to-br from-red-600 to-red-700 px-6 py-3 text-lg font-extrabold tracking-widest text-white shadow-md shadow-black transition-all hover:scale-110 active:scale-95"
        onClick={clearAllFilters}
      >
        Limpar Filtros
      </button>
    </div>
  );
}

// ==================== SUB-TABELA DE OS's ====================
interface SubTabelaOSProps {
  codChamado: number;
  isAdmin: boolean;
  codCliente: string | null;
  openModal: (row: OSRowProps) => void;
}

function SubTabelaOS({
  codChamado,
  isAdmin,
  codCliente,
  openModal,
}: SubTabelaOSProps) {
  const { data, isLoading, error } = useQuery({
    queryKey: ['os', codChamado, isAdmin, codCliente],
    queryFn: () => fetchOSByChamado({ codChamado, isAdmin, codCliente }),
    staleTime: 1000 * 60 * 5,
    retry: 2,
  });

  const osData = useMemo(() => data?.data ?? [], [data?.data]);
  const columns = useMemo(() => getColunasOS(), []);

  const table = useReactTable<OSRowProps>({
    data: osData,
    columns,
    getCoreRowModel: getCoreRowModel(),
  });

  if (isLoading) {
    return (
      <div className="p-8 text-center">
        <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-slate-300 border-t-indigo-600"></div>
        <p className="mt-4 text-sm text-slate-600 italic">Carregando OS's...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-8 text-center text-red-600">
        <p className="font-bold">Erro ao carregar OS's</p>
        <p className="text-sm italic">{(error as Error).message}</p>
      </div>
    );
  }

  if (osData.length === 0) {
    return (
      <div className="p-8 text-center text-slate-600 italic">
        Nenhuma OS encontrada para este chamado
      </div>
    );
  }

  return (
    <div className="p-6 bg-white rounded-md shadow-lg shadow-black border-t border-gray-300">
      <div className="mb-3 flex items-center gap-3">
        <div className="h-3 w-3 rounded-full bg-green-500 animate-pulse"></div>
        <span className="text-base font-extrabold text-gray-800 tracking-widest select-none">
          {osData.length > 1 ? 'ORDENS DE SERVIÇO' : 'ORDEM DE SERVIÇO'} - CHAMADO #{codChamado}
        </span>
        <div className="h-px flex-1 bg-gray-800"></div>
        <span className="text-base font-extrabold text-gray-800 select-none tracking-widest">
          {osData.length} {osData.length === 1 ? 'OS' : "OS's"}
        </span>
      </div>

      <div className="overflow-x-auto rounded-lg shadow-md shadow-black">
        <table
          className="w-full border-separate border-spacing-0"
          style={{ tableLayout: 'fixed' }}
        >
          <thead>
            {table.getHeaderGroups().map((headerGroup) => (
              <tr key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <th
                    key={header.id}
                    className="bg-purple-600 p-5 text-black font-extrabold tracking-widest select-none text-base"
                    style={{ width: getColumnWidthOS(header.id) }}
                  >
                    {flexRender(
                      header.column.columnDef.header,
                      header.getContext(),
                    )}
                  </th>
                ))}
              </tr>
            ))}
          </thead>
          <tbody>
            {table.getRowModel().rows.map((row, idx) => (
              <tr
                key={row.id}
                onClick={() => openModal(row.original)}
                className={`cursor-pointer ${
                  idx % 2 === 0 ? 'bg-gray-100' : 'bg-gray-100'
                } hover:bg-orange-200 transition-all`}
              >
                {row.getVisibleCells().map((cell) => (
                  <td
                    key={cell.id}
                    className="p-3 border-b border-gray-300"
                    style={{ width: getColumnWidthOS(cell.column.id) }}
                  >
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
