// app/api/chamados/mudar-status/route.ts
import { firebirdQuery } from '@/lib/firebird/firebird-client';
import { NextRequest, NextResponse } from 'next/server';

// ==================== TIPOS ====================
interface MudarStatusRequest {
    codChamado: number;
    novoStatus: string;
    descricao: string;
    hrInicio: string;
    hrFim: string;
    data: string;
}

// ==================== VALIDAÇÕES ====================
const validarRequest = (body: any): { valid: boolean; error?: string } => {
    if (!body.codChamado || typeof body.codChamado !== 'number') {
        return { valid: false, error: 'Código do chamado é obrigatório' };
    }

    if (!body.novoStatus || typeof body.novoStatus !== 'string') {
        return { valid: false, error: 'Novo status é obrigatório' };
    }

    const statusValidos = ['STANDBY', 'EM ATENDIMENTO', 'AGUARDANDO VALIDACAO', 'FINALIZADO'];
    if (!statusValidos.includes(body.novoStatus.toUpperCase())) {
        return { valid: false, error: 'Status inválido' };
    }

    // Se não for "EM ATENDIMENTO", validar campos obrigatórios
    if (body.novoStatus.toUpperCase() !== 'EM ATENDIMENTO') {
        if (!body.descricao || typeof body.descricao !== 'string' || !body.descricao.trim()) {
            return { valid: false, error: 'Descrição é obrigatória' };
        }

        if (!body.hrInicio || !/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/.test(body.hrInicio)) {
            return { valid: false, error: 'Hora de início inválida (formato: HH:MM)' };
        }

        if (!body.hrFim || !/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/.test(body.hrFim)) {
            return { valid: false, error: 'Hora de fim inválida (formato: HH:MM)' };
        }

        if (body.hrInicio >= body.hrFim) {
            return { valid: false, error: 'Hora de fim deve ser maior que hora de início' };
        }

        if (!body.data || !/^\d{4}-\d{2}-\d{2}$/.test(body.data)) {
            return { valid: false, error: 'Data inválida (formato: YYYY-MM-DD)' };
        }
    }

    return { valid: true };
};

// ==================== CONVERSÃO DE DATA ====================
const converterDataParaFirebird = (dataISO: string): string => {
    // Converte de YYYY-MM-DD para DD.MM.YYYY
    const [ano, mes, dia] = dataISO.split('-');
    return `${dia}.${mes}.${ano}`;
};

// ==================== ATUALIZAR STATUS ====================
const atualizarStatusChamado = async (codChamado: number, novoStatus: string): Promise<void> => {
    const sql = `
        UPDATE CHAMADO
        SET STATUS_CHAMADO = ?
        WHERE COD_CHAMADO = ?
    `;

    await firebirdQuery(sql, [novoStatus.toUpperCase(), codChamado]);
};

// ==================== CRIAR OS ====================
const criarOS = async (
    codChamado: number,
    descricao: string,
    hrInicio: string,
    hrFim: string,
    data: string
): Promise<void> => {
    try {
        // 1. Buscar informações do chamado
        const sqlChamado = `
            SELECT
                COD_RECURSO,
                COD_CLIENTE
            FROM CHAMADO
            WHERE COD_CHAMADO = ?
        `;

        const chamadoResult = await firebirdQuery<{
            COD_RECURSO: number;
            COD_CLIENTE: number;
        }>(sqlChamado, [codChamado]);

        if (!chamadoResult || chamadoResult.length === 0) {
            throw new Error('Chamado não encontrado');
        }

        const { COD_RECURSO, COD_CLIENTE } = chamadoResult[0];

        // 2. Buscar tarefa padrão (primeira tarefa com EXIBECHAM_TAREFA = 1)
        const sqlTarefa = `
            SELECT FIRST 1
                TAREFA.COD_TAREFA
            FROM TAREFA
            INNER JOIN PROJETO ON TAREFA.CODPRO_TAREFA = PROJETO.COD_PROJETO
            WHERE PROJETO.CODCLI_PROJETO = ?
                AND TAREFA.EXIBECHAM_TAREFA = 1
            ORDER BY TAREFA.COD_TAREFA
        `;

        const tarefaResult = await firebirdQuery<{ COD_TAREFA: number }>(sqlTarefa, [COD_CLIENTE]);

        if (!tarefaResult || tarefaResult.length === 0) {
            throw new Error('Tarefa não encontrada para este cliente');
        }

        const COD_TAREFA = tarefaResult[0].COD_TAREFA;

        // 3. Gerar próximo código de OS
        const sqlMaxCod = 'SELECT MAX(COD_OS) AS MAX_COD FROM OS';
        const maxCodResult = await firebirdQuery<{ MAX_COD: number | null }>(sqlMaxCod, []);
        const nextCodOS = (maxCodResult[0]?.MAX_COD || 0) + 1;

        // 4. Formatar hora (remover ':')
        const hrInicioFormatada = hrInicio.replace(':', '');
        const hrFimFormatada = hrFim.replace(':', '');

        // 5. Converter data para formato Firebird
        const dataFirebird = converterDataParaFirebird(data);

        // 6. Inserir OS
        const sqlInsertOS = `
            INSERT INTO OS (
                COD_OS,
                CODTRF_OS,
                CODREC_OS,
                DTINI_OS,
                HRINI_OS,
                HRFIM_OS,
                DESCR_OS,
                CHAMADO_OS,
                VALIDAOS_OS
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        `;

        await firebirdQuery(sqlInsertOS, [
            nextCodOS,
            COD_TAREFA,
            COD_RECURSO,
            dataFirebird,
            hrInicioFormatada,
            hrFimFormatada,
            descricao.toUpperCase(),
            String(codChamado),
            0, // VALIDAOS_OS = 0 (não validada)
        ]);

        console.log(`[API] OS criada com sucesso: COD_OS=${nextCodOS}, COD_CHAMADO=${codChamado}`);
    } catch (error) {
        console.error('[API] Erro ao criar OS:', error);
        throw error;
    }
};

// ==================== HANDLER PRINCIPAL ====================
export async function POST(request: NextRequest) {
    try {
        const body: MudarStatusRequest = await request.json();

        // Validar request
        const validacao = validarRequest(body);
        if (!validacao.valid) {
            return NextResponse.json(
                {
                    success: false,
                    message: validacao.error,
                },
                { status: 400 }
            );
        }

        const { codChamado, novoStatus, descricao, hrInicio, hrFim, data } = body;

        // Atualizar status do chamado
        await atualizarStatusChamado(codChamado, novoStatus);

        // Se não for "EM ATENDIMENTO", criar OS
        if (novoStatus.toUpperCase() !== 'EM ATENDIMENTO') {
            await criarOS(codChamado, descricao, hrInicio, hrFim, data);
        }

        return NextResponse.json(
            {
                success: true,
                message: 'Status alterado com sucesso',
            },
            { status: 200 }
        );
    } catch (error) {
        console.error('[API] Erro ao mudar status:', error);

        return NextResponse.json(
            {
                success: false,
                message: error instanceof Error ? error.message : 'Erro ao mudar status',
                details: process.env.NODE_ENV === 'development' ? error : undefined,
            },
            { status: 500 }
        );
    }
}
