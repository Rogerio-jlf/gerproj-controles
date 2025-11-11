import { readFile } from 'fs/promises';
import { NextResponse } from 'next/server';
import path from 'path';

export async function GET() {
  try {
    const filePath = path.join(process.cwd(), 'users', 'usuarios.json');
    console.log('Lendo arquivo:', filePath);
    const data = await readFile(filePath, 'utf-8');
    const users = JSON.parse(data);
    return NextResponse.json(users);
  } catch (error) {
    console.error('Erro na API /usuarios:', error);
    return NextResponse.json(
      { error: 'Erro ao carregar usuários' },
      { status: 500 },
    );
  }
}
