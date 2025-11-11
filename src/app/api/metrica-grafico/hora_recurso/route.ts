import { solutiiPrisma } from '@/lib/solutii-prisma'; // Importa a instância do Prisma para acessar o banco de dados
import { NextResponse } from 'next/server'; // Importa NextResponse para retornar respostas HTTP

// Função para converter string de hora (HH:MM:SS ou HH:MM) para minutos
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

    // PERÍODO
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
      where: filtros, // Aplica os filtros definidos anteriormente
      select: {
        // Define os campos que serão retornados na consulta
        cod_cliente: true, // Retorna o código do cliente
        nome_cliente: true, // Retorna o nome do cliente
        codrec_os: true, // Retorna o código do recurso
        nome_recurso: true, // Retorna o nome do recurso
        hrini_os: true, // Retorna a hora de início da OS
        hrfim_os: true, // Retorna a hora de fim da OS
      },
    });

    // Agrupa dados por RECURSO para calcular horas
    const recursosMap = new Map<
      string,
      {
        // Cria um Map para agrupar dados por código do recurso
        nome_recurso: string | null; // Nome do recurso
        codrec_os: string | null; // Código do recurso
        totalHorasExecutadasRecurso: number; // Soma as horas executadas pelo recurso
        clientes: Set<string>; // Set de clientes únicos que usaram este recurso
      }
    >();

    // Set para contar clientes únicos
    const clientesUnicos = new Set<string>();

    // Processa cada apontamento
    apontamentos.forEach((apontamento) => {
      // Itera sobre cada apontamento retornado do banco
      const codRecurso = apontamento.codrec_os || 'SEM_CODIGO'; // Usa o código do recurso ou 'SEM_CODIGO' se não existir
      const codCliente = apontamento.cod_cliente || 'SEM_CODIGO'; // Código do cliente para contagem

      // Adiciona cliente ao Set de clientes únicos (se existir)
      if (apontamento.cod_cliente) {
        clientesUnicos.add(apontamento.cod_cliente);
      }

      if (!recursosMap.has(codRecurso)) {
        // Se ainda não existe entrada para este recurso no Map
        recursosMap.set(codRecurso, {
          // Cria uma nova entrada para o recurso
          nome_recurso: apontamento.nome_recurso || 'SEM_NOME', // Armazena o nome do recurso ou 'SEM_NOME' se não existir
          codrec_os: apontamento.codrec_os || 'SEM_CODIGO', // Armazena o código do recurso ou 'SEM_CODIGO' se não existir
          totalHorasExecutadasRecurso: 0, // Inicializa o total de horas executadas
          clientes: new Set<string>(), // Inicializa o Set de clientes únicos para este recurso
        });
      }

      const recurso = recursosMap.get(codRecurso)!; // Recupera os dados do recurso do Map

      // Adiciona cliente ao Set de clientes deste recurso
      if (codCliente !== 'SEM_CODIGO') {
        recurso.clientes.add(codCliente);
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

        recurso.totalHorasExecutadasRecurso += diferencaMinutos / 60; // Soma as horas executadas (convertendo minutos para horas)
      }
    });

    // Calcula totais finais
    let totalHorasExecutadas = 0;
    const numeroDeClientes = clientesUnicos.size; // Conta o número de clientes únicos
    const numeroDeRecursos = recursosMap.size; // Conta o número de recursos únicos

    // Mapeia os recursos para um array de detalhesRecursos
    const detalhesRecursos = Array.from(recursosMap.entries()).map(
      ([codRecurso, dados]) => {
        const totalHorasExecutadasRecurso =
          Math.round(dados.totalHorasExecutadasRecurso * 100) / 100; // Arredonda as horas executadas do recurso para 2 casas decimais
        totalHorasExecutadas += totalHorasExecutadasRecurso; // Soma as horas executadas deste recurso ao total geral (para cálculo inicial do percentual)

        return {
          // Retorna um objeto temporário para o primeiro cálculo
          codrec_os: codRecurso, // Código do recurso
          nome_recurso: dados.nome_recurso, // Nome do recurso
          horasExecutadas: totalHorasExecutadasRecurso, // Horas executadas pelo recurso
          numeroClientesUnicos: dados.clientes.size, // Número de clientes únicos que usaram este recurso
        };
      },
    );

    // Calcula o percentual de horas executadas por recurso
    const detalhesRecursosFinais = detalhesRecursos.map((recurso) => ({
      ...recurso,
      percentual:
        totalHorasExecutadas > 0
          ? Number(
              ((recurso.horasExecutadas / totalHorasExecutadas) * 100).toFixed(
                2,
              ),
            )
          : 0, // Percentual de horas executadas
    }));

    // Calcula a média de horas por cliente
    const mediaHorasPorCliente =
      numeroDeClientes > 0
        ? Math.round((totalHorasExecutadas / numeroDeRecursos) * 100) / 100
        : 0;

    // Retorna a resposta com os dados dos recursos e totais
    return NextResponse.json({
      detalhesRecursos: detalhesRecursosFinais, // Array com os detalhes de cada recurso
      totalHorasExecutadas: Math.round(totalHorasExecutadas * 100) / 100, // Total de horas executadas arredondado para 2 casas decimais
      numeroDeClientes, // Número total de clientes únicos
      mediaHorasPorCliente, // Média de horas por cliente
      numeroDeRecursos, // Número total de recursos únicos
    });
  } catch (error) {
    // Captura qualquer erro que ocorra durante o processamento
    console.error('Erro ao processar a requisição:', error); // Loga o erro no console
    return NextResponse.json(
      { error: 'Erro ao processar a requisição' }, // Retorna uma mensagem de erro genérica
      { status: 500 }, // Com status HTTP 500 (Erro Interno do Servidor)
    );
  }
}
