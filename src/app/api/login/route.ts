// pages/api/login/route.ts
import bcrypt from 'bcryptjs';
import fs from 'fs/promises';
import { NextResponse } from 'next/server';
import path from 'path';

export async function POST(request: Request) {
  const { email, password } = await request.json();

  const filePath = path.join(process.cwd(), 'users', 'usuarios.json');
  const data = await fs.readFile(filePath, 'utf-8');
  const usuarios = JSON.parse(data);

  const user = usuarios.find(
    (u: any) => u.email.toLowerCase() === email.toLowerCase(),
  );

  if (!user) {
    return NextResponse.json(
      { success: false, message: 'Usuário não encontrado' },
      { status: 401 },
    );
  }

  const validPassword = await bcrypt.compare(password, user.password);
  if (!validPassword) {
    return NextResponse.json(
      { success: false, message: 'Senha incorreta' },
      { status: 401 },
    );
  }

  // 🔥 Aqui está a correção importante:
  const response = {
    success: true,
    isAdmin: user.isAdmin ?? false,
    codCliente: user.cod_cliente ?? null,
    codRecOS: user.codrec_os ?? null,
    nomeRecurso: user.nome ?? null, // pega do JSON e envia no nome esperado pelo contexto
  };

  return NextResponse.json(response);
}
