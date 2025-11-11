import { solutiiPrisma } from '@/lib/solutii-prisma'; // Importa a instância do Prisma para acessar o banco de dados
import { NextResponse } from 'next/server'; // Importa NextResponse para retornar respostas HTTP

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url); // Extrai os parâmetros da URL da requisição

    const mesParam = searchParams.get('mes'); // Obtém o parâmetro 'mes' da query string
    const anoParam = searchParams.get('ano'); // Obtém o parâmetro 'ano' da query string
    const isAdmin = searchParams.get('isAdmin') === 'true'; // Verifica se o usuário é admin
    const codCliente = searchParams.get('codCliente'); // Obtém o parâmetro 'codCliente'
    const cliente = searchParams.get('cliente'); // Obtém o parâmetro 'cliente'

    const mes = Number(mesParam); // Converte 'mes' para número
    const ano = Number(anoParam); // Converte 'ano' para número

    if (!mesParam || isNaN(mes) || mes < 1 || mes > 12) {
      // Valida o parâmetro 'mes'
      return NextResponse.json(
        { error: "Parâmetro 'mes' deve ser um número entre 1 e 12" }, // Retorna erro se inválido
        { status: 400 },
      );
    }

    if (!anoParam || isNaN(ano) || ano < 2000 || ano > 3000) {
      // Valida o parâmetro 'ano'
      return NextResponse.json(
        { error: "Parâmetro 'ano' deve ser um número válido" }, // Retorna erro se inválido
        { status: 400 },
      );
    }

    if (!isAdmin && (!codCliente || codCliente.trim() === '')) {
      // Valida 'codCliente' para não admins
      return NextResponse.json(
        {
          error: "Parâmetro 'codCliente' é obrigatório para usuários não admin", // Retorna erro se ausente
        },
        { status: 400 },
      );
    }

    const dataInicio = new Date(ano, mes - 1, 1, 0, 0, 0, 0); // Cria data de início do mês
    const dataFim = new Date(ano, mes, 1, 0, 0, 0, 0); // Cria data de início do mês seguinte

    const filtro: Record<string, unknown> = {
      // Inicializa o filtro para consulta no banco
      dthrini_apont: {
        gte: dataInicio, // Data maior ou igual ao início do mês
        lt: dataFim, // Data menor que o início do mês seguinte
      },
    };

    // Se não for admin, filtra pelo código do cliente
    if (!isAdmin) {
      filtro.cod_cliente = codCliente;
      // Caso contrário, usa codRecurso se ele estiver definido
    } else if (cliente) {
      filtro.nome_cliente = cliente;
    }

    const recursos = await solutiiPrisma.apontamentos.findMany({
      // Consulta os chamados no banco de dados
      where: filtro, // Aplica o filtro construído
      distinct: ['nome_recurso'], // Retorna apenas recursos distintos
      select: {
        nome_recurso: true, // Seleciona apenas o nome do recurso
      },
    });

    const nomesRecursos = recursos // Processa os resultados da consulta
      .map((item) => item.nome_recurso) // Extrai o nome do recurso
      .filter((nome): nome is string => nome != null && nome.trim() !== '') // Remove nulos e vazios
      .sort((a, b) => a.localeCompare(b, 'pt-BR', { sensitivity: 'base' })); // Ordena alfabeticamente

    return NextResponse.json(nomesRecursos); // Retorna a lista de nomes de recursos como JSON
  } catch (error) {
    // Captura erros durante a execução
    console.error('Erro detalhado ao buscar recursos:', error); // Loga o erro no console

    if (error instanceof Error) {
      // Se o erro for uma instância de Error
      return NextResponse.json(
        {
          error: 'Erro ao buscar recursos', // Mensagem de erro
          message: error.message, // Mensagem detalhada do erro
          timestamp: new Date().toISOString(), // Timestamp do erro
        },
        { status: 500 },
      );
    }

    return NextResponse.json(
      { error: 'Erro interno do servidor' }, // Mensagem genérica de erro
      { status: 500 },
    );
  }
}
