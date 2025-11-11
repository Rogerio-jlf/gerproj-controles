import { solutiiPrisma } from '@/lib/solutii-prisma';
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);

    const mesParam = searchParams.get('mes');
    const anoParam = searchParams.get('ano');
    const isAdmin = searchParams.get('isAdmin') === 'true';
    const codCliente = searchParams.get('codCliente');

    const mes = Number(mesParam);
    const ano = Number(anoParam);

    if (!mesParam || isNaN(mes) || mes < 1 || mes > 12) {
      return NextResponse.json(
        { error: "Parâmetro 'mes' deve ser um número entre 1 e 12" },
        { status: 400 },
      );
    }

    if (!anoParam || isNaN(ano) || ano < 2000 || ano > 3000) {
      return NextResponse.json(
        { error: "Parâmetro 'ano' deve ser um número válido" },
        { status: 400 },
      );
    }

    if (!isAdmin && (!codCliente || codCliente.trim() === '')) {
      return NextResponse.json(
        {
          error: "Parâmetro 'codCliente' é obrigatório para usuários não admin",
        },
        { status: 400 },
      );
    }

    const dataInicio = new Date(ano, mes - 1, 1, 0, 0, 0, 0);
    const dataFim = new Date(ano, mes, 1, 0, 0, 0, 0);

    const filtro: Record<string, unknown> = {
      dthrini_apont: {
        gte: dataInicio,
        lt: dataFim,
      },
    };

    // Se não for admin, filtra pelo código do cliente
    if (!isAdmin) {
      filtro.cod_cliente = codCliente;
    }

    const clientes = await solutiiPrisma.apontamentos.findMany({
      where: filtro,
      distinct: ['nome_cliente'],
      select: {
        nome_cliente: true,
      },
    });

    const nomesClientes = clientes
      .map((item) => item.nome_cliente)
      .filter((nome): nome is string => nome != null && nome.trim() !== '')
      .sort((a, b) => a.localeCompare(b, 'pt-BR', { sensitivity: 'base' }));

    return NextResponse.json(nomesClientes);
  } catch (error) {
    console.error('Erro detalhado ao buscar clientes:', error);

    // Retorna erro mais específico
    if (error instanceof Error) {
      return NextResponse.json(
        {
          error: 'Erro ao buscar clientes',
          message: error.message,
          timestamp: new Date().toISOString(),
        },
        { status: 500 },
      );
    }

    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 },
    );
  }
}
