import { firebirdQuery } from '@/lib/firebird/firebird-client';
import { solutiiPrisma } from '@/lib/solutii-prisma';
import { NextResponse } from 'next/server';

// Função para formatar duração em milissegundos para "hh:mm"
function formatDuration(ms: number) {
  const totalMinutes = Math.floor(ms / (1000 * 60));
  const horas = Math.floor(totalMinutes / 60);
  const minutos = totalMinutes % 60;
  return `${String(horas).padStart(2, '0')}h:${String(minutos).padStart(2, '0')}min`;
}

// Função para normalizar o código da OS
function normalizeCodOS(cod: any): string | null {
  if (cod === null || cod === undefined || cod === '') return null;
  // Remove espaços, converte para string e garante uppercase
  return String(cod).trim().toUpperCase();
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);

    const isAdmin = searchParams.get('isAdmin') === 'true';
    const codCliente = searchParams.get('codCliente')?.trim();
    const mesParam = Number(searchParams.get('mes'));
    const anoParam = Number(searchParams.get('ano'));
    const clienteQuery = searchParams.get('cliente')?.trim();
    const recursoQuery = searchParams.get('recurso');
    const statusQuery = searchParams.get('status');

    // Validações
    if (!mesParam || mesParam < 1 || mesParam > 12) {
      return NextResponse.json(
        { error: "Parâmetro 'mes' deve ser um número entre 1 e 12" },
        { status: 400 },
      );
    }

    if (!anoParam || anoParam < 2000 || anoParam > 3000) {
      return NextResponse.json(
        { error: "Parâmetro 'ano' deve ser um número válido" },
        { status: 400 },
      );
    }

    if (!isAdmin && !codCliente) {
      return NextResponse.json(
        {
          error: "Parâmetro 'codCliente' é obrigatório para usuários não admin",
        },
        { status: 400 },
      );
    }

    const dataInicio = new Date(anoParam, mesParam - 1, 1, 0, 0, 0, 0);
    const dataFim = new Date(anoParam, mesParam, 1, 0, 0, 0, 0);

    const filtros: Record<string, unknown> = {
      dthrini_apont: {
        gte: dataInicio,
        lt: dataFim,
      },
    };

    if (!isAdmin) {
      filtros.cod_cliente = codCliente;
    } else if (clienteQuery) {
      filtros.nome_cliente = clienteQuery;
    }

    if (recursoQuery) {
      filtros.nome_recurso = recursoQuery;
    }

    if (statusQuery) {
      filtros.status_chamado = statusQuery;
    }

    console.log('[API] Buscando apontamentos com filtros:', filtros);

    // 1. Busca os apontamentos no PostgreSQL
    const apontamentos = await solutiiPrisma.apontamentos.findMany({
      where: filtros,
      orderBy: [{ nome_recurso: 'asc' }, { dthrini_apont: 'asc' }],
      select: {
        chamado_os: true,
        cod_os: true,
        dtini_os: true,
        nome_cliente: true,
        status_chamado: true,
        nome_recurso: true,
        hrini_os: true,
        hrfim_os: true,
        dthrini_apont: true,
        dthrfim_apont: true,
        obs: true,
      },
    });

    console.log(`[API] Encontrados ${apontamentos.length} apontamentos`);

    // 2. Busca VALCLI_OS do Firebird para todos os cod_os
    let validacoesMap = new Map<string, string | null>();

    if (apontamentos.length > 0) {
      try {
        // Extrai cod_os únicos e normalizados
        const codsOSSet = new Set<string>();

        apontamentos.forEach((a) => {
          const normalized = normalizeCodOS(a.cod_os);
          if (normalized) {
            codsOSSet.add(normalized);
          }
        });

        const codsOS = Array.from(codsOSSet);

        console.log(
          `[Firebird] Buscando validações para ${codsOS.length} códigos únicos`,
        );
        console.log('[Firebird] Códigos:', codsOS.slice(0, 5), '...'); // Log dos primeiros 5

        if (codsOS.length > 0) {
          const placeholders = codsOS.map(() => '?').join(',');

          const validacoes = await firebirdQuery(
            `SELECT COD_OS, VALCLI_OS FROM OS WHERE COD_OS IN (${placeholders})`,
            codsOS,
          );

          console.log(`[Firebird] Retornadas ${validacoes.length} validações`);

          // Log das primeiras validações para debug
          if (validacoes.length > 0) {
            console.log('[Firebird] Exemplo de validação:', {
              COD_OS: validacoes[0].COD_OS,
              VALCLI_OS: validacoes[0].VALCLI_OS,
              tipo_COD_OS: typeof validacoes[0].COD_OS,
              tipo_VALCLI_OS: typeof validacoes[0].VALCLI_OS,
            });
          }

          // Cria mapa com chaves normalizadas
          // Se VALCLI_OS for null, considera como 'SIM' (padrão para registros antigos)
          validacoes.forEach((v: any) => {
            const codNormalizado = normalizeCodOS(v.COD_OS);
            if (codNormalizado) {
              // REGRA DE NEGÓCIO: Coluna VALCLI_OS foi criada recentemente com valor padrão 'SIM'.
              // Registros anteriores à criação da coluna estão como NULL no banco.
              // Por padrão, consideramos NULL como 'SIM' (aprovado) para manter consistência.
              const valcli = v.VALCLI_OS
                ? String(v.VALCLI_OS).trim().toUpperCase()
                : 'SIM'; // 👈 Valor padrão para registros antigos
              validacoesMap.set(codNormalizado, valcli);
            }
          });

          console.log(
            `[Firebird] Map criado com ${validacoesMap.size} entradas`,
          );

          // Log de algumas entradas do map para debug
          const mapEntries = Array.from(validacoesMap.entries()).slice(0, 3);
          console.log('[Firebird] Exemplos do map:', mapEntries);
        }
      } catch (firebirdError) {
        console.error('[Firebird] Erro ao buscar validações:', firebirdError);
        console.error(
          '[Firebird] Stack:',
          firebirdError instanceof Error ? firebirdError.stack : 'N/A',
        );
        // Continua sem as validações em caso de erro
      }
    }

    // 3. Mapeia os dados adicionando total_horas e valcli_os
    let totalMsGeral = 0;

    const apontamentosComTotalHoras = apontamentos.map((apontamento) => {
      const inicio = apontamento.dthrini_apont
        ? new Date(apontamento.dthrini_apont)
        : null;
      const fim = apontamento.dthrfim_apont
        ? new Date(apontamento.dthrfim_apont)
        : null;

      let totalHoras = '-';

      if (inicio && fim && fim > inicio) {
        const diffMs = fim.getTime() - inicio.getTime();
        totalMsGeral += diffMs;
        totalHoras = formatDuration(diffMs);
      }

      // Busca a validação do Firebird com chave normalizada
      const codOsNormalizado = normalizeCodOS(apontamento.cod_os);
      const valcliOs = codOsNormalizado
        ? validacoesMap.get(codOsNormalizado) || null
        : null;

      // Log para debug (apenas os primeiros 3)
      if (apontamentos.indexOf(apontamento) < 3) {
        console.log(`[Mapping] Apontamento ${apontamento.chamado_os}:`, {
          cod_os_original: apontamento.cod_os,
          cod_os_normalizado: codOsNormalizado,
          valcli_os: valcliOs,
          existe_no_map: codOsNormalizado
            ? validacoesMap.has(codOsNormalizado)
            : false,
        });
      }

      return {
        chamado_os: apontamento.chamado_os,
        cod_os: apontamento.cod_os,
        dtini_os: apontamento.dtini_os,
        nome_cliente: apontamento.nome_cliente,
        status_chamado: apontamento.status_chamado,
        nome_recurso: apontamento.nome_recurso,
        hrini_os: apontamento.hrini_os,
        hrfim_os: apontamento.hrfim_os,
        total_horas: totalHoras,
        obs: apontamento.obs,
        valcli_os: valcliOs,
      };
    });

    const totalHorasGeral = formatDuration(totalMsGeral);

    console.log('[API] Retornando resposta com sucesso');

    return NextResponse.json({
      totalHorasGeral,
      apontamentos: apontamentosComTotalHoras,
    });
  } catch (error) {
    console.error('[API] Erro geral:', error);
    console.error('[API] Stack:', error instanceof Error ? error.stack : 'N/A');
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 },
    );
  }
}
