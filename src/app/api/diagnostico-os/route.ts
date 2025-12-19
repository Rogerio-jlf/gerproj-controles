// app/api/chamados/diagnostico-os/route.ts
import { firebirdQuery } from '@/lib/firebird/firebird-client';
import { NextRequest, NextResponse } from 'next/server';

interface DiagnosticoOS {
  COD_OS: number;
  COD_CHAMADO: number;
  DTINI_OS: string;
  NUM_OS: string | null;
  EXIBECHAM_TAREFA: number;
  NOME_TAREFA: string | null;
  HRINI_OS: string;
  HRFIM_OS: string;
  ORIGEM: 'API_PRINCIPAL' | 'API_POR_CHAMADO';
}

interface DiagnosticoResult {
  totalOSApiPrincipal: number;
  totalOSApiPorChamado: number;
  diferenca: number;
  osApenasApiPrincipal: DiagnosticoOS[];
  osApenasApiPorChamado: DiagnosticoOS[];
  osComuns: number;
  detalhesAnalise: {
    osSemFiltroExibecham: number;
    osForaDoPeriodo: number;
    chamadosAnalisados: number;
  };
}

// ==================== BUSCAR OS's DA API PRINCIPAL ====================
async function buscarOSApiPrincipal(
  dataInicio: string,
  dataFim: string,
  codCliente?: string,
): Promise<DiagnosticoOS[]> {
  try {
    let sql = `
      SELECT 
        OS.COD_OS,
        CAST(OS.CHAMADO_OS AS INTEGER) AS COD_CHAMADO,
        OS.DTINI_OS,
        OS.NUM_OS,
        OS.HRINI_OS,
        OS.HRFIM_OS,
        TAREFA.EXIBECHAM_TAREFA,
        TAREFA.NOME_TAREFA
      FROM OS
      LEFT JOIN CHAMADO ON OS.CHAMADO_OS = CAST(CHAMADO.COD_CHAMADO AS VARCHAR(20))
      LEFT JOIN TAREFA ON OS.CODTRF_OS = TAREFA.COD_TAREFA
    `;

    const sqlParams: any[] = [dataInicio, dataFim];

    if (codCliente) {
      sql += `
      LEFT JOIN PROJETO ON TAREFA.CODPRO_TAREFA = PROJETO.COD_PROJETO
      LEFT JOIN CLIENTE ON PROJETO.CODCLI_PROJETO = CLIENTE.COD_CLIENTE
      WHERE OS.DTINI_OS >= ? 
        AND OS.DTINI_OS < ?
        AND TAREFA.EXIBECHAM_TAREFA = 1
        AND CLIENTE.COD_CLIENTE = ?
      `;
      sqlParams.push(parseInt(codCliente));
    } else {
      sql += `
      WHERE OS.DTINI_OS >= ? 
        AND OS.DTINI_OS < ?
        AND TAREFA.EXIBECHAM_TAREFA = 1
      `;
    }

    sql += ` ORDER BY OS.COD_OS`;

    const resultado = await firebirdQuery<any>(sql, sqlParams);

    return resultado.map((os) => ({
      COD_OS: os.COD_OS,
      COD_CHAMADO: os.COD_CHAMADO,
      DTINI_OS: os.DTINI_OS,
      NUM_OS: os.NUM_OS,
      EXIBECHAM_TAREFA: os.EXIBECHAM_TAREFA,
      NOME_TAREFA: os.NOME_TAREFA,
      HRINI_OS: os.HRINI_OS,
      HRFIM_OS: os.HRFIM_OS,
      ORIGEM: 'API_PRINCIPAL',
    }));
  } catch (error) {
    console.error('[DIAGNOSTICO] Erro ao buscar OS da API principal:', error);
    return [];
  }
}

// ==================== BUSCAR OS's POR CHAMADO (SIMULANDO EXCEL) ====================
async function buscarOSPorChamado(
  codChamado: number,
  dataInicio: string,
  dataFim: string,
): Promise<DiagnosticoOS[]> {
  try {
    const sql = `
      SELECT 
        OS.COD_OS,
        CAST(OS.CHAMADO_OS AS INTEGER) AS COD_CHAMADO,
        OS.DTINI_OS,
        OS.NUM_OS,
        OS.HRINI_OS,
        OS.HRFIM_OS,
        TAREFA.EXIBECHAM_TAREFA,
        TAREFA.NOME_TAREFA
      FROM OS
      LEFT JOIN TAREFA ON OS.CODTRF_OS = TAREFA.COD_TAREFA
      WHERE OS.CHAMADO_OS = ?
        AND TAREFA.EXIBECHAM_TAREFA = 1
        AND OS.DTINI_OS >= ?
        AND OS.DTINI_OS < ?
      ORDER BY OS.COD_OS
    `;

    const resultado = await firebirdQuery<any>(sql, [
      codChamado.toString(),
      dataInicio,
      dataFim,
    ]);

    return resultado.map((os) => ({
      COD_OS: os.COD_OS,
      COD_CHAMADO: os.COD_CHAMADO,
      DTINI_OS: os.DTINI_OS,
      NUM_OS: os.NUM_OS,
      EXIBECHAM_TAREFA: os.EXIBECHAM_TAREFA,
      NOME_TAREFA: os.NOME_TAREFA,
      HRINI_OS: os.HRINI_OS,
      HRFIM_OS: os.HRFIM_OS,
      ORIGEM: 'API_POR_CHAMADO',
    }));
  } catch (error) {
    console.error(
      `[DIAGNOSTICO] Erro ao buscar OS do chamado ${codChamado}:`,
      error,
    );
    return [];
  }
}

// ==================== BUSCAR CHAMADOS COM OS NO PERÍODO ====================
async function buscarChamadosComOS(
  dataInicio: string,
  dataFim: string,
  codCliente?: string,
): Promise<number[]> {
  try {
    let sql = `
      SELECT DISTINCT CAST(OS.CHAMADO_OS AS INTEGER) AS COD_CHAMADO
      FROM OS
      LEFT JOIN TAREFA ON OS.CODTRF_OS = TAREFA.COD_TAREFA
    `;

    const sqlParams: any[] = [dataInicio, dataFim];

    if (codCliente) {
      sql += `
      LEFT JOIN CHAMADO ON OS.CHAMADO_OS = CAST(CHAMADO.COD_CHAMADO AS VARCHAR(20))
      LEFT JOIN PROJETO ON TAREFA.CODPRO_TAREFA = PROJETO.COD_PROJETO
      LEFT JOIN CLIENTE ON PROJETO.CODCLI_PROJETO = CLIENTE.COD_CLIENTE
      WHERE OS.DTINI_OS >= ? 
        AND OS.DTINI_OS < ?
        AND OS.CHAMADO_OS IS NOT NULL
        AND OS.CHAMADO_OS <> ''
        AND TAREFA.EXIBECHAM_TAREFA = 1
        AND CLIENTE.COD_CLIENTE = ?
      `;
      sqlParams.push(parseInt(codCliente));
    } else {
      sql += `
      WHERE OS.DTINI_OS >= ? 
        AND OS.DTINI_OS < ?
        AND OS.CHAMADO_OS IS NOT NULL
        AND OS.CHAMADO_OS <> ''
        AND TAREFA.EXIBECHAM_TAREFA = 1
      `;
    }

    const resultado = await firebirdQuery<{ COD_CHAMADO: number }>(
      sql,
      sqlParams,
    );
    return resultado.map((r) => r.COD_CHAMADO);
  } catch (error) {
    console.error('[DIAGNOSTICO] Erro ao buscar chamados com OS:', error);
    return [];
  }
}

// ==================== HANDLER PRINCIPAL ====================
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const mes = Number(searchParams.get('mes'));
    const ano = Number(searchParams.get('ano'));
    const codCliente = searchParams.get('codCliente')?.trim() || undefined;

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

    // Construir datas
    const mesFormatado = mes.toString().padStart(2, '0');
    const dataInicio = `01.${mesFormatado}.${ano}`;
    const dataFim =
      mes === 12
        ? `01.01.${ano + 1}`
        : `01.${(mes + 1).toString().padStart(2, '0')}.${ano}`;

    console.log('[DIAGNOSTICO] Iniciando análise...');
    console.log('[DIAGNOSTICO] Período:', dataInicio, 'até', dataFim);
    console.log('[DIAGNOSTICO] Cliente:', codCliente || 'TODOS');

    // 1. Buscar OS's da API Principal
    const osApiPrincipal = await buscarOSApiPrincipal(
      dataInicio,
      dataFim,
      codCliente,
    );
    console.log(
      '[DIAGNOSTICO] Total OS API Principal:',
      osApiPrincipal.length,
    );

    // 2. Buscar chamados com OS no período
    const chamadosComOS = await buscarChamadosComOS(
      dataInicio,
      dataFim,
      codCliente,
    );
    console.log('[DIAGNOSTICO] Chamados com OS:', chamadosComOS.length);

    // 3. Buscar OS's por chamado (simulando Excel)
    const osApiPorChamado: DiagnosticoOS[] = [];
    for (const codChamado of chamadosComOS) {
      const os = await buscarOSPorChamado(codChamado, dataInicio, dataFim);
      osApiPorChamado.push(...os);
    }
    console.log(
      '[DIAGNOSTICO] Total OS API Por Chamado:',
      osApiPorChamado.length,
    );

    // 4. Comparar OS's
    const codOSApiPrincipal = new Set(osApiPrincipal.map((os) => os.COD_OS));
    const codOSApiPorChamado = new Set(osApiPorChamado.map((os) => os.COD_OS));

    const osApenasApiPrincipal = osApiPrincipal.filter(
      (os) => !codOSApiPorChamado.has(os.COD_OS),
    );
    const osApenasApiPorChamado = osApiPorChamado.filter(
      (os) => !codOSApiPrincipal.has(os.COD_OS),
    );

    const osComuns = osApiPrincipal.filter((os) =>
      codOSApiPorChamado.has(os.COD_OS),
    ).length;

    // 5. Análises adicionais
    const osSemFiltroExibecham = osApenasApiPrincipal.filter(
      (os) => os.EXIBECHAM_TAREFA !== 1,
    ).length;

    const resultado: DiagnosticoResult = {
      totalOSApiPrincipal: osApiPrincipal.length,
      totalOSApiPorChamado: osApiPorChamado.length,
      diferenca: osApiPrincipal.length - osApiPorChamado.length,
      osApenasApiPrincipal,
      osApenasApiPorChamado,
      osComuns,
      detalhesAnalise: {
        osSemFiltroExibecham,
        osForaDoPeriodo: 0, // Calculado abaixo se necessário
        chamadosAnalisados: chamadosComOS.length,
      },
    };

    console.log('[DIAGNOSTICO] ===== RESULTADO =====');
    console.log('[DIAGNOSTICO] OS Comuns:', osComuns);
    console.log('[DIAGNOSTICO] OS Apenas API Principal:', osApenasApiPrincipal.length);
    console.log('[DIAGNOSTICO] OS Apenas API Por Chamado:', osApenasApiPorChamado.length);
    console.log('[DIAGNOSTICO] Diferença:', resultado.diferenca);

    return NextResponse.json(
      {
        success: true,
        periodo: { mes, ano, dataInicio, dataFim },
        cliente: codCliente || 'TODOS',
        resultado,
      },
      { status: 200 },
    );
  } catch (error) {
    console.error('[DIAGNOSTICO] ❌ Erro geral:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Erro interno do servidor',
        message: error instanceof Error ? error.message : 'Erro desconhecido',
      },
      { status: 500 },
    );
  }
}