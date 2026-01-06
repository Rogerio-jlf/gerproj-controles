// src/app/api/filtros/status/route.ts - CORRIGIDO
import { firebirdQuery } from '@/lib/firebird/firebird-client';
import { NextResponse } from 'next/server';

// ==================== TIPOS ====================
interface QueryParams {
    isAdmin: boolean;
    codCliente?: string;
    codRecurso?: string; // ✅ NOVO: Para consultores
    cliente?: string;
    mes: number;
    ano: number;
}

interface Status {
    cod: string;
    nome: string;
}

// ==================== VALIDAÇÕES ====================
function validarParametros(searchParams: URLSearchParams): QueryParams | NextResponse {
    const isAdmin = searchParams.get('isAdmin') === 'true';
    const codCliente = searchParams.get('codCliente')?.trim();
    const codRecurso = searchParams.get('codRecurso')?.trim(); // ✅ NOVO
    const cliente = searchParams.get('cliente')?.trim();
    const mes = Number(searchParams.get('mes'));
    const ano = Number(searchParams.get('ano'));

    if (!mes || mes < 1 || mes > 12) {
        return NextResponse.json(
            { error: "Parâmetro 'mes' deve ser um número entre 1 e 12" },
            { status: 400 }
        );
    }

    if (!ano || ano < 2000 || ano > 3000) {
        return NextResponse.json(
            { error: "Parâmetro 'ano' deve ser um número válido" },
            { status: 400 }
        );
    }

    // ✅ CORRIGIDO: Aceita codCliente OU codRecurso para não-admin
    if (!isAdmin && !codCliente && !codRecurso) {
        return NextResponse.json(
            {
                error: "Parâmetro 'codCliente' ou 'codRecurso' é obrigatório para usuários não admin",
            },
            { status: 400 }
        );
    }

    return { isAdmin, codCliente, codRecurso, cliente, mes, ano };
}

// ==================== CONSTRUÇÃO DE DATAS ====================
function construirDatas(mes: number, ano: number): { dataInicio: string; dataFim: string } {
    const mesFormatado = mes.toString().padStart(2, '0');
    const dataInicio = `01.${mesFormatado}.${ano}`;

    const dataFim =
        mes === 12 ? `01.01.${ano + 1}` : `01.${(mes + 1).toString().padStart(2, '0')}.${ano}`;

    return { dataInicio, dataFim };
}

// ==================== CONSTRUÇÃO DE SQL ====================
const SQL_STATUS_BASE = `
  SELECT DISTINCT
    CHAMADO.STATUS_CHAMADO
  FROM CHAMADO
  INNER JOIN CLIENTE ON CHAMADO.COD_CLIENTE = CLIENTE.COD_CLIENTE
  WHERE CHAMADO.DATA_CHAMADO >= ?
    AND CHAMADO.DATA_CHAMADO < ?
    AND CHAMADO.STATUS_CHAMADO IS NOT NULL
    AND TRIM(CHAMADO.STATUS_CHAMADO) <> ''
`;

function aplicarFiltros(
    sqlBase: string,
    params: QueryParams,
    paramsArray: any[]
): { sql: string; params: any[] } {
    let sql = sqlBase;

    // ✅ CORRIGIDO: Filtro por codRecurso OU codCliente
    if (!params.isAdmin) {
        if (params.codRecurso) {
            // Consultor não-admin: filtra por recurso
            sql += ` AND CHAMADO.COD_RECURSO = ?`;
            paramsArray.push(parseInt(params.codRecurso));
        } else if (params.codCliente) {
            // Cliente não-admin: filtra por cliente
            sql += ` AND CLIENTE.COD_CLIENTE = ?`;
            paramsArray.push(parseInt(params.codCliente));
        }
    }

    // Filtro opcional por código de cliente (para admin)
    if (params.isAdmin && params.cliente) {
        sql += ` AND CLIENTE.COD_CLIENTE = ?`;
        paramsArray.push(parseInt(params.cliente));
    }

    // Ordenação alfabética
    sql += ` ORDER BY CHAMADO.STATUS_CHAMADO`;

    return { sql, params: paramsArray };
}

// ==================== PROCESSAMENTO ====================
function processarStatus(resultados: any[]): string[] {
    return resultados
        .map((item) => item.STATUS_CHAMADO.trim())
        .filter((status) => status && status !== '')
        .sort((a, b) => a.localeCompare(b, 'pt-BR', { sensitivity: 'base' }));
}

// ==================== HANDLER PRINCIPAL ====================
export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);

        // Validar parâmetros
        const params = validarParametros(searchParams);
        if (params instanceof NextResponse) return params;

        // Construir datas no formato Firebird DATE (DD.MM.YYYY)
        const { dataInicio, dataFim } = construirDatas(params.mes, params.ano);

        // Construir query com filtros
        const { sql: sqlFinal, params: sqlParams } = aplicarFiltros(SQL_STATUS_BASE, params, [
            dataInicio,
            dataFim,
        ]);

        // Executar query
        const status = await firebirdQuery(sqlFinal, sqlParams);

        // Processar e ordenar status
        const statusProcessados = processarStatus(status);

        return NextResponse.json(statusProcessados);
    } catch (error) {
        console.error('Erro detalhado ao buscar status:', error);
        console.error('Stack trace:', error instanceof Error ? error.stack : 'N/A');
        console.error('Message:', error instanceof Error ? error.message : error);

        return NextResponse.json(
            {
                error: 'Erro ao buscar status',
                message: error instanceof Error ? error.message : 'Erro desconhecido',
                timestamp: new Date().toISOString(),
                details: process.env.NODE_ENV === 'development' ? error : undefined,
            },
            { status: 500 }
        );
    }
}
