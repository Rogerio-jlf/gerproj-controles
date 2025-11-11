'use client';

import { useAuth } from '@/context/AuthContext';
import { formatarHorasTotaisSufixo } from '@/formatters/formatar-hora';
import {
  ColumnFiltersState,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  useReactTable,
} from '@tanstack/react-table';
import axios from 'axios';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { FaEraser } from 'react-icons/fa';
import { IoCall } from 'react-icons/io5';
import { corrigirTextoCorrompido } from '../../formatters/formatar-texto-corrompido';
import { IsError } from '../IsError';
import { IsLoading } from '../IsLoading';
import { ExportaExcelButton } from './Button_Excel';
import { ExportaPDFButton } from './Button_PDF';
import { TableRowProps, columns } from './Colunas_Tabela';
import {
  FiltroHeaderChamados,
  useFiltrosChamados,
} from './Filtro_Header_Tabela';
import { ModalChamado } from './Modal_Chamado';
import { StatusBadge } from './Status_Badge';

interface FiltersProps {
  ano: string;
  mes: string;
  cliente?: string;
  recurso?: string;
  status?: string;
}

const createAuthHeaders = () => {
  return {
    'Content-Type': 'application/json',
    'x-is-logged-in': localStorage.getItem('isLoggedIn') || 'false',
    'x-is-admin': localStorage.getItem('isAdmin') || 'false',
    'x-user-email': localStorage.getItem('userEmail') || '',
    'x-cod-cliente': localStorage.getItem('codCliente') || '',
  };
};

export default function TabelaChamados({
  ano,
  mes,
  cliente,
  recurso,
  status,
}: FiltersProps) {
  const [data, setData] = useState<TableRowProps[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedRow, setSelectedRow] = useState<TableRowProps | null>(null);
  const [totalHorasGeral, setTotalHorasGeral] = useState('');

  // 🆕 Estados para filtros
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);

  const { isAdmin, codCliente, isLoggedIn } = useAuth();
  const { columnFilterFn } = useFiltrosChamados();

  const clienteValue = cliente ?? '';
  const recursoValue = recurso ?? '';
  const statusValue = status ?? '';
  const isLoggedInValue = isLoggedIn ?? false;
  const isAdminValue = isAdmin ?? false;
  const codClienteValue = codCliente ?? '';

  const openModal = (row: TableRowProps) => {
    console.log('Dados da linha clicada:', row);
    setSelectedRow(row);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setSelectedRow(null);
  };

  // 🆕 Função para atualizar a linha na tabela
  const handleSaveValidation = useCallback((updatedRow: TableRowProps) => {
    setData((prevData) =>
      prevData.map((row) =>
        row.cod_os === updatedRow.cod_os ? updatedRow : row
      )
    );
  }, []);

  useEffect(() => {
    if (!isLoggedInValue) {
      setError('Você precisa estar logado para visualizar os chamados');
      return;
    }

    const params = new URLSearchParams({
      ano,
      mes,
      isAdmin: isAdminValue.toString(),
      ...(isAdminValue && codClienteValue
        ? { codCliente: codClienteValue }
        : {}),
      ...(clienteValue ? { cliente: clienteValue } : {}),
      ...(recursoValue ? { recurso: recursoValue } : {}),
      ...(statusValue ? { status: statusValue } : {}),
    });

    if (!isAdminValue && codClienteValue) {
      params.append('codCliente', codClienteValue);
    }

    setLoading(true);
    setError(null);

    axios
      .get(`/api/tabela/tabela_chamado?${params.toString()}`, {
        headers: createAuthHeaders(),
      })
      .then((response) => {
        const apiData = response.data as {
          apontamentos: TableRowProps[];
          totalHorasGeral: string;
        };
        setData(apiData.apontamentos);
        setTotalHorasGeral(apiData.totalHorasGeral);
      })
      .catch((err) => {
        console.error('Erro ao carregar chamados:', err);
        const errorMessage =
          err.response?.data?.error ||
          err.message ||
          'Erro ao carregar chamados';
        setError(errorMessage);
        setData([]);
      })
      .then(() => setLoading(false));
  }, [
    ano,
    mes,
    clienteValue,
    recursoValue,
    statusValue,
    isLoggedInValue,
    isAdminValue,
    codClienteValue,
  ]);

  const dataCorrigida = useMemo(() => {
    return data.map((item) => ({
      ...item,
      obs: corrigirTextoCorrompido(item.obs),
    }));
  }, [data]);

  // 🆕 Configuração da tabela com filtros
  const table = useReactTable<TableRowProps>({
    data: dataCorrigida,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    state: {
      columnFilters,
    },
    onColumnFiltersChange: setColumnFilters,
    filterFns: {
      custom: columnFilterFn,
    },
    globalFilterFn: columnFilterFn,
  });

  // 🆕 Contadores para os cards
  const filteredData = table
    .getFilteredRowModel()
    .rows.map((row) => row.original);
  const totalChamadosFiltrados = filteredData.length;
  const totalRecursosFiltrados = Array.from(
    new Set(filteredData.map((item) => item.nome_recurso || '')),
  ).filter(Boolean).length;

  // 🆕 Calcular total de horas dos dados filtrados
  const totalHorasFiltrado = useMemo(() => {
    let totalMinutes = 0;

    filteredData.forEach((item) => {
      if (item.total_horas && item.total_horas !== '-') {
        // Extrai horas e minutos do formato "XXh:XXmin" ou "XXhs:XXmin" ou "XXmin"
        const match = item.total_horas.match(/(\d+)(hs?:?)?:?(\d+)?min/);
        if (match) {
          const horas = parseInt(match[1]) || 0;
          const minutos = parseInt(match[3]) || 0;
          totalMinutes += horas * 60 + minutos;
        }
      }
    });

    // Converte minutos totais para horas decimais
    const totalEmHorasDecimais = totalMinutes / 60;
    const horaFormatada = formatarHorasTotaisSufixo(totalEmHorasDecimais);

    if (horaFormatada === '-') {
      return '0h:00min';
    }

    return horaFormatada;
  }, [filteredData]);

  // 🆕 Contador de filtros ativos
  const activeFiltersCount = columnFilters.length;

  // 🆕 Função para limpar todos os filtros
  const clearAllFilters = () => {
    setColumnFilters([]);
  };

  if (loading) {
    return (
      <IsLoading
        isLoading={loading}
        title="Aguarde, buscando dados no servidor"
      />
    );
  }

  if (error) {
    return (
      <IsError
        isError={!!error}
        error={new Error(error)}
        title="Erro ao Carregar Chamados"
      />
    );
  }

  // ====================================================================================================
  // RENDERIZAÇÃO
  // ====================================================================================================

  return (
    <>
      <div className="relative flex h-full flex-col overflow-hidden rounded-xl bg-white shadow-md shadow-black">
        {/* Cabeçalho Premium */}
        <header className="flex flex-col gap-10 bg-purple-900 p-6">
          {/* HEADER */}
          <div className="flex items-center gap-6">
            <div className="flex h-16 w-16 items-center justify-center rounded-md bg-white/30 shadow-md shadow-black">
              <IoCall className=" text-white animate-pulse" size={48} />
            </div>
            <h2 className="text-4xl tracking-widest select-none font-bold text-white">
              ORDENS DE SERVIÇO
            </h2>
          </div>
          {/* ===== */}
          {/* BADGES TOTALIZADORES - BOTÕES LIMPAR FILTROS - BOTÃO EXPORTAR EXCEL - BOTÃO EXPORTAR PDF - BADGE ADMINISTRADOR */}
          <div className="flex w-full items-center justify-between">
            {/* BADGES TOTALIZADORES */}
            {data.length > 0 && (
              <div className="flex items-center justify-start w-[1000px] gap-4">
                {/* CARD TOTAL DE CHAMADOS */}
                <div className="group w-[320px] flex items-center gap-2 rounded-md bg-white px-6 py-2 transition-all text-lg tracking-widest font-bold select-none italic shadow-md shadow-black">
                  <div className="h-2 w-2 animate-pulse rounded-full bg-purple-500"></div>
                  <span className=" text-slate-800">
                    Total:{' '}
                    <span className="text-purple-600">
                      {totalChamadosFiltrados}
                    </span>
                    {activeFiltersCount > 0 && (
                      <span className="text-purple-600 ml-1">
                        /{data.length}
                      </span>
                    )}{' '}
                  </span>
                </div>
                {/* ===== */}

                {/* CARD TOTAL DE RECURSOS */}
                <div className="group w-[320px] flex items-center gap-2 rounded-md bg-white px-6 py-2 transition-all text-lg tracking-widest font-bold select-none italic shadow-md shadow-black">
                  <div className="h-2 w-2 animate-pulse rounded-full bg-purple-500"></div>
                  <span className=" text-slate-800">
                    Consultores:{' '}
                    <span className="text-purple-600">
                      {totalRecursosFiltrados}
                    </span>
                  </span>
                </div>
                {/* ===== */}

                {/* CARD TOTAL DE HORAS */}
                <div className="group w-[320px] flex items-center gap-2 rounded-md bg-white px-6 py-2 transition-all text-lg tracking-widest font-bold select-none italic shadow-md shadow-black">
                  <div className="h-2 w-2 animate-pulse rounded-full bg-purple-500"></div>
                  <span className=" text-slate-800">
                    Horas:{' '}
                    <span className="text-purple-600">
                      {activeFiltersCount > 0
                        ? totalHorasFiltrado
                        : formatarHorasTotaisSufixo(totalHorasGeral) ||
                          '0 horas'}
                    </span>
                  </span>
                </div>
              </div>
            )}
            {/* ===== */}

            {/* BOTÃO LIMPAR FILTROS - BOTÃO EXPORTA EXCEL - BOTÃO EXPORTAR PDF - BADGE ADMINISTRADOR  */}
            <div className="flex w-[500px] items-center justify-end gap-10">
              {/* BOTÃO LIMPAR FILTROS */}
              {activeFiltersCount > 0 && (
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
              {/* ===== */}

              {/* BOTÃO EXPORTAR EXCEL - PDF */}
              <div className="flex gap-2">
                {/* EXCEL */}
                <ExportaExcelButton
                  data={filteredData as any}
                  filename={`relatorio_chamados_${mes}_${ano}.xlsx`}
                  buttonText=""
                  className=""
                />
                {/* ===== */}

                {/* PDF */}
                <ExportaPDFButton
                  data={filteredData as any}
                  fileName={`relatorio_chamados_${mes}_${ano}`}
                  title={`Relatório de Chamados - ${mes}/${ano}`}
                  columns={[
                    { key: 'chamado_os', label: 'N° OS' },
                    { key: 'cod_os', label: 'CÓD. OS' },
                    { key: 'nome_cliente', label: 'Cliente' },
                    { key: 'dtini_os', label: 'Data' },
                    { key: 'status_chamado', label: 'Status' },
                    { key: 'hrini_os', label: 'Hora Início' },
                    { key: 'hrfim_os', label: 'Hora Fim' },
                    { key: 'total_horas', label: 'Duração' },
                    { key: 'valcli_os', label: 'Validação' },
                    { key: 'obs', label: 'Observação' },
                  ]}
                  logoUrl="/caminho/para/logo.png"
                  footerText="Gerado pelo sistema em"
                  className="ml-2"
                />
                {/* ===== */}
              </div>
              {/* ===== */}

              {/* BADGE ADMINISTRADOR */}
              {isAdmin && (
                <div className="flex items-center gap-2 rounded-full bg-gradient-to-r from-emerald-500/20 to-teal-500/20 px-6 py-2 ring-2 ring-emerald-400/80 shadow-md shadow-black">
                  <div className="h-2 w-2 animate-pulse rounded-full bg-emerald-300"></div>
                  <span className="text-base font-bold text-emerald-300 tracking-widest select-none italic">
                    Administrador
                  </span>
                </div>
              )}
              {/* ===== */}
            </div>
            {/* ===== */}
          </div>
        </header>

        {/* Container da Tabela */}
        <div className="relative z-10 flex flex-1 flex-col overflow-hidden">
          <div
            className="flex-1 overflow-y-auto scrollbar-thin scrollbar-track-white/5 scrollbar-thumb-purple-500/30 hover:scrollbar-thumb-purple-500/50"
            style={{ maxHeight: 'calc(100vh - 280px)' }}
          >
            <table className="w-full border-separate border-spacing-0">
              {/* HEADER TABELA */}
              <thead className="sticky top-0 z-20">
                {table.getHeaderGroups().map((headerGroup) => (
                  <tr key={headerGroup.id}>
                    {headerGroup.headers.map((header) => (
                      <th key={header.id} className=" bg-teal-700 p-6">
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

                {/* FILTROS HEADER */}
                <tr className="shadow-sm shadow-black bg-teal-700">
                  {table.getAllColumns().map((column) => (
                    <th key={column.id} className="py-4 px-2">
                      <FiltroHeaderChamados
                        value={(column.getFilterValue() as string) ?? ''}
                        onChange={(value) => column.setFilterValue(value)}
                        columnId={column.id}
                      />
                    </th>
                  ))}
                </tr>
              </thead>
              {/* ===== */}

              {/* BODY TABELA */}
              <tbody>
                {table.getRowModel().rows.length === 0 ? (
                  <tr>
                    <td colSpan={columns.length} className="py-40 text-center">
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
                    </td>
                  </tr>
                ) : (
                  table.getRowModel().rows.map((row, rowIndex) => (
                    <tr
                      key={row.id}
                      className={`group cursor-pointer transition-all ${
                        rowIndex % 2 === 0
                          ? 'bg-white hover:bg-blue-100'
                          : 'bg-gray-50 hover:bg-blue-100'
                      } hover:shadow-lg hover:shadow-purple-500/20`}
                      onClick={() => openModal(row.original)}
                    >
                      {row.getVisibleCells().map((cell, cellIndex) => (
                        <td
                          key={cell.id}
                          className={`border-b border-slate-200 p-3 transition-all ${
                            cellIndex === 0 ? 'pl-6' : ''
                          } ${cellIndex === row.getVisibleCells().length - 1 ? 'pr-6' : ''}`}
                        >
                          {cell.column.id === 'status' ? (
                            <StatusBadge status={cell.getValue() as string} />
                          ) : (
                            <span className="whitespace-nowrap">
                              {flexRender(
                                cell.column.columnDef.cell,
                                cell.getContext(),
                              )}
                            </span>
                          )}
                        </td>
                      ))}
                    </tr>
                  ))
                )}
              </tbody>
              {/* ===== */}
            </table>
            {/* ===== */}
          </div>
        </div>
      </div>

      <ModalChamado
        isOpen={isModalOpen}
        selectedRow={selectedRow}
        onClose={closeModal}
        onSave={handleSaveValidation}
      />

      <style jsx>{`
        @keyframes shimmer {
          0% {
            transform: translateX(-100%);
          }
          100% {
            transform: translateX(200%);
          }
        }
      `}</style>
    </>
  );
}