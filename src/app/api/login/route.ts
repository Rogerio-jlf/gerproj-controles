import bcrypt from 'bcryptjs';
import fs from 'fs/promises';
import { NextResponse } from 'next/server';
import path from 'path';

// ==================== TIPOS ====================
interface LoginRequest {
  email: string;
  password: string;
}

interface Usuario {
  email: string;
  password: string;
  isAdmin?: boolean;
  cod_cliente?: string | null;
  codrec_os?: string | null;
  nome?: string | null;
}

interface LoginResponse {
  success: boolean;
  message?: string;
  isAdmin?: boolean;
  codCliente?: string | null;
  codRecOS?: string | null;
  nomeRecurso?: string | null;
}

// ==================== CONSTANTES ====================
const USERS_FILE_PATH = path.join(process.cwd(), 'users', 'usuarios.json');

const ERROR_MESSAGES = {
  INVALID_CREDENTIALS: 'Email ou senha inválidos',
  USER_NOT_FOUND: 'Usuário não encontrado',
  INVALID_PASSWORD: 'Senha incorreta',
  INVALID_REQUEST: 'Email e senha são obrigatórios',
  SERVER_ERROR: 'Erro interno do servidor',
  FILE_READ_ERROR: 'Erro ao ler arquivo de usuários',
} as const;

// ==================== VALIDAÇÕES ====================
function validarCredenciais(email: string, password: string): NextResponse | null {
  if (!email || !password) {
    return NextResponse.json(
      { 
        success: false, 
        message: ERROR_MESSAGES.INVALID_REQUEST 
      },
      { status: 400 }
    );
  }

  if (typeof email !== 'string' || typeof password !== 'string') {
    return NextResponse.json(
      { 
        success: false, 
        message: ERROR_MESSAGES.INVALID_REQUEST 
      },
      { status: 400 }
    );
  }

  return null;
}

// ==================== LEITURA DE USUÁRIOS ====================
async function carregarUsuarios(): Promise<Usuario[]> {
  try {
    const data = await fs.readFile(USERS_FILE_PATH, 'utf-8');
    return JSON.parse(data);
  } catch (error) {
    console.error('[Login] Erro ao ler arquivo de usuários:', error);
    throw new Error(ERROR_MESSAGES.FILE_READ_ERROR);
  }
}

// ==================== BUSCA DE USUÁRIO ====================
function buscarUsuarioPorEmail(usuarios: Usuario[], email: string): Usuario | undefined {
  const emailNormalizado = email.toLowerCase().trim();
  return usuarios.find(u => u.email.toLowerCase().trim() === emailNormalizado);
}

// ==================== VALIDAÇÃO DE SENHA ====================
async function validarSenha(senhaPlana: string, senhaHash: string): Promise<boolean> {
  try {
    return await bcrypt.compare(senhaPlana, senhaHash);
  } catch (error) {
    console.error('[Login] Erro ao validar senha:', error);
    return false;
  }
}

// ==================== CONSTRUÇÃO DA RESPOSTA ====================
function construirRespostaLogin(usuario: Usuario): LoginResponse {
  return {
    success: true,
    isAdmin: usuario.isAdmin ?? false,
    codCliente: usuario.cod_cliente ?? null,
    codRecOS: usuario.codrec_os ?? null,
    nomeRecurso: usuario.nome ?? null,
  };
}

// ==================== RESPOSTAS DE ERRO ====================
function respostaErroAutenticacao(message: string = ERROR_MESSAGES.INVALID_CREDENTIALS): NextResponse {
  // Por segurança, sempre retorna a mesma mensagem genérica
  // para não dar dicas sobre qual parte da credencial está errada
  return NextResponse.json(
    { 
      success: false, 
      message: ERROR_MESSAGES.INVALID_CREDENTIALS 
    },
    { status: 401 }
  );
}

function respostaErroServidor(error: unknown): NextResponse {
  console.error('[Login] Erro no servidor:', error);
  console.error('[Login] Stack:', error instanceof Error ? error.stack : 'N/A');

  return NextResponse.json(
    {
      success: false,
      message: ERROR_MESSAGES.SERVER_ERROR,
      details: process.env.NODE_ENV === 'development' 
        ? (error instanceof Error ? error.message : 'Erro desconhecido')
        : undefined
    },
    { status: 500 }
  );
}

// ==================== HANDLER PRINCIPAL ====================
export async function POST(request: Request) {
  try {
    // 1. Parse e validação da requisição
    const body: LoginRequest = await request.json();
    const { email, password } = body;

    console.log('[Login] Tentativa de login para:', email);

    // 2. Validar credenciais
    const erroValidacao = validarCredenciais(email, password);
    if (erroValidacao) {
      console.log('[Login] Validação falhou:', email);
      return erroValidacao;
    }

    // 3. Carregar usuários
    const usuarios = await carregarUsuarios();
    console.log(`[Login] ${usuarios.length} usuários carregados`);

    // 4. Buscar usuário por email
    const usuario = buscarUsuarioPorEmail(usuarios, email);
    if (!usuario) {
      console.log('[Login] Usuário não encontrado:', email);
      return respostaErroAutenticacao();
    }

    // 5. Validar senha
    const senhaValida = await validarSenha(password, usuario.password);
    if (!senhaValida) {
      console.log('[Login] Senha inválida para:', email);
      return respostaErroAutenticacao();
    }

    // 6. Login bem-sucedido
    console.log('[Login] Login bem-sucedido:', email);
    const resposta = construirRespostaLogin(usuario);

    return NextResponse.json(resposta, { status: 200 });

  } catch (error) {
    return respostaErroServidor(error);
  }
}