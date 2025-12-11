// app/api/chamados/route.ts
import { firebirdQuery } from '@/lib/firebird/firebird-client';
import { NextRequest, NextResponse } from 'next/server';

// ==================== TIPOS ====================
export interface Chamado {
  COD_CHAMADO: number;
  DATA_CHAMADO: Date;
  HORA_CHAMADO: string;
  SOLICITACAO_CHAMADO: string | null;
  CONCLUSAO_CHAMADO: Date | null;
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
  NOME_CLIENTE?: string | null;
  NOME_RECURSO?: string | null;
  NOME_CLASSIFICACAO?: string | null;
  TOTAL_HORAS_OS?: number;
  TEM_OS?: boolean;
}

interface QueryParams {
  isAdmin: boolean;
  codCliente?: string;
  mes: number;
  ano: number;
  codChamadoFilter?: string;
  statusFilter?: string;
  codClienteFilter?: string;
  codRecursoFilter?: string;
}

// ==================== VALIDAÇÕES ====================
function validarParametros(
  searchParams: URLSearchParams,
): QueryParams | NextResponse {
  const isAdmin = searchParams.get('isAdmin') === 'true';
  const codCliente = searchParams.get('codCliente')?.trim() || undefined;
  const mes = Number(searchParams.get('mes'));
  const ano = Number(searchParams.get('ano'));

  if (!mes || mes < 1 || mes > 12) {
    return NextResponse.json(
      { error: "Parâmetro 'mes' deve ser um número entre 1 e 12" },
      { status: 400 },
    );
  }

  if (!ano || ano < 2000 || ano > 3000) {
    return NextResponse.json(
      { error: "Parâmetro 'ano' deve ser um número válido" },
      { status: 400 },
    );
  }

  if (!isAdmin && !codCliente) {
    return NextResponse.json(
      { error: "Parâmetro 'codCliente' é obrigatório para usuários não admin" },
      { status: 400 },
    );
  }

  return {
    isAdmin,
    codCliente,
    mes,
    ano,
    codChamadoFilter: searchParams.get('codChamado')?.trim() || undefined,
    statusFilter: searchParams.get('statusFilter')?.trim() || undefined,
    codClienteFilter: searchParams.get('codClienteFilter')?.trim() || undefined,
    codRecursoFilter: searchParams.get('codRecursoFilter')?.trim() || undefined,
  };
}

// ==================== CONSTRUÇÃO DE DATAS ====================
function construirDatas(
  mes: number,
  ano: number,
): { dataInicio: string; dataFim: string } {
  const mesFormatado = mes.toString().padStart(2, '0');
  const dataInicio = `01.${mesFormatado}.${ano}`;

  const dataFim =
    mes === 12
      ? `01.01.${ano + 1}`
      : `01.${(mes + 1).toString().padStart(2, '0')}.${ano}`;

  return { dataInicio, dataFim };
}

// ==================== CONSTRUÇÃO DE SQL ====================
const SQL_BASE = `
  SELECT 
    CHAMADO.COD_CHAMADO,
    CHAMADO.DATA_CHAMADO,
    CHAMADO.HORA_CHAMADO,
    CHAMADO.SOLICITACAO_CHAMADO,
    CHAMADO.CONCLUSAO_CHAMADO,
    CHAMADO.STATUS_CHAMADO,
    CHAMADO.DTENVIO_CHAMADO,
    CHAMADO.COD_RECURSO,
    CHAMADO.CLIENTE_CHAMADO,
    CHAMADO.CODTRF_CHAMADO,
    CHAMADO.COD_CLIENTE,
    CHAMADO.SOLICITACAO2_CHAMADO,
    CHAMADO.ASSUNTO_CHAMADO,
    CHAMADO.EMAIL_CHAMADO,
    CHAMADO.PRIOR_CHAMADO,
    CHAMADO.COD_CLASSIFICACAO,
    CLIENTE.NOME_CLIENTE,
    RECURSO.NOME_RECURSO,
    CLASSIFICACAO.NOME_CLASSIFICACAO,
    (SELECT SUM(
      (CAST(SUBSTRING(OS.HRFIM_OS FROM 1 FOR 2) AS INTEGER) * 60 + 
       CAST(SUBSTRING(OS.HRFIM_OS FROM 3 FOR 2) AS INTEGER) -
       CAST(SUBSTRING(OS.HRINI_OS FROM 1 FOR 2) AS INTEGER) * 60 - 
       CAST(SUBSTRING(OS.HRINI_OS FROM 3 FOR 2) AS INTEGER)) / 60.0
    )
    FROM OS 
    WHERE OS.CHAMADO_OS = CAST(CHAMADO.COD_CHAMADO AS VARCHAR(20))
    ) AS TOTAL_HORAS_OS
  FROM CHAMADO
  LEFT JOIN CLIENTE ON CHAMADO.COD_CLIENTE = CLIENTE.COD_CLIENTE
  LEFT JOIN RECURSO ON CHAMADO.COD_RECURSO = RECURSO.COD_RECURSO
  LEFT JOIN CLASSIFICACAO ON CHAMADO.COD_CLASSIFICACAO = CLASSIFICACAO.COD_CLASSIFICACAO
  WHERE CHAMADO.DATA_CHAMADO >= ? AND CHAMADO.DATA_CHAMADO < ?
`;

function aplicarFiltros(
  sqlBase: string,
  params: QueryParams,
  paramsArray: any[],
): { sql: string; params: any[] } {
  let sql = sqlBase;

  // Filtro obrigatório para não-admin
  if (!params.isAdmin && params.codCliente) {
    sql += ` AND CHAMADO.COD_CLIENTE = ?`;
    paramsArray.push(parseInt(params.codCliente));
  }

  // Filtros opcionais
  if (params.codChamadoFilter) {
    sql += ` AND CHAMADO.COD_CHAMADO = ?`;
    paramsArray.push(parseInt(params.codChamadoFilter));
  }

  if (params.statusFilter) {
    sql += ` AND UPPER(CHAMADO.STATUS_CHAMADO) LIKE UPPER(?)`;
    paramsArray.push(`%${params.statusFilter}%`);
  }

  if (params.codClienteFilter) {
    sql += ` AND CHAMADO.COD_CLIENTE = ?`;
    paramsArray.push(parseInt(params.codClienteFilter));
  }

  if (params.codRecursoFilter) {
    sql += ` AND CHAMADO.COD_RECURSO = ?`;
    paramsArray.push(parseInt(params.codRecursoFilter));
  }

  return { sql, params: paramsArray };
}

// ==================== PROCESSAMENTO DE DADOS ====================
function processarChamados(chamados: any[]): Chamado[] {
  return chamados.map((chamado) => ({
    COD_CHAMADO: chamado.COD_CHAMADO,
    DATA_CHAMADO: chamado.DATA_CHAMADO,
    HORA_CHAMADO: chamado.HORA_CHAMADO,
    SOLICITACAO_CHAMADO:
      (chamado.SOLICITACAO_CHAMADO &&
        String(chamado.SOLICITACAO_CHAMADO).trim()) ||
      null,
    CONCLUSAO_CHAMADO: chamado.CONCLUSAO_CHAMADO || null,
    STATUS_CHAMADO: chamado.STATUS_CHAMADO,
    DTENVIO_CHAMADO: chamado.DTENVIO_CHAMADO || null,
    COD_RECURSO: chamado.COD_RECURSO || null,
    CLIENTE_CHAMADO: chamado.CLIENTE_CHAMADO || null,
    CODTRF_CHAMADO: chamado.CODTRF_CHAMADO || null,
    COD_CLIENTE: chamado.COD_CLIENTE || null,
    SOLICITACAO2_CHAMADO:
      (chamado.SOLICITACAO2_CHAMADO &&
        String(chamado.SOLICITACAO2_CHAMADO).trim()) ||
      null,
    ASSUNTO_CHAMADO: chamado.ASSUNTO_CHAMADO || null,
    EMAIL_CHAMADO: chamado.EMAIL_CHAMADO || null,
    PRIOR_CHAMADO: chamado.PRIOR_CHAMADO || 100,
    COD_CLASSIFICACAO: chamado.COD_CLASSIFICACAO || 0,
    NOME_CLIENTE: chamado.NOME_CLIENTE || null,
    NOME_RECURSO: chamado.NOME_RECURSO || null,
    NOME_CLASSIFICACAO: chamado.NOME_CLASSIFICACAO || null,
    TOTAL_HORAS_OS: chamado.TOTAL_HORAS_OS || 0,
    TEM_OS: (chamado.TOTAL_HORAS_OS || 0) > 0, // ← ADICIONE ESTA LINHA
  }));
}

// ==================== BUSCAR NOME DO CLIENTE ====================
async function buscarNomeCliente(codCliente: string): Promise<string | null> {
  try {
    const sql = `SELECT NOME_CLIENTE FROM CLIENTE WHERE COD_CLIENTE = ?`;
    const resultado = await firebirdQuery<{ NOME_CLIENTE: string }>(sql, [
      parseInt(codCliente),
    ]);

    return resultado.length > 0 ? resultado[0].NOME_CLIENTE : null;
  } catch (error) {
    console.error('[API CHAMADOS] Erro ao buscar nome do cliente:', error);
    return null;
  }
}

// ==================== BUSCAR NOME DO RECURSO ====================
async function buscarNomeRecurso(codRecurso: string): Promise<string | null> {
  try {
    const sql = `SELECT NOME_RECURSO FROM RECURSO WHERE COD_RECURSO = ?`;
    const resultado = await firebirdQuery<{ NOME_RECURSO: string }>(sql, [
      parseInt(codRecurso),
    ]);

    return resultado.length > 0 ? resultado[0].NOME_RECURSO : null;
  } catch (error) {
    console.error('[API CHAMADOS] Erro ao buscar nome do recurso:', error);
    return null;
  }
}

// ==================== BUSCAR STATUS DO CHAMADO ====================
async function buscarStatusChamado(
  statusFilter: string,
  dataInicio: string,
  dataFim: string,
  params: QueryParams,
): Promise<string | null> {
  try {
    // Monta a query base para buscar status
    let sql = `
      SELECT FIRST 1 CHAMADO.STATUS_CHAMADO 
      FROM CHAMADO
      WHERE CHAMADO.DATA_CHAMADO >= ? 
        AND CHAMADO.DATA_CHAMADO < ?
        AND UPPER(CHAMADO.STATUS_CHAMADO) LIKE UPPER(?)
    `;

    const sqlParams: any[] = [dataInicio, dataFim, `%${statusFilter}%`];

    // Aplica filtro de cliente se não for admin
    if (!params.isAdmin && params.codCliente) {
      sql += ` AND CHAMADO.COD_CLIENTE = ?`;
      sqlParams.push(parseInt(params.codCliente));
    }

    // Aplica outros filtros se existirem
    if (params.codClienteFilter) {
      sql += ` AND CHAMADO.COD_CLIENTE = ?`;
      sqlParams.push(parseInt(params.codClienteFilter));
    }

    if (params.codRecursoFilter) {
      sql += ` AND CHAMADO.COD_RECURSO = ?`;
      sqlParams.push(parseInt(params.codRecursoFilter));
    }

    const resultado = await firebirdQuery<{ STATUS_CHAMADO: string }>(
      sql,
      sqlParams,
    );

    return resultado.length > 0 ? resultado[0].STATUS_CHAMADO : null;
  } catch (error) {
    console.error('[API CHAMADOS] Erro ao buscar status do chamado:', error);
    return null;
  }
}

// ==================== HANDLER PRINCIPAL ====================
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);

    // Validar parâmetros
    const params = validarParametros(searchParams);
    if (params instanceof NextResponse) return params;

    // Construir datas
    const { dataInicio, dataFim } = construirDatas(params.mes, params.ano);

    // Buscar nome do cliente se houver filtro aplicado
    let nomeClienteFiltro: string | null = null;
    const codClienteAplicado =
      params.codClienteFilter ||
      (!params.isAdmin ? params.codCliente : undefined);

    if (codClienteAplicado) {
      nomeClienteFiltro = await buscarNomeCliente(codClienteAplicado);
    }

    // Buscar nome do recurso se houver filtro aplicado
    let nomeRecursoFiltro: string | null = null;

    if (params.codRecursoFilter) {
      nomeRecursoFiltro = await buscarNomeRecurso(params.codRecursoFilter);
    }

    // Buscar status do chamado se houver filtro aplicado
    let statusFiltro: string | null = null;

    if (params.statusFilter) {
      statusFiltro = await buscarStatusChamado(
        params.statusFilter,
        dataInicio,
        dataFim,
        params,
      );
    }

    // Construir e executar query
    const { sql, params: sqlParams } = aplicarFiltros(SQL_BASE, params, [
      dataInicio,
      dataFim,
    ]);

    const sqlFinal = `${sql} ORDER BY CHAMADO.DATA_CHAMADO DESC, CHAMADO.HORA_CHAMADO DESC`;

    const chamados = await firebirdQuery<any>(sqlFinal, sqlParams);

    // Processar dados
    const chamadosProcessados = processarChamados(chamados);

    return NextResponse.json(
      {
        success: true,
        cliente: nomeClienteFiltro,
        recurso: nomeRecursoFiltro,
        status: statusFiltro,
        total: chamadosProcessados.length,
        mes: params.mes,
        ano: params.ano,
        data: chamadosProcessados,
      },
      { status: 200 },
    );
  } catch (error) {
    console.error('[API CHAMADOS] ❌ Erro geral:', error);
    console.error(
      '[API CHAMADOS] Stack:',
      error instanceof Error ? error.stack : 'N/A',
    );
    console.error(
      '[API CHAMADOS] Message:',
      error instanceof Error ? error.message : error,
    );

    return NextResponse.json(
      {
        success: false,
        error: 'Erro interno do servidor',
        message: error instanceof Error ? error.message : 'Erro desconhecido',
        details: process.env.NODE_ENV === 'development' ? error : undefined,
      },
      { status: 500 },
    );
  }
}
