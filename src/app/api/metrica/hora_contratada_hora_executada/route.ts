import { solutiiPrisma } from '@/lib/solutii-prisma'; // Importa a instância do Prisma para acessar o banco de dados
import { NextResponse } from 'next/server'; // Importa NextResponse para retornar respostas HTTP

function converterHoraParaMinutos(hora: string | null): number {
  if (!hora) return 0;

  const partes = hora.split(':');
  if (partes.length < 2) return 0;

  const horas = parseInt(partes[0]) || 0;
  const minutos = parseInt(partes[1]) || 0;
  const segundos = partes.length > 2 ? parseInt(partes[2]) || 0 : 0;

  return horas * 60 + minutos + segundos / 60;
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

    // Busca todos os apontamentos que atendem aos filtros
    const apontamentos = await solutiiPrisma.apontamentos.findMany({
      // Consulta o banco de dados para buscar apontamentos conforme os filtros
      where: filtros, // Aplica os filtros definidos anteriormente
      select: {
        // Define os campos que serão retornados na consulta
        cod_cliente: true, // Retorna o código do cliente
        nome_cliente: true, // Retorna o nome do cliente
        limmes_tarefa: true, // Retorna o limite de horas contratadas pelo cliente
        hrini_os: true, // Retorna a hora de início da OS
        hrfim_os: true, // Retorna a hora de fim da OS
      },
    });

    // Agrupa dados por cliente para calcular horas
    const clientesMap = new Map<
      string,
      {
        // Cria um Map para agrupar dados por código do cliente
        nome_cliente: string | null; // Nome do cliente (pode ser nulo)
        limmes_tarefas: number[]; // Array para armazenar os limites de horas das tarefas
        horasExecutadas: number; // Soma das horas executadas para o cliente
      }
    >();

    // Processa cada apontamento
    apontamentos.forEach((apontamento) => {
      // Itera sobre cada apontamento retornado do banco
      const codCliente = apontamento.cod_cliente || 'SEM_CODIGO'; // Usa o código do cliente ou 'SEM_CODIGO' se não existir

      if (!clientesMap.has(codCliente)) {
        // Se ainda não existe entrada para este cliente no Map
        clientesMap.set(codCliente, {
          // Cria uma nova entrada para o cliente
          nome_cliente: apontamento.nome_cliente, // Armazena o nome do cliente
          limmes_tarefas: [], // Inicializa o array de limites de tarefas
          horasExecutadas: 0, // Inicializa o total de horas executadas
        });
      }

      const cliente = clientesMap.get(codCliente)!; // Recupera os dados do cliente do Map

      // Adiciona limmes_tarefa se existir
      if (apontamento.limmes_tarefa) {
        // Se o apontamento tem limmes_tarefa
        cliente.limmes_tarefas.push(apontamento.limmes_tarefa); // Adiciona ao array de limites de tarefas
      }

      // Calcula horas executadas se tiver hrini_os e hrfim_os
      if (apontamento.hrini_os && apontamento.hrfim_os) {
        // Se o apontamento tem hora de início e fim
        const minutosInicio = converterHoraParaMinutos(apontamento.hrini_os); // Converte hora de início para minutos
        const minutosFim = converterHoraParaMinutos(apontamento.hrfim_os); // Converte hora de fim para minutos

        let diferencaMinutos = minutosFim - minutosInicio; // Calcula a diferença em minutos

        // Se a hora fim for menor que a início, assume que passou para o dia seguinte
        if (diferencaMinutos < 0) {
          // Se a diferença for negativa
          diferencaMinutos += 24 * 60; // Adiciona 24 horas em minutos para corrigir
        }

        cliente.horasExecutadas += diferencaMinutos / 60; // Soma as horas executadas (convertendo minutos para horas)
      }
    });

    // Calcula totais finais
    let totalHorasContratadas = 0;
    let totalHorasExecutadas = 0;

    // Converte o Map de clientes em um array e mapeia cada cliente
    const detalhesClientes = Array.from(clientesMap.entries()).map(
      ([codCliente, dados]) => {
        // Encontra o maior limmes_tarefa para este cliente e soma todos
        const horasContratadasCliente =
          dados.limmes_tarefas.length > 0 // Se houver limites de tarefas para o cliente
            ? Math.max(...dados.limmes_tarefas) // Usa o maior valor de limmes_tarefas como horas contratadas
            : 0; // Caso contrário, define como 0

        const horasExecutadasCliente =
          Math.round(dados.horasExecutadas * 100) / 100; // Arredonda as horas executadas do cliente para 2 casas decimais

        totalHorasContratadas += horasContratadasCliente; // Soma as horas contratadas deste cliente ao total geral
        totalHorasExecutadas += horasExecutadasCliente; // Soma as horas executadas deste cliente ao total geral

        return {
          // Retorna um objeto com os detalhes do cliente
          cod_cliente: codCliente, // Código do cliente
          nome_cliente: dados.nome_cliente, // Nome do cliente
          horasContratadas: horasContratadasCliente, // Horas contratadas para o cliente
          horasExecutadas: horasExecutadasCliente, // Horas executadas para o cliente
          totalLimmesTarefas: dados.limmes_tarefas.length, // Quantidade de tarefas com limite de horas para o cliente
        };
      },
    );

    // Arredonda totais para 2 casas decimais
    totalHorasContratadas = Math.round(totalHorasContratadas * 100) / 100;
    totalHorasExecutadas = Math.round(totalHorasExecutadas * 100) / 100;

    return NextResponse.json({
      totalHorasContratadas,
      totalHorasExecutadas,
      detalhesClientes,
      resumo: {
        totalClientes: clientesMap.size,
        diferencaHoras:
          Math.round((totalHorasContratadas - totalHorasExecutadas) * 100) /
          100,
        percentualExecucao:
          totalHorasContratadas > 0
            ? Math.round(
                (totalHorasExecutadas / totalHorasContratadas) * 100 * 100,
              ) / 100
            : 0,
      },
    });
  } catch (error) {
    console.error('Erro ao calcular horas contratadas vs executadas:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 },
    );
  }
}
