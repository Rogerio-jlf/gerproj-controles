// app/api/chamados/route.ts - ATUALIZADO
import { firebirdQuery } from '@/lib/firebird/firebird-client';
import { NextRequest, NextResponse } from 'next/server';

// ==================== TIPOS ====================
export interface Chamado {
    COD_CHAMADO: number;
    DATA_CHAMADO: Date;
    HORA_CHAMADO: string;
    SOLICITACAO_CHAMADO?: string | null;
    CONCLUSAO_CHAMADO: Date | null;
    STATUS_CHAMADO: string;
    DTENVIO_CHAMADO: string | null;
    ASSUNTO_CHAMADO: string | null;
    EMAIL_CHAMADO: string | null;
    PRIOR_CHAMADO: number;
    COD_CLASSIFICACAO: number;
    NOME_CLIENTE?: string | null;
    NOME_RECURSO?: string | null;
    NOME_CLASSIFICACAO?: string | null;
    TEM_OS?: boolean;
    TOTAL_HORAS_OS?: number;
    AVALIA_CHAMADO?: number;
    OBSAVAL_CHAMADO?: string | null;
}

interface QueryParams {
    isAdmin: boolean;
    codRecurso?: string;
    mes?: number;
    ano?: number;
    codChamadoFilter?: string;
    statusFilter?: string;
    codClienteFilter?: string;
    codRecursoFilter?: string;
    page: number;
    limit: number;
    columnFilters?: Record<string, string>;
}

interface ChamadoRaw {
    COD_CHAMADO: number;
    DATA_CHAMADO: Date;
    HORA_CHAMADO: string;
    SOLICITACAO_CHAMADO?: string | null;
    CONCLUSAO_CHAMADO: Date | null;
    STATUS_CHAMADO: string;
    DTENVIO_CHAMADO: string | null;
    ASSUNTO_CHAMADO: string | null;
    EMAIL_CHAMADO: string | null;
    PRIOR_CHAMADO: number;
    COD_CLASSIFICACAO: number;
    NOME_CLIENTE?: string | null;
    NOME_RECURSO?: string | null;
    NOME_CLASSIFICACAO?: string | null;
    AVALIA_CHAMADO?: number;
    OBSAVAL_CHAMADO?: string | null;
    TOTAL_HORAS_OS?: number;
}

// ==================== CACHE OTIMIZADO ====================
const nomeClienteCache = new Map<string, { nome: string | null; ts: number }>();
const nomeRecursoCache = new Map<string, { nome: string | null; ts: number }>();
const CACHE_TTL = 300000; // 5 minutos

const getCached = (
    cache: Map<string, { nome: string | null; ts: number }>,
    key: string
): string | null | undefined => {
    const c = cache.get(key);
    if (!c) return undefined;
    if (Date.now() - c.ts >= CACHE_TTL) {
        cache.delete(key);
        return undefined;
    }
    return c.nome;
};

const setCache = (
    cache: Map<string, { nome: string | null; ts: number }>,
    key: string,
    value: string | null
): void => {
    cache.set(key, { nome: value, ts: Date.now() });
};

// ==================== CONFIGURAÇÃO ====================
const CAMPOS_CHAMADO_BASE = `CHAMADO.COD_CHAMADO,
    CHAMADO.DATA_CHAMADO,
    CHAMADO.HORA_CHAMADO,
    CHAMADO.SOLICITACAO_CHAMADO,
    CHAMADO.CONCLUSAO_CHAMADO,
    CHAMADO.STATUS_CHAMADO,
    CHAMADO.DTENVIO_CHAMADO,
    CHAMADO.ASSUNTO_CHAMADO,
    CHAMADO.EMAIL_CHAMADO,
    CHAMADO.PRIOR_CHAMADO,
    CHAMADO.COD_CLASSIFICACAO,
    CLIENTE.NOME_CLIENTE,
    RECURSO.NOME_RECURSO,
    CLASSIFICACAO.NOME_CLASSIFICACAO`;

const CAMPOS_AVALIACAO = `,
    CHAMADO.AVALIA_CHAMADO,
    CHAMADO.OBSAVAL_CHAMADO`;

// ==================== VALIDAÇÕES ====================
const validarParametros = (sp: URLSearchParams): QueryParams | NextResponse => {
    const isAdmin = sp.get('isAdmin') === 'true';
    const codRecurso = sp.get('codRecurso')?.trim() || undefined;
    const page = Number(sp.get('page')) || 1;
    const limit = Number(sp.get('limit')) || 50;

    if (!isAdmin && !codRecurso) {
        return NextResponse.json(
            { error: "Parâmetro 'codRecurso' obrigatório para usuários não-admin" },
            { status: 400 }
        );
    }

    let mes: number | undefined;
    let ano: number | undefined;

    if (isAdmin) {
        mes = Number(sp.get('mes'));
        ano = Number(sp.get('ano'));

        if (!mes || mes < 1 || mes > 12) {
            return NextResponse.json({ error: "Parâmetro 'mes' inválido" }, { status: 400 });
        }

        if (!ano || ano < 2000 || ano > 3000) {
            return NextResponse.json({ error: "Parâmetro 'ano' inválido" }, { status: 400 });
        }
    } else {
        const mesParam = sp.get('mes');
        const anoParam = sp.get('ano');

        if (mesParam) {
            mes = Number(mesParam);
            if (mes < 1 || mes > 12) {
                return NextResponse.json({ error: "Parâmetro 'mes' inválido" }, { status: 400 });
            }
        }

        if (anoParam) {
            ano = Number(anoParam);
            if (ano < 2000 || ano > 3000) {
                return NextResponse.json({ error: "Parâmetro 'ano' inválido" }, { status: 400 });
            }
        }
    }

    if (page < 1) {
        return NextResponse.json({ error: "Parâmetro 'page' deve ser >= 1" }, { status: 400 });
    }

    if (limit < 1 || limit > 500) {
        return NextResponse.json(
            { error: "Parâmetro 'limit' deve estar entre 1 e 500" },
            { status: 400 }
        );
    }

    const columnFilters: Record<string, string> = {};
    for (const [key, value] of sp.entries()) {
        if (key.startsWith('filter_')) {
            const columnId = key.replace('filter_', '');
            columnFilters[columnId] = value;
        }
    }

    return {
        isAdmin,
        codRecurso,
        mes,
        ano,
        codChamadoFilter: sp.get('codChamado')?.trim() || undefined,
        statusFilter: sp.get('statusFilter')?.trim() || undefined,
        codClienteFilter: sp.get('codClienteFilter')?.trim() || undefined,
        codRecursoFilter: sp.get('codRecursoFilter')?.trim() || undefined,
        page,
        limit,
        columnFilters,
    };
};

// ==================== CONSTRUÇÃO DE DATAS ====================
const construirDatas = (mes: number, ano: number): { dataInicio: string; dataFim: string } => {
    const m = mes.toString().padStart(2, '0');
    const dataInicio = `01.${m}.${ano}`;
    const dataFim =
        mes === 12 ? `01.01.${ano + 1}` : `01.${(mes + 1).toString().padStart(2, '0')}.${ano}`;
    return { dataInicio, dataFim };
};

// ==================== QUERY ÚNICA OTIMIZADA ====================
const buscarChamadosComTotais = async (
    dataInicio: string | null,
    dataFim: string | null,
    params: QueryParams
): Promise<{
    chamados: ChamadoRaw[];
    totalChamados: number;
    totalOS: number;
    totalHoras: number;
}> => {
    try {
        const needsClient = !params.isAdmin || params.codClienteFilter;
        const codClienteAplicado = params.codClienteFilter;

        const incluirAvaliacao =
            !params.statusFilter || params.statusFilter.toUpperCase().includes('FINALIZADO');
        const camposChamado = incluirAvaliacao
            ? CAMPOS_CHAMADO_BASE + CAMPOS_AVALIACAO
            : CAMPOS_CHAMADO_BASE;

        // ===== CONSTRUIR WHERE CLAUSES =====
        const whereClauses: string[] = [];
        const whereParams: any[] = [];

        // ✅ MODIFICADO: Lógica de filtro por período ou recurso + exclusão de FINALIZADOS para não-admin
        if (params.isAdmin) {
            // Admin: Filtra por período (mes/ano)
            if (dataInicio && dataFim) {
                whereClauses.push(`(CHAMADO.DATA_CHAMADO >= ? AND CHAMADO.DATA_CHAMADO < ?)`);
                whereParams.push(dataInicio, dataFim);
            }
        } else {
            // Não-admin: Filtra por codRecurso
            if (params.codRecurso) {
                whereClauses.push(`CHAMADO.COD_RECURSO = ?`);
                whereParams.push(parseInt(params.codRecurso));
            }

            // ✅ NOVO: Não-admin não vê chamados FINALIZADOS
            whereClauses.push(`UPPER(CHAMADO.STATUS_CHAMADO) <> UPPER(?)`);
            whereParams.push('FINALIZADO');

            // Se não-admin passou mes/ano, também filtra por período
            if (params.mes && params.ano && dataInicio && dataFim) {
                whereClauses.push(`(CHAMADO.DATA_CHAMADO >= ? AND CHAMADO.DATA_CHAMADO < ?)`);
                whereParams.push(dataInicio, dataFim);
            }
        }

        if (params.codChamadoFilter) {
            whereClauses.push(`CHAMADO.COD_CHAMADO = ?`);
            whereParams.push(parseInt(params.codChamadoFilter));
        }

        if (params.statusFilter) {
            whereClauses.push(`UPPER(CHAMADO.STATUS_CHAMADO) LIKE UPPER(?)`);
            whereParams.push(`%${params.statusFilter}%`);
        }

        if (params.codClienteFilter) {
            whereClauses.push(`CHAMADO.COD_CLIENTE = ?`);
            whereParams.push(parseInt(params.codClienteFilter));
        }

        if (params.codRecursoFilter) {
            whereClauses.push(`CHAMADO.COD_RECURSO = ?`);
            whereParams.push(parseInt(params.codRecursoFilter));
        }

        // Filtros de coluna
        if (params.columnFilters) {
            if (params.columnFilters.COD_CHAMADO) {
                const codChamado = params.columnFilters.COD_CHAMADO.replace(/\D/g, '');
                if (codChamado) {
                    whereClauses.push(`CAST(CHAMADO.COD_CHAMADO AS VARCHAR(20)) LIKE ?`);
                    whereParams.push(`%${codChamado}%`);
                }
            }

            if (params.columnFilters.DATA_CHAMADO) {
                const dateNumbers = params.columnFilters.DATA_CHAMADO.replace(/\D/g, '');
                if (dateNumbers) {
                    whereClauses.push(`(
                        CAST(EXTRACT(DAY FROM CHAMADO.DATA_CHAMADO) AS VARCHAR(2)) ||
                        CAST(EXTRACT(MONTH FROM CHAMADO.DATA_CHAMADO) AS VARCHAR(2)) ||
                        CAST(EXTRACT(YEAR FROM CHAMADO.DATA_CHAMADO) AS VARCHAR(4))
                    ) LIKE ?`);
                    whereParams.push(`%${dateNumbers}%`);
                }
            }

            if (params.columnFilters.PRIOR_CHAMADO) {
                const prioridade = params.columnFilters.PRIOR_CHAMADO.replace(/\D/g, '');
                if (prioridade) {
                    whereClauses.push(`CHAMADO.PRIOR_CHAMADO = ?`);
                    whereParams.push(parseInt(prioridade));
                }
            }

            if (params.columnFilters.ASSUNTO_CHAMADO) {
                whereClauses.push(`UPPER(CHAMADO.ASSUNTO_CHAMADO) LIKE UPPER(?)`);
                whereParams.push(`%${params.columnFilters.ASSUNTO_CHAMADO}%`);
            }

            if (params.columnFilters.EMAIL_CHAMADO) {
                whereClauses.push(`UPPER(CHAMADO.EMAIL_CHAMADO) LIKE UPPER(?)`);
                whereParams.push(`%${params.columnFilters.EMAIL_CHAMADO}%`);
            }

            if (params.columnFilters.NOME_CLASSIFICACAO) {
                whereClauses.push(`CLASSIFICACAO.NOME_CLASSIFICACAO = ?`);
                whereParams.push(params.columnFilters.NOME_CLASSIFICACAO);
            }

            if (params.columnFilters.DTENVIO_CHAMADO) {
                const dateNumbers = params.columnFilters.DTENVIO_CHAMADO.replace(/\D/g, '');
                if (dateNumbers) {
                    whereClauses.push(`(
                        CAST(EXTRACT(DAY FROM CHAMADO.DTENVIO_CHAMADO) AS VARCHAR(2)) ||
                        CAST(EXTRACT(MONTH FROM CHAMADO.DTENVIO_CHAMADO) AS VARCHAR(2)) ||
                        CAST(EXTRACT(YEAR FROM CHAMADO.DTENVIO_CHAMADO) AS VARCHAR(4))
                    ) LIKE ?`);
                    whereParams.push(`%${dateNumbers}%`);
                }
            }

            if (params.columnFilters.NOME_RECURSO) {
                whereClauses.push(`RECURSO.NOME_RECURSO = ?`);
                whereParams.push(params.columnFilters.NOME_RECURSO);
            }

            if (params.columnFilters.STATUS_CHAMADO && !params.statusFilter) {
                whereClauses.push(`CHAMADO.STATUS_CHAMADO = ?`);
                whereParams.push(params.columnFilters.STATUS_CHAMADO);
            }

            if (params.columnFilters.CONCLUSAO_CHAMADO) {
                const dateNumbers = params.columnFilters.CONCLUSAO_CHAMADO.replace(/\D/g, '');
                if (dateNumbers) {
                    whereClauses.push(`(
                        CAST(EXTRACT(DAY FROM CHAMADO.CONCLUSAO_CHAMADO) AS VARCHAR(2)) ||
                        CAST(EXTRACT(MONTH FROM CHAMADO.CONCLUSAO_CHAMADO) AS VARCHAR(2)) ||
                        CAST(EXTRACT(YEAR FROM CHAMADO.CONCLUSAO_CHAMADO) AS VARCHAR(4))
                    ) LIKE ?`);
                    whereParams.push(`%${dateNumbers}%`);
                }
            }
        }

        const whereClause = whereClauses.length > 0 ? `WHERE ${whereClauses.join(' AND ')}` : '';

        const sqlCount = `SELECT COUNT(DISTINCT CHAMADO.COD_CHAMADO) AS TOTAL
FROM CHAMADO
LEFT JOIN CLIENTE ON CHAMADO.COD_CLIENTE = CLIENTE.COD_CLIENTE
LEFT JOIN RECURSO ON CHAMADO.COD_RECURSO = RECURSO.COD_RECURSO
LEFT JOIN CLASSIFICACAO ON CHAMADO.COD_CLASSIFICACAO = CLASSIFICACAO.COD_CLASSIFICACAO
${whereClause}`;

        const offset = (params.page - 1) * params.limit;

        const osDateFilter =
            dataInicio && dataFim ? `OS.DTINI_OS >= ? AND OS.DTINI_OS < ? AND` : '';

        const osDateParams = dataInicio && dataFim ? [dataInicio, dataFim] : [];

        let sqlChamados = `SELECT ${camposChamado},
    COALESCE(SUM((CAST(SUBSTRING(OS.HRFIM_OS FROM 1 FOR 2) AS INTEGER) * 60 +
         CAST(SUBSTRING(OS.HRFIM_OS FROM 3 FOR 2) AS INTEGER) -
         CAST(SUBSTRING(OS.HRINI_OS FROM 1 FOR 2) AS INTEGER) * 60 -
         CAST(SUBSTRING(OS.HRINI_OS FROM 3 FOR 2) AS INTEGER)) / 60.0), 0) AS TOTAL_HORAS_OS
FROM CHAMADO
LEFT JOIN CLIENTE ON CHAMADO.COD_CLIENTE = CLIENTE.COD_CLIENTE
LEFT JOIN RECURSO ON CHAMADO.COD_RECURSO = RECURSO.COD_RECURSO
LEFT JOIN CLASSIFICACAO ON CHAMADO.COD_CLASSIFICACAO = CLASSIFICACAO.COD_CLASSIFICACAO
LEFT JOIN OS ON CAST(CHAMADO.COD_CHAMADO AS VARCHAR(20)) = OS.CHAMADO_OS
    ${osDateFilter ? 'AND ' + osDateFilter.slice(0, -4) : ''}
LEFT JOIN TAREFA ON OS.CODTRF_OS = TAREFA.COD_TAREFA AND TAREFA.EXIBECHAM_TAREFA = 1
${whereClause}
GROUP BY ${camposChamado}
ORDER BY CHAMADO.DATA_CHAMADO DESC, CHAMADO.HORA_CHAMADO DESC
ROWS ${offset + 1} TO ${offset + params.limit}`;

        const sqlParamsChamados = [...osDateParams, ...whereParams];

        // Query de totais
        let sqlTotais = `SELECT
    COUNT(DISTINCT OS.COD_OS) AS TOTAL_OS,
    SUM((CAST(SUBSTRING(OS.HRFIM_OS FROM 1 FOR 2) AS INTEGER) * 60 +
         CAST(SUBSTRING(OS.HRFIM_OS FROM 3 FOR 2) AS INTEGER) -
         CAST(SUBSTRING(OS.HRINI_OS FROM 1 FOR 2) AS INTEGER) * 60 -
         CAST(SUBSTRING(OS.HRINI_OS FROM 3 FOR 2) AS INTEGER)) / 60.0) AS TOTAL_HORAS
FROM OS
INNER JOIN TAREFA ON OS.CODTRF_OS = TAREFA.COD_TAREFA`;

        if (params.statusFilter || params.columnFilters?.STATUS_CHAMADO) {
            sqlTotais += ` LEFT JOIN CHAMADO ON OS.CHAMADO_OS = CAST(CHAMADO.COD_CHAMADO AS VARCHAR(20))`;
        }

        if (needsClient) {
            sqlTotais += `
INNER JOIN PROJETO ON TAREFA.CODPRO_TAREFA = PROJETO.COD_PROJETO
INNER JOIN CLIENTE ON PROJETO.CODCLI_PROJETO = CLIENTE.COD_CLIENTE`;
        }

        if (params.codRecursoFilter || params.codRecurso || params.columnFilters?.NOME_RECURSO) {
            sqlTotais += ` LEFT JOIN RECURSO ON OS.CODREC_OS = RECURSO.COD_RECURSO`;
        }

        const whereTotais: string[] = [
            'TAREFA.EXIBECHAM_TAREFA = 1',
            'OS.CHAMADO_OS IS NOT NULL',
            "TRIM(OS.CHAMADO_OS) <> ''",
        ];

        const sqlParamsTotais: any[] = [];

        if (dataInicio && dataFim) {
            whereTotais.push('OS.DTINI_OS >= ?', 'OS.DTINI_OS < ?');
            sqlParamsTotais.push(dataInicio, dataFim);
        }

        if (!params.isAdmin && params.codRecurso) {
            whereTotais.push('RECURSO.COD_RECURSO = ?');
            sqlParamsTotais.push(parseInt(params.codRecurso));
        }

        if (params.codClienteFilter) {
            whereTotais.push('CLIENTE.COD_CLIENTE = ?');
            sqlParamsTotais.push(parseInt(params.codClienteFilter));
        }

        if (params.codRecursoFilter) {
            whereTotais.push('RECURSO.COD_RECURSO = ?');
            sqlParamsTotais.push(parseInt(params.codRecursoFilter));
        }

        if (params.statusFilter) {
            whereTotais.push('UPPER(CHAMADO.STATUS_CHAMADO) LIKE UPPER(?)');
            sqlParamsTotais.push(`%${params.statusFilter}%`);
        }

        if (params.columnFilters?.STATUS_CHAMADO && !params.statusFilter) {
            whereTotais.push('CHAMADO.STATUS_CHAMADO = ?');
            sqlParamsTotais.push(params.columnFilters.STATUS_CHAMADO);
        }

        if (params.columnFilters?.COD_CHAMADO) {
            const codChamado = params.columnFilters.COD_CHAMADO.replace(/\D/g, '');
            if (codChamado) {
                whereTotais.push('OS.CHAMADO_OS LIKE ?');
                sqlParamsTotais.push(`%${codChamado}%`);
            }
        }

        sqlTotais += ` WHERE ${whereTotais.join(' AND ')}`;

        const [countResult, chamados, totaisResult] = await Promise.all([
            firebirdQuery<{ TOTAL: number }>(sqlCount, whereParams),
            firebirdQuery<ChamadoRaw>(sqlChamados, sqlParamsChamados),
            firebirdQuery<{ TOTAL_OS: number; TOTAL_HORAS: number | null }>(
                sqlTotais,
                sqlParamsTotais
            ),
        ]);

        return {
            chamados,
            totalChamados: countResult[0]?.TOTAL || 0,
            totalOS: totaisResult[0]?.TOTAL_OS || 0,
            totalHoras: totaisResult[0]?.TOTAL_HORAS || 0,
        };
    } catch (error) {
        console.error('[API CHAMADOS] Erro buscarChamadosComTotais:', error);
        throw error;
    }
};

// ==================== BUSCAR NOMES (COM CACHE) ====================
const buscarNomes = async (
    codCliente?: string,
    codRecurso?: string
): Promise<{ cliente: string | null; recurso: string | null }> => {
    const promises: Promise<string | null>[] = [];

    if (codCliente) {
        const cached = getCached(nomeClienteCache, codCliente);
        if (cached !== undefined) {
            promises.push(Promise.resolve(cached));
        } else {
            promises.push(
                firebirdQuery<{ NOME_CLIENTE: string }>(
                    'SELECT NOME_CLIENTE FROM CLIENTE WHERE COD_CLIENTE = ?',
                    [parseInt(codCliente)]
                )
                    .then((r) => {
                        const nome = r[0]?.NOME_CLIENTE || null;
                        setCache(nomeClienteCache, codCliente, nome);
                        return nome;
                    })
                    .catch(() => null)
            );
        }
    } else {
        promises.push(Promise.resolve(null));
    }

    if (codRecurso) {
        const cached = getCached(nomeRecursoCache, codRecurso);
        if (cached !== undefined) {
            promises.push(Promise.resolve(cached));
        } else {
            promises.push(
                firebirdQuery<{ NOME_RECURSO: string }>(
                    'SELECT NOME_RECURSO FROM RECURSO WHERE COD_RECURSO = ?',
                    [parseInt(codRecurso)]
                )
                    .then((r) => {
                        const nome = r[0]?.NOME_RECURSO || null;
                        setCache(nomeRecursoCache, codRecurso, nome);
                        return nome;
                    })
                    .catch(() => null)
            );
        }
    } else {
        promises.push(Promise.resolve(null));
    }

    const [cliente, recurso] = await Promise.all(promises);
    return { cliente, recurso };
};

// ==================== PROCESSAMENTO ====================
const processarChamados = (chamados: ChamadoRaw[]): Chamado[] => {
    return chamados.map((c) => ({
        COD_CHAMADO: c.COD_CHAMADO,
        DATA_CHAMADO: c.DATA_CHAMADO,
        HORA_CHAMADO: c.HORA_CHAMADO ?? '',
        SOLICITACAO_CHAMADO: c.SOLICITACAO_CHAMADO || null,
        CONCLUSAO_CHAMADO: c.CONCLUSAO_CHAMADO || null,
        STATUS_CHAMADO: c.STATUS_CHAMADO,
        DTENVIO_CHAMADO: c.DTENVIO_CHAMADO || null,
        ASSUNTO_CHAMADO: c.ASSUNTO_CHAMADO || null,
        EMAIL_CHAMADO: c.EMAIL_CHAMADO || null,
        PRIOR_CHAMADO: c.PRIOR_CHAMADO ?? 100,
        COD_CLASSIFICACAO: c.COD_CLASSIFICACAO ?? 0,
        NOME_CLIENTE: c.NOME_CLIENTE || null,
        NOME_RECURSO: c.NOME_RECURSO || null,
        NOME_CLASSIFICACAO: c.NOME_CLASSIFICACAO || null,
        TEM_OS: (c.TOTAL_HORAS_OS ?? 0) > 0,
        TOTAL_HORAS_OS: c.TOTAL_HORAS_OS ?? 0,
        AVALIA_CHAMADO: c.AVALIA_CHAMADO ?? 1,
        OBSAVAL_CHAMADO: c.OBSAVAL_CHAMADO ?? null,
    }));
};

// ==================== HANDLER PRINCIPAL ====================
export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);

        const params = validarParametros(searchParams);
        if (params instanceof NextResponse) return params;

        let dataInicio: string | null = null;
        let dataFim: string | null = null;

        if (params.mes && params.ano) {
            const datas = construirDatas(params.mes, params.ano);
            dataInicio = datas.dataInicio;
            dataFim = datas.dataFim;
        }

        const codClienteAplicado = params.codClienteFilter;

        // Execução paralela: buscar chamados+totais e nomes
        const [resultado, nomes] = await Promise.all([
            buscarChamadosComTotais(dataInicio, dataFim, params),
            buscarNomes(codClienteAplicado, params.codRecursoFilter || params.codRecurso),
        ]);

        const { chamados, totalChamados, totalOS, totalHoras } = resultado;

        if (chamados.length === 0) {
            return NextResponse.json(
                {
                    success: true,
                    cliente: nomes.cliente,
                    recurso: nomes.recurso,
                    status: null,
                    totalChamados: 0,
                    totalOS,
                    totalHorasOS: totalHoras,
                    mes: params.mes ?? null,
                    ano: params.ano ?? null,
                    pagination: {
                        page: params.page,
                        limit: params.limit,
                        totalPages: 0,
                        hasNextPage: false,
                        hasPreviousPage: false,
                    },
                    data: [],
                },
                { status: 200 }
            );
        }

        const chamadosProcessados = processarChamados(chamados);

        const statusFiltro = params.statusFilter ? chamados[0]?.STATUS_CHAMADO || null : null;

        const totalPages = Math.ceil(totalChamados / params.limit);

        return NextResponse.json(
            {
                success: true,
                cliente: nomes.cliente,
                recurso: nomes.recurso,
                status: statusFiltro,
                totalChamados,
                totalOS,
                totalHorasOS: totalHoras,
                mes: params.mes ?? null,
                ano: params.ano ?? null,
                pagination: {
                    page: params.page,
                    limit: params.limit,
                    totalPages,
                    hasNextPage: params.page < totalPages,
                    hasPreviousPage: params.page > 1,
                },
                data: chamadosProcessados,
            },
            { status: 200 }
        );
    } catch (error) {
        console.error('[API CHAMADOS] Erro:', error instanceof Error ? error.message : error);

        return NextResponse.json(
            {
                success: false,
                error: 'Erro interno do servidor',
                message: error instanceof Error ? error.message : 'Erro desconhecido',
                details: process.env.NODE_ENV === 'development' ? error : undefined,
            },
            { status: 500 }
        );
    }
}

export function limparCacheChamados(): void {
    nomeClienteCache.clear();
    nomeRecursoCache.clear();
}
