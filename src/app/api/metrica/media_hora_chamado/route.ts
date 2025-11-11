// Importa o cliente Prisma para acessar o banco de dados
import { solutiiPrisma } from '@/lib/solutii-prisma';
import dayjs from 'dayjs';
import { NextResponse } from 'next/server';

function calcularDuracaoHoras(hrIni: string, hrFim: string): number {
  const inicio = dayjs(`1970-01-01T${hrIni}`);
  let fim = dayjs(`1970-01-01T${hrFim}`);

  if (fim.isBefore(inicio)) {
    fim = dayjs(`1970-01-02T${hrFim}`);
  }

  const diffMin = fim.diff(inicio, 'minute');
  return diffMin > 0 ? diffMin / 60 : 0;
}

export async function GET(request: Request) {
  // Função handler para requisições GET
  try {
    const { searchParams } = new URL(request.url); // Extrai os parâmetros de busca da URL

    const isAdmin = searchParams.get('isAdmin') === 'true'; // Verifica se o usuário é admin
    const codCliente = searchParams.get('codCliente')?.trim(); // Obtém e remove espaços do 'codCliente'

    const mesParam = Number(searchParams.get('mes')); // Obtém e converte o parâmetro 'mes' para número
    const anoParam = Number(searchParams.get('ano')); // Obtém e converte o parâmetro 'ano' para número
    const clienteQuery = searchParams.get('cliente')?.trim(); // Obtém e remove espaços do 'cliente'
    const recursoQuery = searchParams.get('recurso'); // Obtém o parâmetro 'recurso'
    const statusQuery = searchParams.get('status'); // Obtém o parâmetro 'status'

    if (!mesParam || mesParam < 1 || mesParam > 12) {
      // Valida o parâmetro 'mes'
      return NextResponse.json(
        { error: "Parâmetro 'mes' deve ser um número entre 1 e 12" }, // Retorna erro se inválido
        { status: 400 },
      );
    }

    if (!anoParam || anoParam < 2000 || anoParam > 3000) {
      // Valida o parâmetro 'ano'
      return NextResponse.json(
        { error: "Parâmetro 'ano' deve ser um número válido" }, // Retorna erro se inválido
        { status: 400 },
      );
    }

    if (!isAdmin && !codCliente) {
      // Se não for admin, exige 'codCliente'
      return NextResponse.json(
        {
          error: "Parâmetro 'codCliente' é obrigatório para usuários não admin", // Retorna erro se faltar
        },
        { status: 400 },
      );
    }

    const dataInicio = new Date(anoParam, mesParam - 1, 1, 0, 0, 0, 0); // Cria data de início do mês
    const dataFim = new Date(anoParam, mesParam, 1, 0, 0, 0, 0); // Cria data de fim do mês

    // Ajuste conforme necessário
    const filtros: Record<string, unknown> = {
      // Cria objeto de filtros para consulta
      dthrini_apont: {
        gte: dataInicio, // Data de início maior ou igual ao início do mês
        lt: dataFim, // Data de início menor que o início do próximo mês
      },
    };

    if (!isAdmin) {
      // Se não for admin
      filtros.cod_cliente = codCliente; // Filtra pelo código do cliente
    } else if (clienteQuery) {
      // Se for admin e informou cliente
      filtros.nome_cliente = clienteQuery; // Filtra pelo nome do cliente
    }

    if (recursoQuery) {
      // Se informou recurso
      filtros.nome_recurso = recursoQuery; // Filtra pelo nome do recurso
    }

    if (statusQuery) {
      // Se informou status
      filtros.status_chamado = statusQuery; // Filtra pelo status do chamado
    }

    // --------------------------------------------------------------------------------

    const apontamentos = await solutiiPrisma.apontamentos.findMany({
      where: filtros, // Aplica os filtros definidos
      select: {
        hrini_os: true, // Seleciona a data e hora de início do apontamento
        hrfim_os: true, // Seleciona a data e hora de fim do apontamento
        nome_recurso: true, // Seleciona o nome do recurso
        nome_cliente: true, // Seleciona o nome do cliente
      },
    });
    if (apontamentos.length === 0) {
      return NextResponse.json({ media: 0, registros: 0 }); // Retorna média 0 e registros 0 se não houver apontamentos
    }

    const totalHoras = apontamentos.reduce((total, apontamento) => {
      if (!apontamento.hrini_os || !apontamento.hrfim_os) {
        return total; // Ignora registros com datas nulas
      }
      const duracao = calcularDuracaoHoras(
        apontamento.hrini_os.slice(0, 5),
        apontamento.hrfim_os.slice(0, 5),
      );
      return total + duracao; // Soma a duração de cada apontamento
    }, 0);

    const media = totalHoras / apontamentos.length; // Calcula a média de horas

    return NextResponse.json({
      mediaHora: media.toFixed(2), // Retorna a média formatada com 2 casas decimais
      registros: apontamentos.length, // Retorna o número de registros encontrados
    });
  } catch (error) {
    console.error(
      'Erro ao tentar calcular a média de horas por chamado:',
      error,
    ); // Loga o erro no console
    return NextResponse.json(
      { error: 'Erro interno do servidor' }, // Retorna mensagem de erro
      { status: 500 }, // Retorna status 500 (erro interno do servidor)
    );
  }
}
