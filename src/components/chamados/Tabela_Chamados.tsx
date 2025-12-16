// src/components/chamados/Tabela_Chamados.tsx
'use client';

import { useAuth } from '@/context/AuthContext';
import { useFilters } from '@/context/FiltersContext';
import { formatarHorasTotaisSufixo } from '@/formatters/formatar-hora';
import { useColumnResize } from '@/hooks/useColumnResize';
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
import { ExportaExcelChamadosButton } from './Button_Excel';
import { ChamadoRowProps, getColunasChamados } from './Colunas_Tabela_Chamados';
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
import { ResizeHandle } from './ResizeHandle';

// ==================== INTERFACE ====================
interface ApiResponseChamados {
  success: boolean;
  totalChamados: number;
  totalOS: number;
  totalHorasOS: number;
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

  const initialColumnWidths = {
    COD_CHAMADO: 110, //ok
    DATA_CHAMADO: 170, //ok
    PRIOR_CHAMADO: 110, //ok
    ASSUNTO_CHAMADO: 280,
    EMAIL_CHAMADO: 220,
    NOME_CLASSIFICACAO: 180, //ok
    DTENVIO_CHAMADO: 170, //ok
    NOME_RECURSO: 180, //ok
    STATUS_CHAMADO: 220,
    CONCLUSAO_CHAMADO: 150, //ok
    TOTAL_HORAS_OS: 120, //ok
  };

  const { columnWidths, handleMouseDown, handleDoubleClick, resizingColumn } =
    useColumnResize(initialColumnWidths);

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

  const totalOS = useMemo(() => apiData?.totalOS ?? 0, [apiData?.totalOS]);

  // Função para expandir/recolher linha
  // Função para expandir/recolher linha com scroll melhorado
  const toggleRow = useCallback((codChamado: number) => {
    setExpandedRows((prev) => {
      if (prev.size > 0 && !prev.has(codChamado)) {
        return prev;
      }

      const newSet = new Set(prev);

      if (newSet.has(codChamado)) {
        newSet.delete(codChamado);
      } else {
        newSet.add(codChamado);

        // Scroll automático após expandir - usa requestAnimationFrame para garantir que o DOM foi atualizado
        requestAnimationFrame(() => {
          setTimeout(() => {
            const rowElement = document.querySelector(
              `[data-chamado-id="${codChamado}"]`,
            ) as HTMLElement;

            if (rowElement) {
              const container = rowElement.closest(
                '.overflow-y-auto',
              ) as HTMLElement;
              const thead = document.querySelector('thead');

              if (container && thead) {
                // Aguarda a renderização da sub-tabela expandida
                setTimeout(() => {
                  const expandedRow =
                    rowElement.nextElementSibling as HTMLElement;

                  const containerRect = container.getBoundingClientRect();
                  const rowRect = rowElement.getBoundingClientRect();

                  // Pega apenas a primeira linha do thead (títulos das colunas)
                  const theadFirstRow = thead.querySelector('tr:first-child');
                  const theadFirstRowHeight = theadFirstRow
                    ? theadFirstRow.getBoundingClientRect().height
                    : 0;

                  // Altura real da sub-tabela expandida (ou estimativa)
                  const expandedHeight = expandedRow
                    ? expandedRow.getBoundingClientRect().height
                    : 400;

                  // Posição atual da linha em relação ao scroll
                  const rowTop =
                    rowRect.top - containerRect.top + container.scrollTop;

                  // Detecta se é uma das últimas linhas contando as linhas de chamado (não expandidas)
                  const allChamadoRows = Array.from(
                    container.querySelectorAll('tbody > tr[data-chamado-id]'),
                  );
                  const currentRowIndex = allChamadoRows.indexOf(rowElement);
                  const isLastTwoRows =
                    currentRowIndex >= allChamadoRows.length - 2;

                  // Altura do container scrollável completo
                  const scrollHeight = container.scrollHeight;

                  // Posição do bottom da linha em relação ao conteúdo total
                  const rowBottomAbsolute = rowTop + rowRect.height;

                  // Espaço real disponível abaixo da linha considerando todo o scroll
                  const spaceBelow = scrollHeight - rowBottomAbsolute;

                  // Se é uma das duas últimas linhas OU não há espaço suficiente
                  if (isLastTwoRows || spaceBelow < expandedHeight) {
                    // SEMPRE posiciona logo abaixo do header
                    const targetScroll = rowTop - theadFirstRowHeight - 10;

                    container.scrollTo({
                      top: Math.max(0, targetScroll),
                      behavior: 'smooth',
                    });
                  } else {
                    // Há espaço suficiente, posiciona normalmente
                    const targetScroll = rowTop - theadFirstRowHeight;

                    container.scrollTo({
                      top: targetScroll,
                      behavior: 'smooth',
                    });
                  }
                }, 250); // Aumentado para 250ms
              }
            }
          }, 50);
        });
      }
      return newSet;
    });
  }, []);
  // ====================

  // Colunas dinâmicas
  const columns = useMemo(
    () => getColunasChamados(isAdmin, expandedRows, columnWidths), // ✅ ADICIONAR columnWidths
    [isAdmin, expandedRows, columnWidths], // ✅ ADICIONAR na dependência
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

  const totalHorasOS = useMemo(
    () => apiData?.totalHorasOS ?? 0,
    [apiData?.totalHorasOS],
  );

  const totalHorasFiltradas = useMemo(() => {
    // Se não há filtros ativos, retorna o total da API
    if (!hasActiveFilters) {
      return totalHorasOS;
    }

    // Com filtros ativos, soma as horas dos chamados filtrados
    return dadosFiltrados.reduce((acc, chamado) => {
      return acc + (chamado.TOTAL_HORAS_OS || 0);
    }, 0);
  }, [dadosFiltrados, hasActiveFilters, totalHorasOS]);

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

  const totalOSFiltrados = useMemo(() => {
    // Se não há filtros ativos, retorna o total da API
    if (!hasActiveFilters) {
      return totalOS;
    }

    // Com filtros ativos, conta as OS's dos chamados filtrados
    // Aqui assumimos que cada chamado com TOTAL_HORAS_OS > 0 tem pelo menos 1 OS
    // Se você tiver o número exato de OS's por chamado, ajuste aqui
    return dadosFiltrados.reduce((acc, chamado) => {
      return acc + (chamado.TOTAL_HORAS_OS > 0 ? 1 : 0);
    }, 0);
  }, [dadosFiltrados, hasActiveFilters, totalOS]);

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
        title="Aguarde, buscando dados do servidor"
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
        <Header
        isAdmin={isAdmin}
        totalChamados={totalChamados}
        totalChamadosFiltrados={chamadosExibidos}
        totalOS={totalOS}
        totalOSFiltrados={totalOSFiltrados}
        totalHorasOS={totalHorasOS}
        totalHorasFiltradas={totalHorasFiltradas}
        hasActiveFilters={hasActiveFilters}
        clearAllFilters={clearAllFilters}
        filteredData={dadosFiltrados}
        mes={String(mes)}
        ano={String(ano)}
        codCliente={codCliente} // ⭐ ADICIONAR ESTA LINHA
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
            <div
              className="absolute inset-0 bg-black/30 backdrop-blur-xs z-20 animate-fadeIn cursor-pointer"
              onClick={() => setExpandedRows(new Set())} // ✅ Fecha ao clicar no overlay
              title="Clique para fechar"
            />
          )}

          <div
            className="flex-1 overflow-y-auto scrollbar-thin scrollbar-track-purple-100 scrollbar-thumb-purple-600 hover:scrollbar-thumb-purple-800"
            style={{ maxHeight: 'calc(100vh - 370px)' }}
          >
            <table
              className="w-full border-separate border-spacing-0"
              style={{ tableLayout: 'fixed' }}
            >
              <TableHeader
                table={table}
                isAdmin={isAdmin}
                columnWidths={columnWidths}
                handleMouseDown={handleMouseDown}
                handleDoubleClick={handleDoubleClick} // ✅ ADICIONAR
                resizingColumn={resizingColumn}
              />
              <TableBody
                table={table}
                columns={columns}
                expandedRows={expandedRows}
                isAdmin={isAdmin}
                codCliente={codCliente}
                clearAllFilters={clearAllFilters}
                openModal={openModal}
                columnWidths={columnWidths}
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

// ============================================================
// ========== SUB-COMPONENTES =================================
// ============================================================

// ==================== HEADER ====================

interface HeaderProps {
  isAdmin: boolean;
  totalChamados: number;
  totalChamadosFiltrados: number;
  totalOS: number;
  totalOSFiltrados: number;
  totalHorasOS: number;
  totalHorasFiltradas: number;
  hasActiveFilters: boolean;
  clearAllFilters: () => void;
  filteredData: ChamadoRowProps[];
  mes: string;
  ano: string;
  codCliente: string | null; // ⭐ ADICIONAR
  onRefresh: () => void;
}

function Header({
  isAdmin,
  totalChamados,
  totalChamadosFiltrados,
  totalOS,
  totalOSFiltrados,
  totalHorasOS,
  totalHorasFiltradas,
  hasActiveFilters,
  clearAllFilters,
  filteredData,
  mes,
  ano,
  codCliente, // ⭐ ADICIONAR
  onRefresh,
}: HeaderProps) {
  const { cliente, recurso, status } = useFilters().filters;
  
  return (
    <header className="flex flex-col gap-10 bg-purple-900 p-6">
      {/* Título / Botão Atualizar */}
      <div className="flex w-full items-center justify-between">
        {/* Título */}
        <div className="flex items-center gap-6">
          <div className="flex h-16 w-16 items-center justify-center rounded-md bg-white border border-purple-300">
            <IoCall className="text-black" size={48} />
          </div>
          <h2 className="text-4xl tracking-widest select-none font-bold text-white">
            RELATÓRIO CHAMADOS - {mes}/{ano}
          </h2>
        </div>

        {/* Botão Atualizar */}
        <FiRefreshCw
          onClick={onRefresh}
          title="Atualizar Dados"
          className="cursor-pointer text-white transition-all hover:scale-125 hover:rotate-180 active:scale-95 mr-7"
          size={52}
        />
      </div>

      {/* Badges Totalizadores / Botão Limpar Filtros / Badge Administrador */}
      <div className="flex w-full items-center justify-between gap-4">
        {/* Badges Totalizadores */}
        <div className="flex items-center justify-start flex-1 gap-4 flex-wrap">
          <BadgeTotalizador
            label={totalChamadosFiltrados === 1 ? 'Chamado' : 'Chamados'}
            valor={totalChamadosFiltrados}
            valorTotal={hasActiveFilters ? totalChamados : undefined}
            width="w-[280px]"
          />

          <BadgeTotalizador
            label={totalOSFiltrados === 1 ? 'OS' : "OS's"}
            valor={totalOSFiltrados}
            valorTotal={hasActiveFilters ? totalOS : undefined}
            width="w-[230px]"
          />

          <BadgeTotalizador
            label="Horas Trabalhadas"
            valor={formatarHorasTotaisSufixo(totalHorasFiltradas)}
            valorTotal={
              hasActiveFilters
                ? formatarHorasTotaisSufixo(totalHorasOS)
                : undefined
            }
            width="w-[590px]"
          />
        </div>

        {/* Botões de Ação */}
        <div className="flex items-center justify-end gap-20">
          {/* Botão Limpar Filtros */}
          {hasActiveFilters && (
            <button
              onClick={clearAllFilters}
              title="Limpar Filtros"
              className="group cursor-pointer rounded-full border border-purple-300 bg-white p-4 text-lg font-extrabold tracking-widest text-white transition-all hover:scale-115 active:scale-95"
            >
              <FaEraser
                size={20}
                className="text-black group-hover:scale-115 transition-all"
              />
            </button>
          )}

          {/* ⭐ Botão Exportar Excel ATUALIZADO */}
          <ExportaExcelChamadosButton
            data={filteredData}
            isAdmin={isAdmin} // ⭐ ADICIONAR
            codCliente={codCliente} // ⭐ ADICIONAR
            filtros={{
              ano,
              mes,
              cliente,
              recurso,
              status,
              totalChamados: totalChamadosFiltrados,
              totalOS: totalOSFiltrados,
              totalHorasOS: totalHorasFiltradas,
            }}
            disabled={filteredData.length === 0}
          />

          {/* Badge Administrador */}
          {isAdmin && (
            <div className="flex items-center gap-4 rounded-full bg-purple-900 px-6 py-2 ring-2 ring-emerald-600">
              <div className="h-2.5 w-2.5 animate-pulse rounded-full bg-emerald-600"></div>
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
// ====================

// ==================== BADGE TOTALIZADOR ====================
interface BadgeTotalizadorProps {
  label: string;
  valor: string | number;
  valorTotal?: string | number;
  width?: string;
}

function BadgeTotalizador({
  label,
  valor,
  valorTotal,
  width,
}: BadgeTotalizadorProps) {
  return (
    <div
      className={`group flex items-center gap-4 rounded bg-white px-6 py-2 border border-purple-300 flex-shrink-0 ${width}`}
    >
      <div className="h-2.5 w-2.5 animate-pulse rounded-full bg-purple-900"></div>
      <span className="text-lg tracking-widest font-extrabold select-none text-gray-800">
        {label}:{' '}
        <span className="text-lg tracking-widest font-extrabold select-none text-purple-600 italic">
          {valor}
          {valorTotal !== undefined && (
            <span className="ml-1">/{valorTotal}</span>
          )}
        </span>
      </span>
    </div>
  );
}
// ====================

// ==================== TABLE HEADER ====================
function TableHeader({
  table,
  isAdmin,
  columnWidths,
  handleMouseDown,
  handleDoubleClick, // ✅ ADICIONAR
  resizingColumn,
}: {
  table: any;
  isAdmin: boolean;
  columnWidths: Record<string, number>;
  handleMouseDown: (e: React.MouseEvent, columnId: string) => void;
  handleDoubleClick: (columnId: string) => void; // ✅ ADICIONAR
  resizingColumn: string | null;
}) {
  return (
    <thead className="sticky top-0 z-20">
      {table.getHeaderGroups().map((headerGroup: any) => (
        <tr key={headerGroup.id}>
          {headerGroup.headers.map((header: any, idx: number) => (
            <th
              key={header.id}
              className="bg-teal-700 py-6 pl-3.5 pr-4 relative border-r border-teal-900 border-b " // ✅ ADICIONAR border
              style={{ width: `${columnWidths[header.id]}px` }}
            >
              {header.isPlaceholder
                ? null
                : flexRender(
                    header.column.columnDef.header,
                    header.getContext(),
                  )}

              {/* ✅ ADICIONAR ResizeHandle (exceto na última coluna) */}
              {idx < headerGroup.headers.length - 1 && (
                <ResizeHandle
                  columnId={header.id}
                  onMouseDown={handleMouseDown}
                  onDoubleClick={handleDoubleClick} // ✅ ADICIONAR
                  isResizing={resizingColumn === header.id}
                />
              )}
            </th>
          ))}
        </tr>
      ))}

      {/* Linha de filtros */}
      <tr className=" bg-teal-700">
        {table.getAllColumns().map((column: any, idx: number) => (
          <th
            key={column.id}
            className="py-4 pl-4 pr-4 relative" // ✅ ADICIONAR relative
            style={{ width: `${columnWidths[column.id]}px` }} // ✅ MODIFICAR
          >
            {column.id === 'TOTAL_HORAS_OS' ? (
              <div className="h-[42px]" />
            ) : (
              <FiltroHeaderChamados
                value={(column.getFilterValue() as string) ?? ''}
                onChange={(value: string) => column.setFilterValue(value)}
                columnId={column.id}
              />
            )}

            {/* ✅ ADICIONAR ResizeHandle (exceto na última coluna) */}
            {idx < table.getAllColumns().length - 1 && (
              <ResizeHandle
                columnId={column.id}
                onMouseDown={handleMouseDown}
                onDoubleClick={handleDoubleClick} // ✅ ADICIONAR
                isResizing={resizingColumn === column.id}
              />
            )}
          </th>
        ))}
      </tr>
    </thead>
  );
}
// ====================

// ==================== TABLE BODY ====================
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
  columnWidths, // ✅ ADICIONAR
}: TableBodyProps & { columnWidths: Record<string, number> }) {
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
              className={`group transition-all relative ${
                temOS ? 'cursor-pointer' : 'cursor-not-allowed'
              } ${
                isExpanded
                  ? 'bg-black z-30'
                  : rowIndex % 2 === 0
                    ? 'bg-white hover:bg-gray-300'
                    : 'bg-white hover:bg-gray-300'
              } ${
                hasExpandedRow && !isExpanded ? 'z-10 pointer-events-none' : ''
              } `}
            >
              {row.getVisibleCells().map((cell: any, cellIndex: number) => (
                <td
                  key={cell.id}
                  style={{ width: `${columnWidths[cell.column.id]}px` }}
                  className={`border-b border-r border-gray-500 p-3 transition-all ${
                    cellIndex === 0 ? 'pl-3' : ''
                  } ${cellIndex === row.getVisibleCells().length - 1 ? 'pr-4' : ''} ${
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
                  className="px-6 pt-6 pb-12 bg-white rounded-b relative"
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
// ====================

// ==================== EMPTY STATE ====================
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
// ====================

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
    <div className="bg-white">
      {/* Header da Subtabela */}
      <div className="mb-3 flex items-center gap-3">
        <div className="h-2.5 w-2.5 rounded-full bg-teal-800 animate-pulse"></div>
        <span className="text-base font-extrabold text-gray-800 tracking-widest select-none">
          {osData.length > 1 ? 'ORDENS DE SERVIÇO' : 'ORDEM DE SERVIÇO'} -
          CHAMADO #{codChamado}
        </span>
        <div className="h-px flex-1 bg-gray-800"></div>
        <span className="text-base font-extrabold text-gray-800 select-none tracking-widest">
          {osData.length} {osData.length === 1 ? 'OS' : "OS's"}
        </span>
      </div>

      {/* Container com Scroll */}
      <div
        className="overflow-y-auto rounded-md shadow-xs shadow-black scrollbar-thin scrollbar-track-teal-100 scrollbar-thumb-teal-600 hover:scrollbar-thumb-teal-800"
        style={{ maxHeight: '400px' }}
      >
        <table
          className="w-full border-separate border-spacing-0"
          style={{ tableLayout: 'fixed' }}
        >
          <thead className="sticky top-0 z-10">
            {table.getHeaderGroups().map((headerGroup) => (
              <tr key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <th
                    key={header.id}
                    className="bg-teal-800 p-3 font-extrabold tracking-widest select-none text-base"
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
                  idx % 2 === 0 ? 'bg-white' : 'bg-white'
                } hover:bg-gray-300 transition-all`}
              >
                {row.getVisibleCells().map((cell) => (
                  <td
                    key={cell.id}
                    className="p-3 border-b border-gray-400"
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
