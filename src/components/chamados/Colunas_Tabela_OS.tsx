import { formatarDataParaBR } from '@/formatters/formatar-data';
import {
  formatarHora,
  formatarHorasTotaisSufixo,
} from '@/formatters/formatar-hora';
import { formatarNumeros } from '@/formatters/formatar-numeros';
import { ColumnDef } from '@tanstack/react-table';
import { FaCheckCircle, FaTimesCircle } from 'react-icons/fa';
import { corrigirTextoCorrompido } from '../../formatters/formatar-texto-corrompido';
import { TooltipTabela } from '../utils/Tooltip';

// ==================== INTERFACES ====================
export interface OSRowProps {
  // COD_OS: number;
  NUM_OS: number;
  DTINI_OS: string;
  HRINI_OS: string;
  HRFIM_OS: string;
  TOTAL_HORAS_OS: number;
  NOME_RECURSO: string | null;
  NOME_TAREFA: string | null;
  VALCLI_OS: string | null;
}
// ===============

// ==================== LARGURAS DAS COLUNAS ====================

const COLUMN_WIDTH_ADMIN: Record<string, string> = {
  // COD_OS: '8%',
  NUM_OS: '10%',
  DTINI_OS: '10%',
  HRINI_OS: '10%',
  HRFIM_OS: '10%',
  TOTAL_HORAS_OS: '10%',
  NOME_RECURSO: '15%',
  NOME_TAREFA: '15%',
  VALCLI_OS: '12%',
};

const COLUMN_WIDTH_CLIENT: Record<string, string> = {
  // COD_OS: '8%',
  NUM_OS: '10%',
  DTINI_OS: '10%',
  HRINI_OS: '10%',
  HRFIM_OS: '10%',
  TOTAL_HORAS_OS: '10%',
  NOME_RECURSO: '15%',
  NOME_TAREFA: '15%',
  VALCLI_OS: '12%',
};
// ===============

// Função atualizada que considera o contexto admin/cliente
export function getColumnWidthOS(
  columnId: string,
  isAdmin: boolean = true,
): string {
  const widthMap = isAdmin ? COLUMN_WIDTH_ADMIN : COLUMN_WIDTH_CLIENT;
  return widthMap[columnId] || 'auto';
}
// ===============

// ==================== COMPONENTE DE VALIDAÇÃO ====================
const ValidacaoBadge = ({ status }: { status?: string | null }) => {
  const statusNormalized = (status ?? 'SIM').toString().toUpperCase().trim();

  if (statusNormalized === 'SIM') {
    return (
      <div className="inline-flex items-center gap-2 rounded bg-emerald-300 px-3 py-1.5 text-sm font-extrabold text-emerald-700 tracking-widest select-none italic border border-emerald-400">
        <FaCheckCircle className="text-emerald-700" size={16} />
        Aprovado
      </div>
    );
  }

  if (statusNormalized === 'NAO') {
    return (
      <div className="inline-flex items-center gap-2 rounded bg-red-300 px-3 py-1.5 text-sm font-extrabold text-red-700 tracking-widest select-none italic border border-red-400">
        <FaTimesCircle className="text-red-700" size={16} />
        Recusado
      </div>
    );
  }

  return (
    <div className="inline-flex items-center gap-2 rounded bg-gray-300 px-3 py-1.5 text-sm font-extrabold text-gray-800 tracking-widest select-none italic border border-gray-400">
      {status ?? '---------------'}
    </div>
  );
};
// ===============

// ==================== COLUNAS ====================
export const getColunasOS = (): ColumnDef<OSRowProps>[] => {
  return [
    // Código da OS
    // {
    //   accessorKey: 'COD_OS',
    //   id: 'COD_OS',
    //   header: () => (
    //     <div className="text-center tracking-widest font-extrabold select-none text-white text-sm">
    //       OS
    //     </div>
    //   ),
    //   cell: ({ getValue }) => {
    //     const value = getValue() as number;
    //     return (
    //       <div className="text-center font-semibold select-none tracking-widest text-sm text-gray-800">
    //         {formatarNumeros(value)}
    //       </div>
    //     );
    //   },
    // },
    // ===============

    //  Número da OS
    {
      accessorKey: 'NUM_OS',
      id: 'NUM_OS',
      header: () => (
        <div className="text-center tracking-widest font-extrabold select-none text-white text-sm">
          NÚMERO OS
        </div>
      ),
      cell: ({ getValue }) => {
        const value = getValue() as number;
        return (
          <div className="text-center font-semibold select-none tracking-widest text-sm text-gray-800">
            {formatarNumeros(value)}
          </div>
        );
      },
    },
    // ===============

    // Data de Início
    {
      accessorKey: 'DTINI_OS',
      id: 'DTINI_OS',
      header: () => (
        <div className="text-center tracking-widest font-extrabold select-none text-white text-sm">
          DATA
        </div>
      ),
      cell: ({ getValue }) => {
        const dateString = getValue() as string;
        const formattedDate = formatarDataParaBR(dateString);
        return (
          <div className="text-center font-semibold select-none tracking-widest text-sm text-gray-800">
            {formattedDate}
          </div>
        );
      },
    },
    // ===============

    // Hora de Início
    {
      accessorKey: 'HRINI_OS',
      id: 'HRINI_OS',
      header: () => (
        <div className="text-center tracking-widest font-extrabold select-none text-white text-sm">
          HR. INÍCIO
        </div>
      ),
      cell: ({ getValue }) => {
        const value = getValue() as string;
        return (
          <div className="text-center font-semibold select-none tracking-widest text-sm text-gray-800">
            {formatarHora(value)}
          </div>
        );
      },
    },
    // ===============

    // Hora do Fim
    {
      accessorKey: 'HRFIM_OS',
      id: 'HRFIM_OS',
      header: () => (
        <div className="text-center tracking-widest font-extrabold select-none text-white text-sm">
          HR. FIM
        </div>
      ),
      cell: ({ getValue }) => {
        const value = getValue() as string;
        return (
          <div className="text-center font-semibold select-none tracking-widest text-sm text-gray-800">
            {formatarHora(value)}
          </div>
        );
      },
    },
    // ===============

    // Total de Horas Trabalhadas
    {
      accessorKey: 'TOTAL_HORAS_OS',
      id: 'TOTAL_HORAS_OS',
      header: () => (
        <div className="text-center tracking-widest font-extrabold select-none text-white text-sm">
          TOTAL HORAS
        </div>
      ),
      cell: ({ getValue }) => {
        const value = getValue() as number;
        return (
          <div className="text-center font-semibold select-none tracking-widest text-sm text-gray-800">
            {formatarHorasTotaisSufixo(value)}
          </div>
        );
      },
    },
    // ===============

    // Consultor
    {
      accessorKey: 'NOME_RECURSO',
      id: 'NOME_RECURSO',
      header: () => (
        <div className="text-center tracking-widest font-extrabold select-none text-white text-sm">
          CONSULTOR
        </div>
      ),
      cell: ({ getValue }) => {
        const raw = (getValue() as string) ?? 'N/A';
        const corrected = corrigirTextoCorrompido(raw);
        const parts = corrected.trim().split(/\s+/).filter(Boolean);
        const display =
          parts.length <= 2 ? parts.join(' ') : parts.slice(0, 2).join(' ');
        return (
          <TooltipTabela content={corrected} maxWidth="200px">
            <div className="text-left font-semibold select-none tracking-widest text-sm text-gray-800 truncate">
              {display}
            </div>
          </TooltipTabela>
        );
      },
    },
    // ===============

    // Nome da Tarefa
    {
      accessorKey: 'NOME_TAREFA',
      id: 'NOME_TAREFA',
      header: () => (
        <div className="text-center tracking-widest font-extrabold select-none text-white text-sm">
          ENTREGÁVEL
        </div>
      ),
      cell: ({ getValue }) => {
        const raw = (getValue() as string) ?? 'N/A';
        return (
          <TooltipTabela content={raw} maxWidth="200px">
            <div className="text-left font-semibold select-none tracking-widest text-sm text-gray-800">
              {corrigirTextoCorrompido(raw)}
            </div>
          </TooltipTabela>
        );
      },
    },
    // ===============

    // Validação
    {
      accessorKey: 'VALCLI_OS',
      id: 'VALCLI_OS',
      header: () => (
        <div className="text-center tracking-widest font-extrabold select-none text-white text-sm">
          VALIDAÇÃO
        </div>
      ),
      cell: ({ getValue }) => (
        <div className="flex justify-center w-full">
          <ValidacaoBadge status={getValue() as string | null} />
        </div>
      ),
    },
    // ===============
  ];
};

// export const colunasOS = getColunasOS();
