import { solutiiPrisma } from '@/lib/solutii-prisma'; // Importa a instância do Prisma para acessar o banco de dados
import { NextResponse } from 'next/server'; // Importa NextResponse para retornar respostas HTTP

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
      // Valida se o mês está entre 1 e 12
      return NextResponse.json(
        { error: "Parâmetro 'mes' deve ser um número entre 1 e 12" }, // Retorna erro se inválido
        { status: 400 }, // Código de status HTTP 400 (Bad Request)
      );
    }

    if (!anoParam || anoParam < 2000 || anoParam > 3000) {
      // Valida se o ano está em um intervalo aceitável
      return NextResponse.json(
        { error: "Parâmetro 'ano' deve ser um número válido" }, // Retorna erro se inválido
        { status: 400 }, // Código de status HTTP 400 (Bad Request)
      );
    }

    if (!isAdmin && !codCliente) {
      // Se não for admin, exige que o código do cliente seja informado
      return NextResponse.json(
        {
          error: "Parâmetro 'codCliente' é obrigatório para usuários não admin", // Retorna erro se faltar
        },
        { status: 400 }, // Código de status HTTP 400 (Bad Request)
      );
    }

    const dataInicio = new Date(anoParam, mesParam - 1, 1, 0, 0, 0, 0); // Cria data de início do mês
    const dataFim = new Date(anoParam, mesParam, 1, 0, 0, 0, 0); // Cria data de fim do mês (primeiro dia do mês seguinte)

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

    const chamados = await solutiiPrisma.apontamentos.findMany(); // Busca todos os chamados no banco de dados (filtros ainda não aplicados)
    return NextResponse.json(chamados); // Retorna os chamados encontrados em formato JSON
  } catch (error) {
    // Se ocorrer algum erro
    console.error('Erro ao buscar chamados:', error); // Exibe o erro no console
    return new NextResponse('Erro no servidor', { status: 500 }); // Retorna erro 500 (Internal Server Error)
  }
}
