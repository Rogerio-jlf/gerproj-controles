// app/api/chamados/[codChamado]/os/route.ts
import { firebirdQuery } from '@/lib/firebird/firebird-client';
import { NextRequest, NextResponse } from 'next/server';

// ==================== TIPOS ====================
export interface OrdemServico {
  COD_OS: number;
  CODTRF_OS: number;
  DTINI_OS: Date;
  HRINI_OS: string;
  HRFIM_OS: string;
  // OBS_OS: string | null;
  // STATUS_OS: number;
  // PRODUTIVO_OS: string;
  // CODREC_OS: number;
  // PRODUTIVO2_OS: string;
  // RESPCLI_OS: string;
  // REMDES_OS: string;
  // ABONO_OS: string;
  // DESLOC_OS: string | null;
  // DTINC_OS: Date;
  // FATURADO_OS: string;
  // PERC_OS: number;
  // COD_FATURAMENTO: number | null;
  // COMP_OS: string | null;
  // VALID_OS: string;
  // VRHR_OS: number;
  NUM_OS: string | null;
  // CHAMADO_OS: string | null;
  VALCLI_OS: string | null;
  // OBSCLI_OS: string | null;
  // LOGVALCLI_OS: string | null;
  NOME_RECURSO?: string | null;
  NOME_TAREFA?: string | null;
  NOME_CLIENTE?: string | null;
  TOTAL_HORAS_OS: number;
}

interface RouteParams {
  params: {
    codChamado: string;
  };
}

// ==================== CONFIGURAÇÃO DE CAMPOS ====================
/**
 * Configure aqui quais campos você quer buscar do banco.
 * Para ATIVAR um campo: remova o comentário da linha
 * Para DESATIVAR um campo: adicione // no início da linha
 *
 * ⚠️ ATENÇÃO: Campos com * são OBRIGATÓRIOS para o funcionamento básico
 */
const CAMPOS_OS = {
  COD_OS: 'OS.COD_OS',
  CODTRF_OS: 'OS.CODTRF_OS',
  DTINI_OS: 'OS.DTINI_OS',
  HRINI_OS: 'OS.HRINI_OS',
  HRFIM_OS: 'OS.HRFIM_OS',
  // OBS_OS: 'OS.OBS_OS',
  // STATUS_OS: 'OS.STATUS_OS',
  // PRODUTIVO_OS: 'OS.PRODUTIVO_OS',
  // CODREC_OS: 'OS.CODREC_OS',
  // PRODUTIVO2_OS: 'OS.PRODUTIVO2_OS',
  // RESPCLI_OS: 'OS.RESPCLI_OS',
  // REMDES_OS: 'OS.REMDES_OS',
  // ABONO_OS: 'OS.ABONO_OS',
  // DESLOC_OS: 'OS.DESLOC_OS',
  // DTINC_OS: 'OS.DTINC_OS',
  // FATURADO_OS: 'OS.FATURADO_OS',
  // PERC_OS: 'OS.PERC_OS',
  // COD_FATURAMENTO: 'OS.COD_FATURAMENTO',
  // COMP_OS: 'OS.COMP_OS',
  // VRHR_OS: 'OS.VRHR_OS',
  NUM_OS: 'OS.NUM_OS',
  // CHAMADO_OS: 'OS.CHAMADO_OS',
  // VALID_OS: 'OS.VALID_OS',
  VALCLI_OS: 'OS.VALCLI_OS',
  // OBSCLI_OS: 'OS.OBSCLI_OS',
  // LOGVALCLI_OS: 'OS.LOGVALCLI_OS',
  NOME_RECURSO: 'RECURSO.NOME_RECURSO',
  NOME_TAREFA: 'TAREFA.NOME_TAREFA',
  NOME_CLIENTE: 'CLIENTE.NOME_CLIENTE',
};

// ==================== VALIDAÇÕES ====================
function validarCodChamado(codChamado: string): number | NextResponse {
  const cod = parseInt(codChamado);

  if (isNaN(cod) || cod <= 0) {
    return NextResponse.json(
      { error: "Parâmetro 'codChamado' deve ser um número válido" },
      { status: 400 },
    );
  }

  return cod;
}

function validarAutorizacao(
  searchParams: URLSearchParams,
  codChamado: number,
): { isAdmin: boolean; codCliente?: number } | NextResponse {
  const isAdmin = searchParams.get('isAdmin') === 'true';
  const codCliente = searchParams.get('codCliente')?.trim();

  if (!isAdmin && !codCliente) {
    return NextResponse.json(
      { error: "Parâmetro 'codCliente' é obrigatório para usuários não admin" },
      { status: 400 },
    );
  }

  return {
    isAdmin,
    codCliente: codCliente ? parseInt(codCliente) : undefined,
  };
}

// ==================== VERIFICAR PERMISSÃO ====================
async function verificarPermissaoChamado(
  codChamado: number,
  codCliente: number,
): Promise<boolean> {
  try {
    const sql = `
      SELECT COD_CHAMADO 
      FROM CHAMADO 
      WHERE COD_CHAMADO = ? AND COD_CLIENTE = ?
    `;

    const resultado = await firebirdQuery<{ COD_CHAMADO: number }>(sql, [
      codChamado,
      codCliente,
    ]);

    return resultado.length > 0;
  } catch (error) {
    console.error('[API OS] Erro ao verificar permissão do chamado:', error);
    return false;
  }
}

// ==================== CÁLCULO DE HORAS TRABALHADAS ====================
function calcularHorasTrabalhadas(hrIni: string, hrFim: string): number {
  // Formato esperado: "HHMM" (ex: "0830" = 08:30)
  const horaIni =
    parseInt(hrIni.substring(0, 2)) + parseInt(hrIni.substring(2, 4)) / 60;
  const horaFim =
    parseInt(hrFim.substring(0, 2)) + parseInt(hrFim.substring(2, 4)) / 60;

  return horaFim - horaIni;
}

// ==================== CONSTRUÇÃO DE SQL ====================
function construirSQLBase(): string {
  const campos = Object.values(CAMPOS_OS).join(',\n    ');

  return `
  SELECT 
    ${campos}
  FROM OS
  LEFT JOIN RECURSO ON OS.CODREC_OS = RECURSO.COD_RECURSO
  LEFT JOIN TAREFA ON OS.CODTRF_OS = TAREFA.COD_TAREFA
  LEFT JOIN CHAMADO ON OS.CHAMADO_OS = CAST(CHAMADO.COD_CHAMADO AS VARCHAR(20))
  LEFT JOIN CLIENTE ON CHAMADO.COD_CLIENTE = CLIENTE.COD_CLIENTE
  WHERE OS.CHAMADO_OS = ?
  ORDER BY OS.DTINI_OS DESC, OS.HRINI_OS DESC
`;
}

// ==================== PROCESSAMENTO DE DADOS ====================
function processarOrdemServico(os: any[]): OrdemServico[] {
  return os.map((item) => ({
    COD_OS: item.COD_OS,
    CODTRF_OS: item.CODTRF_OS,
    DTINI_OS: item.DTINI_OS,
    HRINI_OS: item.HRINI_OS,
    HRFIM_OS: item.HRFIM_OS,
    // OBS_OS: item.OBS_OS || null,
    // STATUS_OS: item.STATUS_OS,
    // PRODUTIVO_OS: item.PRODUTIVO_OS,
    // CODREC_OS: item.CODREC_OS,
    // PRODUTIVO2_OS: item.PRODUTIVO2_OS,
    // RESPCLI_OS: item.RESPCLI_OS,
    // REMDES_OS: item.REMDES_OS,
    // ABONO_OS: item.ABONO_OS,
    // DESLOC_OS: item.DESLOC_OS || null,
    // DTINC_OS: item.DTINC_OS,
    // FATURADO_OS: item.FATURADO_OS,
    // PERC_OS: item.PERC_OS,
    // COD_FATURAMENTO: item.COD_FATURAMENTO || null,
    // COMP_OS: item.COMP_OS || null,
    // VALID_OS: item.VALID_OS,
    // VRHR_OS: item.VRHR_OS,
    NUM_OS: item.NUM_OS || null,
    // CHAMADO_OS: item.CHAMADO_OS || null,
    VALCLI_OS: item.VALCLI_OS || null,
    // OBSCLI_OS: item.OBSCLI_OS || null,
    // LOGVALCLI_OS: item.LOGVALCLI_OS || null,
    NOME_RECURSO: item.NOME_RECURSO || null,
    NOME_TAREFA: item.NOME_TAREFA || null,
    NOME_CLIENTE: item.NOME_CLIENTE || null,
    TOTAL_HORAS_OS: calcularHorasTrabalhadas(item.HRINI_OS, item.HRFIM_OS),
  }));
}

// ==================== HANDLER PRINCIPAL ====================
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { searchParams } = new URL(request.url);
    const { codChamado } = await params;

    // Validar código do chamado
    const codChamadoValidado = validarCodChamado(codChamado);
    if (codChamadoValidado instanceof NextResponse) return codChamadoValidado;

    // Validar autorização
    const auth = validarAutorizacao(searchParams, codChamadoValidado);
    if (auth instanceof NextResponse) return auth;

    // Se não for admin, verificar se o chamado pertence ao cliente
    if (!auth.isAdmin && auth.codCliente) {
      const temPermissao = await verificarPermissaoChamado(
        codChamadoValidado,
        auth.codCliente,
      );

      if (!temPermissao) {
        return NextResponse.json(
          { error: 'Você não tem permissão para acessar este chamado' },
          { status: 403 },
        );
      }
    }

    // Construir SQL dinamicamente
    const sqlFinal = construirSQLBase();

    // Buscar OS's do chamado
    const os = await firebirdQuery<any>(sqlFinal, [codChamado]);

    // Processar dados
    const osProcessadas = processarOrdemServico(os);

    // Calcular totais
    const totais = {
      quantidade_OS: osProcessadas.length,
      total_horas_chamado: osProcessadas.reduce(
        (acc, item) => acc + item.TOTAL_HORAS_OS,
        0,
      ),
    };

    return NextResponse.json(
      {
        success: true,
        codChamado: codChamadoValidado,
        totais,
        data: osProcessadas,
      },
      { status: 200 },
    );
  } catch (error) {
    console.error('[API OS] ❌ Erro geral:', error);
    console.error(
      '[API OS] Stack:',
      error instanceof Error ? error.stack : 'N/A',
    );
    console.error(
      '[API OS] Message:',
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
