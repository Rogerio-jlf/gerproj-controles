import {
  formatarDataHoraChamado,
  formatarDataParaBR,
} from '@/formatters/formatar-data';
import {
  formatarHora,
  formatarHorasTotaisSufixo,
} from '@/formatters/formatar-hora';
import { formatarNumeros } from '@/formatters/formatar-numeros';
import { ColumnDef } from '@tanstack/react-table';
import { ChevronDown, ChevronRight } from 'lucide-react';
import { corrigirTextoCorrompido } from '../../formatters/formatar-texto-corrompido';
import { TooltipTabela } from '../utils/Tooltip';
import { TooltipTabelaChamado } from '../utils/Tooltip_Chamados';

// ==================== TIPOS ====================
export type ChamadoRowProps = {
  COD_CHAMADO: number;
  DATA_CHAMADO: string;
  HORA_CHAMADO: string;
  SOLICITACAO_CHAMADO: string | null;
  CONCLUSAO_CHAMADO: string | null;
  STATUS_CHAMADO: string;
  DTENVIO_CHAMADO: string | null;
  COD_RECURSO: number | null;
  CLIENTE_CHAMADO: string | null;
  CODTRF_CHAMADO: number | null;
  COD_CLIENTE: number | null;
  SOLICITACAO2_CHAMADO: string | null;
  ASSUNTO_CHAMADO: string | null;
  EMAIL_CHAMADO: string | null;
  PRIOR_CHAMADO: number;
  COD_CLASSIFICACAO: number;
  NOME_CLIENTE: string | null;
  NOME_RECURSO: string | null;
  NOME_CLASSIFICACAO: string | null;
  TOTAL_HORAS_OS: number;
  TEM_OS?: boolean;
};

// Versão para Admin (com coluna NOME_CLIENTE)
const COLUMN_WIDTH_ADMIN: Record<string, string> = {
  expander: '1%',
  COD_CHAMADO: '6%',
  DATA_CHAMADO: '10%',
  PRIOR_CHAMADO: '5%',
  NOME_CLIENTE: '10%',
  SOLICITACAO_CHAMADO: '16%',
  DTENVIO_CHAMADO: '10%',
  NOME_RECURSO: '10%',
  STATUS_CHAMADO: '14%',
  TOTAL_HORAS_OS: '6%',
  CONCLUSAO_CHAMADO: '7%',
  COD_CLASSIFICACAO: '5%',
};

// Versão para Cliente (sem coluna NOME_CLIENTE)
const COLUMN_WIDTH_CLIENT: Record<string, string> = {
  expander: '1%',
  COD_CHAMADO: '6%',
  DATA_CHAMADO: '10%',
  PRIOR_CHAMADO: '5%',
  SOLICITACAO_CHAMADO: '26%',
  DTENVIO_CHAMADO: '10%',
  NOME_RECURSO: '10%',
  STATUS_CHAMADO: '14%',
  TOTAL_HORAS_OS: '6%',
  CONCLUSAO_CHAMADO: '7%',
  COD_CLASSIFICACAO: '5%',
};

// Função atualizada que considera o contexto admin/cliente
export function getColumnWidth(
  columnId: string,
  isAdmin: boolean = true,
): string {
  const widthMap = isAdmin ? COLUMN_WIDTH_ADMIN : COLUMN_WIDTH_CLIENT;
  return widthMap[columnId] || 'auto';
}

// ==================== COMPONENTE DE STATUS ====================
const getStylesStatus = (status: string | undefined) => {
  switch (status?.toUpperCase()) {
    case 'NAO FINALIZADO':
      return 'bg-red-500 text-black italic';
    case 'EM ATENDIMENTO':
      return 'bg-blue-500 text-white italic';
    case 'FINALIZADO':
      return 'bg-green-500 text-black italic';
    case 'NAO INICIADO':
      return 'bg-yellow-500 text-black italic';
    case 'STANDBY':
      return 'bg-orange-500 text-black';
    case 'ATRIBUIDO':
      return 'bg-teal-500 text-black italic';
    case 'AGUARDANDO VALIDACAO':
      return 'bg-purple-500 text-white italic';
    default:
      return 'bg-gray-500 text-black italic';
  }
};

const StatusBadge = ({ status }: { status: string }) => {
  const styles = getStylesStatus(status);
  return (
    <div
      className={`inline-block w-full rounded px-6 py-1.5 text-sm font-extrabold tracking-widest select-none ${styles}`}
    >
      {status}
    </div>
  );
};

// ==================== COLUNAS ====================
export const getColunasChamados = (
  isAdmin: boolean,
  expandedRows: Set<number>,
): ColumnDef<ChamadoRowProps>[] => {
  const allColumns: ColumnDef<ChamadoRowProps>[] = [
    // Ícone de Expansão
    {
      id: 'expander',
      header: () => <div className="w-8"></div>,
      cell: ({ row }) => {
        const temOS = row.original.TEM_OS ?? false;
        const isExpanded = expandedRows.has(row.original.COD_CHAMADO);

        // Se não tem OS, não mostra ícone
        if (!temOS) {
          return <div className="w-8 h-8"></div>;
        }

        return (
          <div className="flex items-center justify-center w-8 h-8">
            {isExpanded ? (
              <ChevronDown
                className="text-white transition-transform"
                size={28}
              />
            ) : (
              <ChevronRight
                className="text-gray-800 transition-transform"
                size={28}
              />
            )}
          </div>
        );
      },
      enableColumnFilter: false,
    },
    // ===============

    // Código do Chamado
    {
      accessorKey: 'COD_CHAMADO',
      id: 'COD_CHAMADO',
      header: () => (
        <div className="text-center tracking-widest font-bold select-none text-white">
          CHAMADO
        </div>
      ),
      cell: ({ getValue, row }) => {
        const isExpanded = expandedRows.has(row.original.COD_CHAMADO);

        return (
          <div
            className={`text-center font-medium select-none tracking-widest text-sm ${
              isExpanded ? 'text-white' : 'text-gray-800'
            }`}
          >
            {formatarNumeros(getValue() as number)}
          </div>
        );
      },
      enableColumnFilter: true,
      filterFn: (row, columnId, filterValue) => {
        if (!filterValue || filterValue.trim() === '') return true;
        const cellValue = row.getValue(columnId);
        if (cellValue == null) return false;
        const cellString = String(cellValue).replace(/\D/g, '');
        const filterString = String(filterValue).replace(/\D/g, '');
        return cellString.includes(filterString);
      },
    },
    // ===============

    {
      id: 'DATA_CHAMADO',
      header: () => (
        <div className="text-center tracking-widest font-bold select-none text-white">
          DATA/HORA ABERTURA
        </div>
      ),
      cell: ({ row }) => {
        const isExpanded = expandedRows.has(row.original.COD_CHAMADO);
        const data = row.original.DATA_CHAMADO;
        const hora = row.original.HORA_CHAMADO;
        return (
          <div
            className={`text-center tracking-widest font-medium select-none text-gray-800 text-sm ${isExpanded ? 'text-white' : 'text-gray-800'}`}
          >
            {formatarDataHoraChamado(data, hora)}
          </div>
        );
      },
      enableColumnFilter: true,
      filterFn: (row, _columnId, filterValue) => {
        if (!filterValue || filterValue.trim() === '') return true;
        const data = formatarDataParaBR(row.original.DATA_CHAMADO);
        const hora = formatarHora(row.original.HORA_CHAMADO);
        const combined = `${data} - ${hora}`;
        return combined.toLowerCase().includes(filterValue.toLowerCase());
      },
    },

    // Prioridade do Chamado
    {
      accessorKey: 'PRIOR_CHAMADO',
      id: 'PRIOR_CHAMADO',
      header: () => (
        <div className="text-center tracking-widest font-bold select-none text-white">
          PRIOR.
        </div>
      ),
      cell: ({ getValue, row }) => {
        const isExpanded = expandedRows.has(row.original.COD_CHAMADO);
        const value = getValue() as number;
        return (
          <div
            className={`text-center font-medium select-none tracking-widest text-sm ${isExpanded ? 'text-white' : 'text-gray-800'}`}
          >
            {value}
          </div>
        );
      },
      size: parseFloat(getColumnWidth('PRIOR_CHAMADO')),
      enableColumnFilter: true,
    },
    // ===============

    // Cliente (apenas para Admin)
    ...(isAdmin
      ? [
          {
            accessorKey: 'NOME_CLIENTE' as const,
            id: 'NOME_CLIENTE',
            header: () => (
              <div className="text-center tracking-widest font-bold select-none text-white">
                CLIENTE
              </div>
            ),
            cell: ({ getValue, row }: any) => {
              const isExpanded = expandedRows.has(row.original.COD_CHAMADO);
              const fullName = (getValue() as string) ?? '---------------';

              // Verifica se é o valor padrão
              const isSemCliente = fullName === '---------------';

              // Se for "---------------", retorna centralizado e vermelho
              if (isSemCliente) {
                return (
                  <div className="text-center tracking-widest select-none font-medium text-red-500 text-sm italic">
                    {fullName}
                  </div>
                );
              }

              // Caso contrário, comportamento normal
              const parts = fullName.trim().split(/\s+/).filter(Boolean);
              const display =
                parts.length <= 2
                  ? parts.join(' ')
                  : parts.slice(0, 2).join(' ');

              return (
                <TooltipTabela content={fullName} maxWidth="200px">
                  <div
                    className={`text-left tracking-widest select-none font-medium text-gray-800 text-sm truncate ${isExpanded ? 'text-white' : 'text-gray-800'}`}
                  >
                    {display}
                  </div>
                </TooltipTabela>
              );
            },
            enableColumnFilter: true,
          } as ColumnDef<ChamadoRowProps>,
        ]
      : []),
    // ===============

    // Solicitação
    {
      accessorKey: 'SOLICITACAO_CHAMADO',
      id: 'SOLICITACAO_CHAMADO',
      header: () => (
        <div className="text-center tracking-widest font-bold select-none text-white">
          SOLICITAÇÃO/DESCRIÇÃO
        </div>
      ),
      cell: ({ getValue, row }) => {
        const isExpanded = expandedRows.has(row.original.COD_CHAMADO);
        const value = getValue() as string | null;
        const textoCorrigido = value
          ? corrigirTextoCorrompido(value)
          : '------------------------------';
        const isNoSolicitacao =
          textoCorrigido === '------------------------------';
        const colorClass = isNoSolicitacao
          ? 'text-red-500 italic'
          : 'text-gray-800';
        const alignClass = isNoSolicitacao ? 'text-center' : 'text-left';

        return (
          <TooltipTabela content={textoCorrigido} maxWidth="400px">
            <div
              className={`truncate tracking-widest select-none font-medium text-sm w-full ${alignClass} ${colorClass} ${isExpanded ? 'text-white' : colorClass}`}
            >
              {textoCorrigido}
            </div>
          </TooltipTabela>
        );
      },
      enableColumnFilter: true,
    },
    // ===============

    // Recurso (Consultor)
    {
      accessorKey: 'NOME_RECURSO',
      id: 'NOME_RECURSO',
      header: () => (
        <div className="text-center tracking-widest font-bold select-none text-white">
          CONSULTOR
        </div>
      ),
      cell: ({ getValue, row }) => {
        const isExpanded = expandedRows.has(row.original.COD_CHAMADO);
        const raw = (getValue() as string) ?? '---------------';
        const corrected = corrigirTextoCorrompido(raw);

        // Verifica se é o valor padrão
        const isSemRecurso = corrected === '---------------';

        // Se for "---------------", retorna centralizado e vermelho
        if (isSemRecurso) {
          return (
            <div
              className="text-center tracking-widest select-none font-medium text-red-500 text-sm italic"
            >
              {corrected}
            </div>
          );
        }

        // Caso contrário, comportamento normal
        const parts = corrected.trim().split(/\s+/).filter(Boolean);
        const display =
          parts.length <= 2 ? parts.join(' ') : parts.slice(0, 2).join(' ');

        return (
          <TooltipTabela content={corrected} maxWidth="200px">
            <div className={`text-left tracking-widest select-none font-medium text-sm w-full text-gray-800 ${isExpanded ? 'text-white' : 'text-gray-800'}`}>
              {display}
            </div>
          </TooltipTabela>
        );
      },
      enableColumnFilter: true,
    },
    // ===============

    // Data de Envio
    {
      accessorKey: 'DTENVIO_CHAMADO',
      id: 'DTENVIO_CHAMADO',
      header: () => (
        <div className="text-center tracking-widest font-bold select-none text-white">
          DATA/HORA ATRIBUIÇÃO
        </div>
      ),
      cell: ({ getValue, row }) => {
        const isExpanded = expandedRows.has(row.original.COD_CHAMADO);
        const value = getValue() as string | null;
        const textoCorrigido = value
          ? corrigirTextoCorrompido(value)
          : '---------------';
        const isNoData = textoCorrigido === '---------------';
        const colorClass = isNoData ? 'text-red-500 italic' : 'text-gray-800';

        return (
          <TooltipTabela content={textoCorrigido} maxWidth="200px">
            <div
              className={`text-center tracking-widest select-none font-medium text-sm w-full ${colorClass} ${isExpanded ? 'text-white' : colorClass}`}
            >
              {textoCorrigido}
            </div>
          </TooltipTabela>
        );
      },
      enableColumnFilter: true,
    },
    // ===============

    // Status
    {
      accessorKey: 'STATUS_CHAMADO',
      id: 'STATUS_CHAMADO',
      header: () => (
        <div className="text-center tracking-widest font-bold select-none text-white">
          STATUS
        </div>
      ),
      cell: ({ getValue, row }) => {
        const value = getValue() as string;
        return (
          <div
            className="text-center tracking-widest select-none font-medium text-sm w-full"
          >
            <StatusBadge status={value} />
          </div>
        );
      },

      enableColumnFilter: true,
      filterFn: (row, _columnId, filterValue) => {
        if (!filterValue) return true;

        const value = row.getValue('STATUS_CHAMADO') as
          | string
          | null
          | undefined;
        const cellValueUpper = (value ?? '').toString().toUpperCase().trim();
        const filterValueUpper = filterValue.toString().toUpperCase().trim();

        return cellValueUpper === filterValueUpper;
      },
    },
    // ===============

    // Quantidade de horas em OS
    {
      accessorKey: 'TOTAL_HORAS_OS',
      id: 'TOTAL_HORAS_OS',
      header: () => (
        <div className="text-center tracking-widest font-bold select-none text-white">
          HORAS GASTAS
        </div>
      ),
      cell: ({ getValue, row }) => {
        const isExpanded = expandedRows.has(row.original.COD_CHAMADO);
        const value = getValue() as number | null;
        const horasFormatadas = formatarHorasTotaisSufixo(value);
        const isZero = !value || value === 0;
        const colorClass = isZero ? 'text-gray-400 italic' : 'text-gray-800';

        return (
          <div
            className={`text-center tracking-widest select-none font-medium text-sm w-full ${colorClass} ${isExpanded ? 'text-white' : colorClass}`}
          >
            {horasFormatadas}
          </div>
        );
      },
      enableColumnFilter: true,
      filterFn: (row, columnId, filterValue) => {
        if (!filterValue || filterValue.trim() === '') return true;
        const cellValue = row.getValue(columnId) as number;
        const filterNumber = parseFloat(filterValue);
        if (isNaN(filterNumber)) return false;
        return cellValue >= filterNumber;
      },
    },
    // ===============

    // Data de Conclusão
    {
      accessorKey: 'CONCLUSAO_CHAMADO',
      id: 'CONCLUSAO_CHAMADO',
      header: () => (
        <div className="text-center tracking-widest font-bold select-none text-white">
          DATA CONCLUSÃO
        </div>
      ),
      cell: ({ getValue, row }) => {
        const isExpanded = expandedRows.has(row.original.COD_CHAMADO);
        const status = row.original.STATUS_CHAMADO;
        const value = getValue() as string | null;

        // Se o status não for FINALIZADO, não mostra a data
        if (status?.toUpperCase() !== 'FINALIZADO') {
          return (
            <div
              className="text-center tracking-widest select-none font-medium text-sm italic"
            >
              ---------------
            </div>
          );
        }

        // Se for FINALIZADO, mostra a data ou "Sem conclusão"
        const formattedDate = value
          ? formatarDataParaBR(value)
          : '---------------';
        const isNoConclusao = formattedDate === '---------------';
        const colorClass = isNoConclusao
          ? 'text-red-500 italic'
          : 'text-gray-800';

        return (
          <TooltipTabela content={formattedDate} maxWidth="200px">
            <div
              className={`text-center tracking-widest select-none font-medium text-sm w-full ${colorClass} ${isExpanded ? 'text-white' : colorClass}`}
            >
              {formattedDate}
            </div>
          </TooltipTabela>
        );
      },
      enableColumnFilter: true,
    },
    // ===============

    // Código da Classificação
    {
      accessorKey: 'COD_CLASSIFICACAO',
      id: 'COD_CLASSIFICACAO',
      header: () => (
        <div className="text-center tracking-widest font-bold select-none text-white">
          CLASS.
        </div>
      ),
      cell: ({ getValue, row }) => {
        const isExpanded = expandedRows.has(row.original.COD_CHAMADO);
        const value = getValue() as number;
        const nomeClassificacao =
          row.original.NOME_CLASSIFICACAO || 'Sem classificação';

        return (
          <TooltipTabelaChamado content={nomeClassificacao} maxWidth="250px">
            <div
              className={`text-center tracking-widest select-none font-medium text-sm w-full text-gray-800 ${isExpanded ? 'text-white' : 'text-gray-800'}`}
            >
              {formatarNumeros(value)}
            </div>
          </TooltipTabelaChamado>
        );
      },
      enableColumnFilter: true,
    },
    // ===============
  ];

  return allColumns;
};

// Exportação default para compatibilidade
// export const colunasChamados = getColunasChamados(true, new Set());
