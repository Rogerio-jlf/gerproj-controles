import {
  formatarDataHoraChamado,
  formatarDataParaBR,
} from '@/formatters/formatar-data';
import { formatarHorasTotaisSufixo } from '@/formatters/formatar-hora';
import {
  formatarNumeros,
  formatarPrioridade,
} from '@/formatters/formatar-numeros';
import { ColumnDef } from '@tanstack/react-table';
import { ChevronRight } from 'lucide-react';
import React from 'react';
import { corrigirTextoCorrompido } from '../../formatters/formatar-texto-corrompido';
import { TooltipTabela } from '../utils/Tooltip';

// ==================== TIPOS ====================
export type ChamadoRowProps = {
  COD_CHAMADO: number;
  DATA_CHAMADO: string;
  HORA_CHAMADO: string;
  CONCLUSAO_CHAMADO: string | null;
  STATUS_CHAMADO: string;
  DTENVIO_CHAMADO: string | null;
  ASSUNTO_CHAMADO: string | null;
  EMAIL_CHAMADO: string | null;
  PRIOR_CHAMADO: number;
  NOME_RECURSO: string | null;
  NOME_CLASSIFICACAO: string | null;
  TOTAL_HORAS_OS: number;
  TEM_OS?: boolean;
};

// Função para obter as classes de estilo com base no status
const getStylesStatus = (status: string | undefined) => {
  switch (status?.toUpperCase()) {
    case 'NAO FINALIZADO':
      return 'bg-red-600 border border-red-700 text-white italic';
    case 'EM ATENDIMENTO':
      return 'bg-blue-600 border border-blue-700 text-white italic';
    case 'FINALIZADO':
      return 'bg-green-600 border border-green-700 text-white italic';
    case 'NAO INICIADO':
      return 'bg-yellow-600 border border-yellow-700 text-white italic';
    case 'STANDBY':
      return 'bg-orange-600 border border-orange-700 text-white italic';
    case 'ATRIBUIDO':
      return 'bg-teal-600 border border-teal-700 text-white italic';
    case 'AGUARDANDO VALIDACAO':
      return 'bg-purple-600 border border-purple-700 text-white italic';
    default:
      return 'bg-gray-500 border border-gray-600 text-black italic';
  }
};

// Componente de Badge para Status
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

// Componente auxiliar para células com tooltip condicional
const CellWithConditionalTooltip = ({
  content,
  className,
  maxWidth = '400px',
}: {
  content: string;
  className: string;
  maxWidth?: string;
}) => {
  const cellRef = React.useRef<HTMLDivElement>(null);
  const [isTruncated, setIsTruncated] = React.useState(false);

  React.useEffect(() => {
    const checkTruncation = () => {
      if (cellRef.current) {
        setIsTruncated(
          cellRef.current.scrollWidth > cellRef.current.clientWidth,
        );
      }
    };

    checkTruncation();

    const resizeObserver = new ResizeObserver(checkTruncation);
    if (cellRef.current) {
      resizeObserver.observe(cellRef.current);
    }

    return () => {
      resizeObserver.disconnect();
    };
  }, [content]);

  const cellContent = (
    <div ref={cellRef} className={className}>
      {content}
    </div>
  );

  return isTruncated ? (
    <TooltipTabela content={content} maxWidth={maxWidth}>
      {cellContent}
    </TooltipTabela>
  ) : (
    cellContent
  );
};

// ==================== COLUNAS ====================
export const getColunasChamados = (
  isAdmin: boolean,
  expandedRows: Set<number>,
  columnWidths?: Record<string, number>,
): ColumnDef<ChamadoRowProps>[] => {
  const allColumns: ColumnDef<ChamadoRowProps>[] = [
    // CÓDIGO DO CHAMADO COM ÍCONE
    {
      accessorKey: 'COD_CHAMADO',
      id: 'COD_CHAMADO',
      header: () => (
        <div className="text-center tracking-widest font-bold select-none text-white text-sm">
          CHAMADO
        </div>
      ),
      cell: ({ getValue, row }) => {
        const temOS = row.original.TEM_OS ?? false;
        const value = getValue() as number;

        return (
          <div className="flex items-center gap-2">
            {/* Ícone indicando que há OS's */}
            <div className="flex items-center justify-center w-6 h-6 flex-shrink-0">
              {temOS ? (
                <ChevronRight
                  className="text-gray-800 transition-transform group-hover:scale-125"
                  size={24}
                />
              ) : (
                <div className="w-6 h-6" />
              )}
            </div>

            {/* Número do Chamado */}
            <div className="text-left font-semibold select-none tracking-widest text-sm flex-1 text-gray-800">
              {formatarNumeros(value)}
            </div>
          </div>
        );
      },
      enableColumnFilter: true,
    },

    // Data/Hora do Chamado
    {
      id: 'DATA_CHAMADO',
      header: () => (
        <div className="text-center tracking-widest font-bold select-none text-white text-sm">
          ENTRADA
        </div>
      ),
      cell: ({ row }) => {
        const data = row.original.DATA_CHAMADO;
        const hora = row.original.HORA_CHAMADO;
        return (
          <div className="text-center font-semibold select-none tracking-widest text-sm text-gray-800">
            {formatarDataHoraChamado(data, hora)}
          </div>
        );
      },
      enableColumnFilter: true,
    },

    // Prioridade do Chamado
    {
      accessorKey: 'PRIOR_CHAMADO',
      id: 'PRIOR_CHAMADO',
      header: () => (
        <div className="text-center tracking-widest font-bold select-none text-white text-sm">
          PRIOR.
        </div>
      ),
      cell: ({ getValue }) => {
        const value = getValue() as number;
        return (
          <div className="text-center font-semibold select-none tracking-widest text-sm text-gray-800">
            {formatarPrioridade(value)}
          </div>
        );
      },
      enableColumnFilter: true,
    },

    // Assunto do Chamado
    {
      accessorKey: 'ASSUNTO_CHAMADO',
      id: 'ASSUNTO_CHAMADO',
      header: () => (
        <div className="text-center tracking-widest font-bold select-none text-white text-sm">
          ASSUNTO
        </div>
      ),
      cell: ({ getValue }) => {
        const value = getValue() as string | null;
        const textValue = corrigirTextoCorrompido(value);

        return (
          <CellWithConditionalTooltip
            content={textValue}
            className="font-semibold select-none tracking-widest text-sm overflow-hidden whitespace-nowrap truncate text-gray-800"
            maxWidth="400px"
          />
        );
      },
      enableColumnFilter: true,
    },

    // Email do Chamado
    {
      accessorKey: 'EMAIL_CHAMADO',
      id: 'EMAIL_CHAMADO',
      header: () => (
        <div className="text-center tracking-widest font-bold select-none text-white text-sm">
          EMAIL
        </div>
      ),
      cell: ({ getValue }) => {
        const value = (getValue() as string) ?? '---------------';

        const isSemEmailChamado = value === '---------------';

        if (isSemEmailChamado) {
          return (
            <div className="text-center font-semibold select-none tracking-widest text-sm text-gray-800">
              {value}
            </div>
          );
        }

        return (
          <CellWithConditionalTooltip
            content={value}
            className="text-left font-semibold select-none tracking-widest text-sm overflow-hidden whitespace-nowrap truncate text-gray-800"
            maxWidth="300px"
          />
        );
      },
      enableColumnFilter: true,
    },

    // Nome Classificação
    {
      accessorKey: 'NOME_CLASSIFICACAO',
      id: 'NOME_CLASSIFICACAO',
      header: () => (
        <div className="text-center tracking-widest font-bold select-none text-white text-sm">
          CLASSIFICAÇÃO
        </div>
      ),
      cell: ({ getValue }) => {
        const value = getValue() as string | null;
        const textValue = corrigirTextoCorrompido(value);

        return (
          <CellWithConditionalTooltip
            content={textValue}
            className="text-left font-semibold select-none tracking-widest text-sm overflow-hidden whitespace-nowrap truncate text-gray-800"
            maxWidth="300px"
          />
        );
      },
      enableColumnFilter: true,
    },

    // Data de Envio do Chamado
    {
      accessorKey: 'DTENVIO_CHAMADO',
      id: 'DTENVIO_CHAMADO',
      header: () => (
        <div className="text-center tracking-widest font-bold select-none text-white text-sm">
          ATRIBUIÇÃO
        </div>
      ),
      cell: ({ getValue }) => {
        const value = (getValue() as string) ?? '---------------';

        const isSemDtEnvioChamado = value === '---------------';

        if (isSemDtEnvioChamado) {
          return (
            <div className="text-center font-semibold select-none tracking-widest text-sm text-gray-800">
              {value}
            </div>
          );
        }

        return (
          <div className="text-left font-semibold select-none tracking-widest text-sm text-gray-800">
            {value}
          </div>
        );
      },
      enableColumnFilter: true,
    },

    // Recurso do Chamado
    {
      accessorKey: 'NOME_RECURSO',
      id: 'NOME_RECURSO',
      header: () => (
        <div className="text-center tracking-widest font-bold select-none text-white text-sm">
          CONSULTOR
        </div>
      ),
      cell: ({ getValue }) => {
        const value = (getValue() as string) ?? '---------------';

        const isSemNomeRecursoChamado = value === '---------------';

        if (isSemNomeRecursoChamado) {
          return (
            <div className="text-center font-semibold select-none tracking-widest text-sm text-gray-800">
              {value}
            </div>
          );
        }

        const parts = value.trim().split(/\s+/).filter(Boolean);
        const display =
          parts.length <= 2 ? parts.join(' ') : parts.slice(0, 2).join(' ');
        const textValue = corrigirTextoCorrompido(display);

        return (
          <CellWithConditionalTooltip
            content={textValue}
            className="font-semibold select-none tracking-widest text-sm overflow-hidden whitespace-nowrap truncate text-gray-800"
            maxWidth="250px"
          />
        );
      },
      enableColumnFilter: true,
    },

    // Status do Chamado
    {
      accessorKey: 'STATUS_CHAMADO',
      id: 'STATUS_CHAMADO',
      header: () => (
        <div className="text-center tracking-widest font-bold select-none text-white text-sm">
          STATUS
        </div>
      ),
      cell: ({ getValue }) => {
        const value = getValue() as string;
        return (
          <div className="text-center font-semibold select-none tracking-widest text-sm w-full">
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

    // Conclusão do chamado
    {
      accessorKey: 'CONCLUSAO_CHAMADO',
      id: 'CONCLUSAO_CHAMADO',
      header: () => (
        <div className="text-center tracking-widest font-bold select-none text-white text-sm">
          CONCLUSÃO
        </div>
      ),
      cell: ({ getValue }) => {
        const value = (getValue() as string) ?? '---------------';

        const isSemConclusaoChamado = value === '---------------';

        if (isSemConclusaoChamado) {
          return (
            <div className="text-center font-semibold select-none tracking-widest text-sm text-gray-800">
              {value}
            </div>
          );
        }

        return (
          <div className="text-center font-semibold select-none tracking-widest text-sm text-gray-800">
            {formatarDataParaBR(value)}
          </div>
        );
      },
      enableColumnFilter: true,
    },

    // Quantidade de horas
    {
      accessorKey: 'TOTAL_HORAS_OS',
      id: 'TOTAL_HORAS_OS',
      header: () => (
        <div className="text-center tracking-widest font-bold select-none text-white text-sm">
          QTD. HORAS
        </div>
      ),
      cell: ({ getValue }) => {
        const value = getValue() as number | null;

        return (
          <div className="text-center font-semibold select-none tracking-widest text-sm text-gray-800">
            {formatarHorasTotaisSufixo(value)}
          </div>
        );
      },
      enableColumnFilter: false,
    },
  ];

  return allColumns;
};