import { readFile } from 'fs/promises';
import { NextResponse } from 'next/server';
import path from 'path';

// ==================== TIPOS ====================
interface Usuario {
  email: string;
  password: string;
  isAdmin?: boolean;
  cod_cliente?: string | null;
  codrec_os?: string | null;
  nome?: string | null;
}

interface UsuarioSeguro {
  email: string;
  isAdmin: boolean;
  cod_cliente: string | null;
  codrec_os: string | null;
  nome: string | null;
}

// ==================== CONSTANTES ====================
const USERS_FILE_PATH = path.join(process.cwd(), 'users', 'usuarios.json');

const ERROR_MESSAGES = {
  FILE_READ_ERROR: 'Erro ao ler arquivo de usuários',
  FILE_PARSE_ERROR: 'Erro ao processar dados dos usuários',
  SERVER_ERROR: 'Erro ao carregar usuários',
} as const;

// ==================== LEITURA DE USUÁRIOS ====================
async function carregarUsuarios(): Promise<Usuario[]> {
  try {
    console.log('[Usuarios] Lendo arquivo:', USERS_FILE_PATH);
    const data = await readFile(USERS_FILE_PATH, 'utf-8');
    return JSON.parse(data);
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
      console.error('[Usuarios] Arquivo não encontrado:', USERS_FILE_PATH);
      throw new Error('Arquivo de usuários não encontrado');
    }
    
    console.error('[Usuarios] Erro ao ler arquivo:', error);
    throw new Error(ERROR_MESSAGES.FILE_READ_ERROR);
  }
}

// ==================== SANITIZAÇÃO DE DADOS ====================
function removerSenhas(usuarios: Usuario[]): UsuarioSeguro[] {
  return usuarios.map(usuario => ({
    email: usuario.email,
    isAdmin: usuario.isAdmin ?? false,
    cod_cliente: usuario.cod_cliente ?? null,
    codrec_os: usuario.codrec_os ?? null,
    nome: usuario.nome ?? null,
  }));
}

// ==================== VALIDAÇÃO DE DADOS ====================
function validarUsuarios(usuarios: any[]): boolean {
  if (!Array.isArray(usuarios)) {
    console.error('[Usuarios] Dados não são um array');
    return false;
  }

  if (usuarios.length === 0) {
    console.warn('[Usuarios] Nenhum usuário encontrado no arquivo');
    return true; // Array vazio é válido
  }

  // Valida se cada usuário tem pelo menos email
  const todosValidos = usuarios.every(user => 
    user && typeof user === 'object' && typeof user.email === 'string'
  );

  if (!todosValidos) {
    console.error('[Usuarios] Alguns usuários não possuem estrutura válida');
    return false;
  }

  return true;
}

// ==================== RESPOSTAS DE ERRO ====================
function respostaErroServidor(error: unknown, customMessage?: string): NextResponse {
  console.error('[Usuarios] Erro no servidor:', error);
  console.error('[Usuarios] Stack:', error instanceof Error ? error.stack : 'N/A');

  const message = customMessage || ERROR_MESSAGES.SERVER_ERROR;
  
  return NextResponse.json(
    {
      error: message,
      details: process.env.NODE_ENV === 'development' 
        ? (error instanceof Error ? error.message : 'Erro desconhecido')
        : undefined
    },
    { status: 500 }
  );
}

// ==================== HANDLER PRINCIPAL ====================
export async function GET() {
  try {
    console.log('[Usuarios] Iniciando busca de usuários');

    // 1. Carregar usuários do arquivo
    const usuarios = await carregarUsuarios();
    
    console.log(`[Usuarios] ${usuarios.length} usuários carregados`);

    // 2. Validar estrutura dos dados
    if (!validarUsuarios(usuarios)) {
      return respostaErroServidor(
        new Error('Dados inválidos'),
        ERROR_MESSAGES.FILE_PARSE_ERROR
      );
    }

    // 3. Remover senhas antes de retornar (SEGURANÇA CRÍTICA)
    const usuariosSeguro = removerSenhas(usuarios);

    console.log('[Usuarios] Retornando usuários (sem senhas)');

    return NextResponse.json(usuariosSeguro, { status: 200 });

  } catch (error) {
    return respostaErroServidor(error);
  }
}