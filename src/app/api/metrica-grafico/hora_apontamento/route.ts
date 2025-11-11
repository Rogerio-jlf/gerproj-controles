import { solutiiPrisma } from '@/lib/solutii-prisma';
import { NextResponse } from 'next/server';

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
      dthrfim_apont: {
        not: null,
      },
    };

    if (!isAdmin) {
      filtros.cod_cliente = codCliente;
    } else if (clienteQuery) {
      filtros.nome_cliente = {
        contains: clienteQuery,
        mode: 'insensitive',
      };
    }

    if (recursoQuery) {
      filtros.nome_recurso = {
        contains: recursoQuery,
        mode: 'insensitive',
      };
    }

    if (statusQuery) {
      filtros.status_chamado = statusQuery;
    }

    const apontamentos = await solutiiPrisma.apontamentos.findMany({
      where: filtros,
      select: {
        dthrini_apont: true,
        dthrfim_apont: true,
        nome_cliente: true,
        nome_recurso: true,
        status_chamado: true,
      },
    });

    // Calcular total de horas do mês
    let totalHorasMes = 0;

    apontamentos.forEach((apontamento) => {
      if (apontamento.dthrini_apont && apontamento.dthrfim_apont) {
        const inicio = new Date(apontamento.dthrini_apont);
        const fim = new Date(apontamento.dthrfim_apont);

        const diferencaMs = fim.getTime() - inicio.getTime();
        const horas = diferencaMs / (1000 * 60 * 60);

        if (horas > 0) {
          totalHorasMes += horas;
        }
      }
    });

    // Dados otimizados para gráfico
    const dadosGrafico = {
      mes: mesParam,
      ano: anoParam,
      periodo: `${String(mesParam).padStart(2, '0')}/${anoParam}`,
      total_horas: Number(totalHorasMes.toFixed(2)),
      total_apontamentos: apontamentos.length,
      // Labels amigáveis para o gráfico
      label_mes: new Date(anoParam, mesParam - 1).toLocaleString('pt-BR', {
        month: 'long',
        year: 'numeric',
      }),
    };

    // Se for admin, incluir breakdown por cliente
    const breakdownPorCliente = isAdmin
      ? (() => {
          const clienteHoras: Record<string, number> = {};

          apontamentos.forEach((apontamento) => {
            const cliente = apontamento.nome_cliente || 'Sem cliente';

            if (apontamento.dthrini_apont && apontamento.dthrfim_apont) {
              const inicio = new Date(apontamento.dthrini_apont);
              const fim = new Date(apontamento.dthrfim_apont);
              const diferencaMs = fim.getTime() - inicio.getTime();
              const horas = diferencaMs / (1000 * 60 * 60);

              if (horas > 0) {
                clienteHoras[cliente] = (clienteHoras[cliente] || 0) + horas;
              }
            }
          });

          return Object.entries(clienteHoras)
            .map(([cliente, horas]) => ({
              cliente,
              horas: Number(horas.toFixed(2)),
            }))
            .sort((a, b) => b.horas - a.horas);
        })()
      : null;

    // Breakdown por recurso
    const breakdownPorRecurso = (() => {
      const recursoHoras: Record<string, number> = {};

      apontamentos.forEach((apontamento) => {
        const recurso = apontamento.nome_recurso || 'Sem recurso';

        if (apontamento.dthrini_apont && apontamento.dthrfim_apont) {
          const inicio = new Date(apontamento.dthrini_apont);
          const fim = new Date(apontamento.dthrfim_apont);
          const diferencaMs = fim.getTime() - inicio.getTime();
          const horas = diferencaMs / (1000 * 60 * 60);

          if (horas > 0) {
            recursoHoras[recurso] = (recursoHoras[recurso] || 0) + horas;
          }
        }
      });

      return Object.entries(recursoHoras)
        .map(([recurso, horas]) => ({
          recurso,
          horas: Number(horas.toFixed(2)),
        }))
        .sort((a, b) => b.horas - a.horas);
    })();

    const response = {
      dados_grafico: dadosGrafico,
      ...(isAdmin &&
        breakdownPorCliente && {
          breakdown_por_cliente: breakdownPorCliente,
        }),
      breakdown_por_recurso: breakdownPorRecurso,
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('Erro ao calcular horas do mês:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 },
    );
  }
}
