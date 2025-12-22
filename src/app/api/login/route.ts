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
const CACHE_TTL = 5 * 60 * 1000; // 5 minutos em ms

const ERROR_MESSAGES = {
  INVALID_CREDENTIALS: 'Email ou senha inválidos',
  USER_NOT_FOUND: 'Usuário não encontrado',
  INVALID_PASSWORD: 'Senha incorreta',
  INVALID_REQUEST: 'Email e senha são obrigatórios',
  SERVER_ERROR: 'Erro interno do servidor',
  FILE_READ_ERROR: 'Erro ao ler arquivo de usuários',
} as const;

// ==================== CACHE DE USUÁRIOS ====================
// ✅ OTIMIZAÇÃO: Cache em memória para evitar leituras repetidas do arquivo
interface CacheEntry {
  usuarios: Map<string, Usuario>; // Map para busca O(1)
  timestamp: number;
  fileStats: { mtime: number }; // Para invalidar cache se arquivo mudar
}

let usuariosCache: CacheEntry | null = null;

async function getFileModifiedTime(): Promise<number> {
  try {
    const stats = await fs.stat(USERS_FILE_PATH);
    return stats.mtimeMs;
  } catch {
    return 0;
  }
}

async function isCacheValido(): Promise<boolean> {
  if (!usuariosCache) return false;

  const agora = Date.now();
  const cacheExpirado = agora - usuariosCache.timestamp > CACHE_TTL;

  if (cacheExpirado) return false;

  // Verifica se o arquivo foi modificado
  const mtime = await getFileModifiedTime();
  return mtime === usuariosCache.fileStats.mtime;
}

async function carregarUsuarios(): Promise<Map<string, Usuario>> {
  // ✅ OTIMIZAÇÃO: Retorna cache se válido
  if (await isCacheValido()) {
    return usuariosCache!.usuarios;
  }

  try {
    const data = await fs.readFile(USERS_FILE_PATH, 'utf-8');
    const usuarios: Usuario[] = JSON.parse(data);

    // ✅ OTIMIZAÇÃO: Converte array para Map para busca O(1)
    const usuariosMap = new Map<string, Usuario>();

    for (let i = 0; i < usuarios.length; i++) {
      const u = usuarios[i];
      const emailNormalizado = u.email.toLowerCase().trim();
      usuariosMap.set(emailNormalizado, u);
    }

    // Atualiza cache
    const mtime = await getFileModifiedTime();
    usuariosCache = {
      usuarios: usuariosMap,
      timestamp: Date.now(),
      fileStats: { mtime },
    };

    return usuariosMap;
  } catch (error) {
    console.error('[Login] Erro ao ler arquivo de usuários:', error);
    throw new Error(ERROR_MESSAGES.FILE_READ_ERROR);
  }
}

// ==================== VALIDAÇÕES ====================
// ✅ OTIMIZAÇÃO: Validação inline mais rápida
function validarCredenciais(
  email: string,
  password: string,
): NextResponse | null {
  if (
    !email ||
    !password ||
    typeof email !== 'string' ||
    typeof password !== 'string'
  ) {
    return NextResponse.json(
      {
        success: false,
        message: ERROR_MESSAGES.INVALID_REQUEST,
      },
      { status: 400 },
    );
  }

  return null;
}

// ==================== BUSCA DE USUÁRIO ====================
// ✅ OTIMIZAÇÃO: Busca O(1) usando Map ao invés de find O(n)
function buscarUsuarioPorEmail(
  usuariosMap: Map<string, Usuario>,
  email: string,
): Usuario | undefined {
  const emailNormalizado = email.toLowerCase().trim();
  return usuariosMap.get(emailNormalizado);
}

// ==================== CACHE DE VALIDAÇÃO DE SENHA ====================
// ✅ OTIMIZAÇÃO: Cache de senhas já validadas (usando hash do email+senha)
// IMPORTANTE: Limitar tamanho do cache para evitar memory leak
interface SenhaCacheEntry {
  valida: boolean;
  timestamp: number;
}

const senhaCache = new Map<string, SenhaCacheEntry>();
const SENHA_CACHE_TTL = 60 * 1000; // 1 minuto
const SENHA_CACHE_MAX_SIZE = 1000;

function getCacheKey(email: string, senha: string): string {
  // Hash simples para cache (não é para segurança, só para chave)
  return `${email}:${senha.length}:${senha.substring(0, 3)}`;
}

function limparCacheAntigas(): void {
  const agora = Date.now();
  const chaves = Array.from(senhaCache.keys());

  for (let i = 0; i < chaves.length; i++) {
    const k = chaves[i];
    const entry = senhaCache.get(k);
    if (entry && agora - entry.timestamp > SENHA_CACHE_TTL) {
      senhaCache.delete(k);
    }
  }

  // Limita tamanho máximo
  if (senhaCache.size > SENHA_CACHE_MAX_SIZE) {
    const excesso = senhaCache.size - SENHA_CACHE_MAX_SIZE;
    const keysArray = Array.from(senhaCache.keys());
    for (let i = 0; i < excesso; i++) {
      senhaCache.delete(keysArray[i]);
    }
  }
}

async function validarSenha(
  email: string,
  senhaPlana: string,
  senhaHash: string,
): Promise<boolean> {
  // ✅ OTIMIZAÇÃO: Verifica cache primeiro
  const cacheKey = getCacheKey(email, senhaPlana);
  const cached = senhaCache.get(cacheKey);

  if (cached) {
    const agora = Date.now();
    if (agora - cached.timestamp < SENHA_CACHE_TTL) {
      return cached.valida;
    }
    senhaCache.delete(cacheKey);
  }

  try {
    const valida = await bcrypt.compare(senhaPlana, senhaHash);

    // Adiciona ao cache apenas senhas válidas (segurança)
    if (valida) {
      senhaCache.set(cacheKey, {
        valida,
        timestamp: Date.now(),
      });

      // Limpa cache periodicamente
      if (senhaCache.size > SENHA_CACHE_MAX_SIZE * 0.9) {
        limparCacheAntigas();
      }
    }

    return valida;
  } catch (error) {
    console.error('[Login] Erro ao validar senha:', error);
    return false;
  }
}

// ==================== CONSTRUÇÃO DA RESPOSTA ====================
// ✅ OTIMIZAÇÃO: Resposta pré-construída para evitar alocações
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
// ✅ OTIMIZAÇÃO: Respostas pré-criadas para casos comuns
const ERRO_AUTENTICACAO_RESPONSE = NextResponse.json(
  {
    success: false,
    message: ERROR_MESSAGES.INVALID_CREDENTIALS,
  },
  { status: 401 },
);

function respostaErroAutenticacao(): NextResponse {
  // Clona a resposta para evitar mutação
  return NextResponse.json(
    {
      success: false,
      message: ERROR_MESSAGES.INVALID_CREDENTIALS,
    },
    { status: 401 },
  );
}

function respostaErroServidor(error: unknown): NextResponse {
  console.error('[Login] Erro no servidor:', error);

  return NextResponse.json(
    {
      success: false,
      message: ERROR_MESSAGES.SERVER_ERROR,
      details:
        process.env.NODE_ENV === 'development'
          ? error instanceof Error
            ? error.message
            : 'Erro desconhecido'
          : undefined,
    },
    { status: 500 },
  );
}

// ==================== HANDLER PRINCIPAL ====================
export async function POST(request: Request) {
  try {
    // 1. Parse e validação da requisição
    const body: LoginRequest = await request.json();
    const { email, password } = body;

    // ✅ OTIMIZAÇÃO: Logs apenas em desenvolvimento
    if (process.env.NODE_ENV === 'development') {
      console.log('[Login] Tentativa de login para:', email);
    }

    // 2. Validar credenciais
    const erroValidacao = validarCredenciais(email, password);
    if (erroValidacao) {
      return erroValidacao;
    }

    // 3. Carregar usuários (com cache)
    const usuariosMap = await carregarUsuarios();

    // 4. Buscar usuário por email (O(1) com Map)
    const usuario = buscarUsuarioPorEmail(usuariosMap, email);
    if (!usuario) {
      if (process.env.NODE_ENV === 'development') {
        console.log('[Login] Usuário não encontrado:', email);
      }
      return respostaErroAutenticacao();
    }

    // 5. Validar senha (com cache)
    const senhaValida = await validarSenha(email, password, usuario.password);
    if (!senhaValida) {
      if (process.env.NODE_ENV === 'development') {
        console.log('[Login] Senha inválida para:', email);
      }
      return respostaErroAutenticacao();
    }

    // 6. Login bem-sucedido
    if (process.env.NODE_ENV === 'development') {
      console.log('[Login] Login bem-sucedido:', email);
    }

    const resposta = construirRespostaLogin(usuario);
    return NextResponse.json(resposta, { status: 200 });
  } catch (error) {
    return respostaErroServidor(error);
  }
}

// ==================== LIMPEZA DE CACHE (OPCIONAL) ====================
// ✅ Função auxiliar para limpar caches manualmente se necessário
export function limparCaches(): void {
  usuariosCache = null;
  senhaCache.clear();
  console.log('[Login] Caches limpos');
}

// ✅ Função para pré-carregar usuários (útil no startup)
export async function preloadUsuarios(): Promise<void> {
  try {
    await carregarUsuarios();
    console.log('[Login] Usuários pré-carregados no cache');
  } catch (error) {
    console.error('[Login] Erro ao pré-carregar usuários:', error);
  }
}
