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
  COD_OS: number;
  NOME_CLIENTE: string | null;
  DTINI_OS: string;
  HRINI_OS: string;
  HRFIM_OS: string;
  HORAS_TRABALHADAS: number;
  NOME_RECURSO: string | null;
  DTINC_OS: string | null;
  OBS_OS: string | null;
  VALCLI_OS: string | null;
}
// ===============

// ==================== LARGURAS DAS COLUNAS ====================

const COLUMN_WIDTH_ADMIN: Record<string, string> = {
  COD_OS: '5%',
  NOME_CLIENTE: '12%',
  DTINI_OS: '8%',
  HRINI_OS: '8%',
  HRFIM_OS: '8%',
  HORAS_TRABALHADAS: '8%',
  NOME_RECURSO: '12%',
  DTINC_OS: '10%',
  OBS_OS: '19%',
  VALCLI_OS: '10%',
};

const COLUMN_WIDTH_CLIENT: Record<string, string> = {
  COD_OS: '5%',
  DTINI_OS: '8%',
  HRINI_OS: '8%',
  HRFIM_OS: '8%',
  HORAS_TRABALHADAS: '10%',
  NOME_RECURSO: '13%',
  DTINC_OS: '9%',
  OBS_OS: '14%',
  VALCLI_OS: '10%',
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
      <div className="inline-flex items-center gap-2 rounded bg-emerald-200 px-3 py-1.5 text-sm font-extrabold text-emerald-800 tracking-widest select-none italic">
        <FaCheckCircle className="text-emerald-700" size={16} />
        Aprovado
      </div>
    );
  }

  if (statusNormalized === 'NAO') {
    return (
      <div className="inline-flex items-center gap-2 rounded bg-red-200 px-3 py-1.5 text-sm font-extrabold text-red-800 tracking-widest select-none italic">
        <FaTimesCircle className="text-red-700" size={16} />
        Recusado
      </div>
    );
  }

  return (
    <div className="inline-flex items-center gap-2 rounded bg-slate-200 px-3 py-1.5 text-sm font-extrabold text-slate-800 tracking-widest select-none italic">
      {status ?? '---------------'}
    </div>
  );
};
// ===============

// ==================== COLUNAS ====================
export const getColunasOS = (): ColumnDef<OSRowProps>[] => {
  return [
    // Código da OS
    {
      accessorKey: 'COD_OS',
      id: 'COD_OS',
      header: () => (
        <div className="text-center tracking-widest font-extrabold select-none text-white text-sm">
          OS
        </div>
      ),
      cell: ({ getValue }) => (
        <div className="text-center font-semibold select-none tracking-widest text-gray-800 text-sm">
          {formatarNumeros(getValue() as number)}
        </div>
      ),
    },
    // ===============

    // Nome do cliente
    {
      accessorKey: 'NOME_CLIENTE',
      id: 'NOME_CLIENTE',
      header: () => (
        <div className="text-center tracking-widest font-extrabold select-none text-white text-sm">
          CLIENTE
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
            <div className="text-left tracking-widest select-none font-semibold text-gray-800 text-sm truncate">
              {display}
            </div>
          </TooltipTabela>
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
          <div className="text-center font-semibold select-none tracking-widest text-gray-800 text-sm">
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
          <div className="text-center font-semibold select-none tracking-widest text-gray-800 text-sm">
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
          <div className="text-center font-semibold select-none tracking-widest text-gray-800 text-sm">
            {formatarHora(value)}
          </div>
        );
      },
    },
    // ===============

    // Total de Horas Trabalhadas
    {
      accessorKey: 'HORAS_TRABALHADAS',
      id: 'total_horas',
      header: () => (
        <div className="text-center tracking-widest font-extrabold select-none text-white text-sm">
          TOTAL HORAS
        </div>
      ),
      cell: ({ getValue }) => {
        const value = getValue() as number;
        return (
          <div className="text-center font-semibold select-none tracking-widest text-gray-800 text-sm">
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
            <div className="text-left tracking-widest select-none font-semibold text-gray-800 text-sm truncate">
              {display}
            </div>
          </TooltipTabela>
        );
      },
    },
    // ===============

    // Data de Inclusão
    {
      accessorKey: 'DTINC_OS',
      id: 'DTINC_OS',
      header: () => (
        <div className="text-center tracking-widest font-extrabold select-none text-white text-sm">
          INCLUÍDO EM
        </div>
      ),
      cell: ({ getValue }) => {
        const dateString = getValue() as string | null;
        const dataHoraFormatada = formatarDataParaBR(dateString, true);

        return (
          <div className="text-center font-semibold tracking-widest text-gray-800 text-sm">
            {dataHoraFormatada}
          </div>
        );
      },
    },
    // ===============

    // Observação
    {
      accessorKey: 'OBS_OS',
      id: 'OBS_OS',
      header: () => (
        <div className="text-center tracking-widest font-extrabold select-none text-white text-sm">
          OBSERVAÇÃO
        </div>
      ),
      cell: ({ getValue }) => {
        const value = getValue() as string | null;
        const textoCorrigido = value
          ? corrigirTextoCorrompido(value)
          : '------------------------------';
        const isNoObservation = textoCorrigido === '------------------------------';
        const colorClass = isNoObservation
          ? 'text-red-500 italic'
          : 'text-slate-800';
        const alignClass = isNoObservation ? 'text-center' : 'text-left';

        return (
          <TooltipTabela content={textoCorrigido} maxWidth="300px">
            <div
              className={`truncate tracking-widest select-none font-extrabold text-sm w-full ${alignClass} ${colorClass}`}
            >
              {textoCorrigido}
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
