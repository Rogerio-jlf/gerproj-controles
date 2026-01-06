// src/components/chamados/Colunas_Tabela_Chamados.tsx - ATUALIZADO
import { ColumnDef } from '@tanstack/react-table';
import { MdChevronRight, MdInsertDriveFile } from 'react-icons/md';
import { formatarNumeros, formatarPrioridade } from '../../../formatters/formatar-numeros';
import { corrigirTextoCorrompido } from '../../../formatters/formatar-texto-corrompido';
import { DropdownStatus } from './Dropdown_Status';

// ==================== TIPOS ====================
export type ChamadoRowProps = {
    COD_CHAMADO: number;
    DATA_CHAMADO: string;
    HORA_CHAMADO: string;
    SOLICITACAO_CHAMADO?: string | null;
    CONCLUSAO_CHAMADO: string | null;
    STATUS_CHAMADO: string;
    DTENVIO_CHAMADO: string | null;
    ASSUNTO_CHAMADO: string | null;
    EMAIL_CHAMADO: string | null;
    PRIOR_CHAMADO: number;
    AVALIA_CHAMADO: number | null;
    OBSAVAL_CHAMADO: string | null;

    NOME_CLIENTE: string | null;
    NOME_RECURSO: string | null;
    NOME_CLASSIFICACAO: string | null;
    TOTAL_HORAS_OS: number;
    TEM_OS?: boolean;
};

// ================================================================================
// COMPONENTE PRINCIPAL
// ================================================================================
export const getColunasChamados = (
    isAdmin: boolean,
    expandedRows: Set<number>,
    columnWidths?: Record<string, number>,
    onOpenSolicitacao?: (chamado: ChamadoRowProps) => void,
    onOpenAvaliacao?: (chamado: ChamadoRowProps) => void,
    onChangeStatus?: (codChamado: number, statusAtual: string, novoStatus: string) => void
): ColumnDef<ChamadoRowProps>[] => {
    const allColumns: ColumnDef<ChamadoRowProps>[] = [
        // CÓDIGO DO CHAMADO COM ÍCONE
        {
            accessorKey: 'COD_CHAMADO',
            id: 'COD_CHAMADO',
            header: () => (
                <div className="text-center text-sm font-bold tracking-widest text-white select-none">
                    CHAMADO
                </div>
            ),
            cell: ({ getValue, row }) => {
                const temOS = row.original.TEM_OS ?? false;
                const value = getValue() as number;

                return (
                    <div className="flex items-center gap-2">
                        {/* Ícone indicando que há OS's */}
                        <div className="flex h-6 w-6 flex-shrink-0 items-center justify-center">
                            {temOS ? (
                                <MdChevronRight
                                    className="text-black transition-transform group-hover:scale-125"
                                    size={24}
                                />
                            ) : (
                                <div className="h-6 w-6" />
                            )}
                        </div>

                        {/* Número do Chamado */}
                        <div className="flex-1 text-left text-sm font-semibold tracking-widest text-black select-none">
                            {formatarNumeros(value)}
                        </div>
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
                <div className="text-center text-sm font-bold tracking-widest text-white select-none">
                    PRIOR.
                </div>
            ),
            cell: ({ getValue }) => {
                const value = getValue() as number;
                return (
                    <div className="text-center text-sm font-semibold tracking-widest text-black select-none">
                        {formatarPrioridade(value)}
                    </div>
                );
            },
            enableColumnFilter: true,
        },

        // Cliente do Chamado
        {
            accessorKey: 'NOME_CLIENTE',
            id: 'NOME_CLIENTE',
            header: () => (
                <div className="text-center text-sm font-bold tracking-widest text-white select-none">
                    CLIENTE
                </div>
            ),
            cell: ({ getValue }) => {
                const value = getValue() as string | null;
                const correctedTextValue = corrigirTextoCorrompido(value);
                return (
                    <div
                        className="flex-1 cursor-help truncate overflow-hidden text-sm font-semibold tracking-widest whitespace-nowrap text-black select-none"
                        title={correctedTextValue}
                    >
                        {correctedTextValue}
                    </div>
                );
            },
            enableColumnFilter: true,
        },

        // Assunto do Chamado COM BOTÃO
        {
            accessorKey: 'ASSUNTO_CHAMADO',
            id: 'ASSUNTO_CHAMADO',
            header: () => (
                <div className="text-center text-sm font-bold tracking-widest text-white select-none">
                    ASSUNTO
                </div>
            ),
            cell: ({ getValue, row }) => {
                const value = getValue() as string | null;
                const correctedTextValue = corrigirTextoCorrompido(value);

                return (
                    <div className="flex w-full items-center gap-4">
                        {onOpenSolicitacao && (
                            <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    onOpenSolicitacao(row.original);
                                }}
                                className="flex-shrink-0 cursor-pointer rounded-md bg-purple-600 p-2 shadow-md shadow-black transition-all duration-200 hover:scale-110 hover:bg-purple-800 hover:shadow-xl hover:shadow-black active:scale-95"
                                title="Visualizar detalhes do chamado"
                            >
                                <MdInsertDriveFile className="text-white" size={18} />
                            </button>
                        )}

                        {/* Texto do assunto */}
                        <div
                            className="flex-1 cursor-help truncate overflow-hidden text-sm font-semibold tracking-widest whitespace-nowrap text-black select-none"
                            title={correctedTextValue}
                        >
                            {correctedTextValue}
                        </div>
                    </div>
                );
            },
            enableColumnFilter: true,
        },

        // Email do Chamado
        {
            accessorKey: 'EMAIL_CHAMADO',
            id: 'EMAIL_CHAMADO',
            header: () => (
                <div className="text-center text-sm font-bold tracking-widest text-white select-none">
                    EMAIL
                </div>
            ),
            cell: ({ getValue }) => {
                const value = (getValue() as string) ?? '---------------';

                const isSemEmailChamado = value === '---------------';

                if (isSemEmailChamado) {
                    return (
                        <div className="text-center text-sm font-semibold tracking-widest text-black select-none">
                            {value}
                        </div>
                    );
                }

                return (
                    <div
                        className="flex-1 cursor-help truncate overflow-hidden text-sm font-semibold tracking-widest whitespace-nowrap text-black select-none"
                        title={value}
                    >
                        {value}
                    </div>
                );
            },
            enableColumnFilter: true,
        },

        // Nome Classificação
        {
            accessorKey: 'NOME_CLASSIFICACAO',
            id: 'NOME_CLASSIFICACAO',
            header: () => (
                <div className="text-center text-sm font-bold tracking-widest text-white select-none">
                    CLASSIFICAÇÃO
                </div>
            ),
            cell: ({ getValue }) => {
                const value = getValue() as string | null;
                const correctedTextValue = corrigirTextoCorrompido(value);

                return (
                    <div
                        className="flex-1 cursor-help truncate overflow-hidden text-sm font-semibold tracking-widest whitespace-nowrap text-black select-none"
                        title={correctedTextValue}
                    >
                        {correctedTextValue}
                    </div>
                );
            },
            enableColumnFilter: true,
        },

        // Data de Envio do Chamado
        {
            accessorKey: 'DTENVIO_CHAMADO',
            id: 'DTENVIO_CHAMADO',
            header: () => (
                <div className="text-center text-sm font-bold tracking-widest text-white select-none">
                    ATRIBUIÇÃO
                </div>
            ),
            cell: ({ getValue }) => {
                const value = (getValue() as string) ?? '---------------';

                const isSemDtEnvioChamado = value === '---------------';

                if (isSemDtEnvioChamado) {
                    return (
                        <div className="text-center text-sm font-semibold tracking-widest text-black select-none">
                            {value}
                        </div>
                    );
                }

                return (
                    <div className="text-center text-sm font-semibold tracking-widest text-black select-none">
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
                <div className="text-center text-sm font-bold tracking-widest text-white select-none">
                    CONSULTOR
                </div>
            ),
            cell: ({ getValue }) => {
                const value = (getValue() as string) ?? '---------------';

                const isSemNomeRecursoChamado = value === '---------------';

                if (isSemNomeRecursoChamado) {
                    return (
                        <div className="text-center text-sm font-semibold tracking-widest text-black select-none">
                            {value}
                        </div>
                    );
                }

                const correctedTextValue = corrigirTextoCorrompido(value);
                const parts = correctedTextValue.trim().split(/\s+/).filter(Boolean);
                const display = parts.length <= 2 ? parts.join(' ') : parts.slice(0, 2).join(' ');

                return (
                    <div
                        className="flex-1 cursor-help truncate overflow-hidden text-sm font-semibold tracking-widest whitespace-nowrap text-black select-none"
                        title={correctedTextValue}
                    >
                        {display}
                    </div>
                );
            },
            enableColumnFilter: true,
        },

        // ✅ NOVO: Status do Chamado COM DROPDOWN
        {
            accessorKey: 'STATUS_CHAMADO',
            id: 'STATUS_CHAMADO',
            header: () => (
                <div className="text-center text-sm font-bold tracking-widest text-white select-none">
                    STATUS
                </div>
            ),
            cell: ({ getValue, row }) => {
                const value = getValue() as string;

                // Se não houver callback de mudança de status, renderiza apenas o badge
                if (!onChangeStatus) {
                    return (
                        <div
                            className={`mx-auto flex w-full items-center justify-center rounded-md border px-3 py-1 text-sm font-bold tracking-widest text-white shadow-sm shadow-black select-none ${getStatusStyles(
                                value
                            )}`}
                        >
                            {value.toUpperCase()}
                        </div>
                    );
                }

                // Renderiza o dropdown de status
                return (
                    <div onClick={(e) => e.stopPropagation()}>
                        <DropdownStatus
                            statusAtual={value}
                            onChangeStatus={(novoStatus) => {
                                onChangeStatus(row.original.COD_CHAMADO, value, novoStatus);
                            }}
                        />
                    </div>
                );
            },
            enableColumnFilter: true,
        },
    ];

    return allColumns;
};

// Função auxiliar para obter as classes de estilo com base no status
const getStatusStyles = (status: string | undefined) => {
    switch (status?.toUpperCase()) {
        case 'NAO FINALIZADO':
            return 'bg-red-600 border-red-800';
        case 'EM ATENDIMENTO':
            return 'bg-blue-600 border-blue-800';
        case 'FINALIZADO':
            return 'bg-green-600 border-green-800';
        case 'NAO INICIADO':
            return 'bg-red-500 border-red-700';
        case 'STANDBY':
            return 'bg-orange-500 border-orange-700';
        case 'ATRIBUIDO':
            return 'bg-cyan-500 border-cyan-700';
        case 'AGUARDANDO VALIDACAO':
            return 'bg-yellow-500 border-yellow-700';
        default:
            return 'bg-gray-600 border-gray-800';
    }
};
