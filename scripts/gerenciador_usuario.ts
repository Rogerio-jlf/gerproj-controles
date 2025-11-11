import bcrypt from 'bcryptjs';
import fs from 'fs';
import path from 'path';

// 📥 Argumentos via terminal
const args = process.argv.slice(2);
const action = args[0]; // add | update | delete
const email = args[1];
const senha = args[2];
const cod_cliente = args[3] ?? null;
const isAdmin = args[4] === 'true';

if (!['add', 'update', 'delete'].includes(action)) {
  console.error(`
❌ Ação inválida.

Uso:
  ▶️ Adicionar: npx ts-node scripts/manage-usuario.ts add <email> <senha> [cod_cliente] [isAdmin]
  🔄 Alterar senha: npx ts-node scripts/manage-usuario.ts update <email> <novaSenha>
  ❌ Deletar: npx ts-node scripts/manage-usuario.ts delete <email>
`);
  process.exit(1);
}

// ✅ Caminho ajustado para a pasta public
const filePath = path.join(process.cwd(), 'users', 'usuarios.json');
const logPath = path.join(process.cwd(), 'scripts', 'logs', 'usuario.log');

async function main() {
  try {
    const raw = fs.existsSync(filePath)
      ? fs.readFileSync(filePath, 'utf8')
      : '[]';
    const usuarios = JSON.parse(raw);

    const log = (msg: string) => {
      const now = new Date();
      const timestamp = now.toLocaleString('pt-BR');
      fs.appendFileSync(logPath, `[${timestamp}] ${msg}\n`, 'utf8');
    };

    if (action === 'add') {
      if (!email || !senha) {
        console.error('❌ Email e senha são obrigatórios para adicionar.');
        return;
      }

      if (usuarios.some((u: any) => u.email === email)) {
        console.error('❌ Já existe um usuário com este email.');
        return;
      }

      const password = await bcrypt.hash(senha, 10);

      usuarios.push({
        email,
        password,
        cod_cliente: cod_cliente === 'null' ? null : cod_cliente,
        isAdmin,
      });

      fs.writeFileSync(filePath, JSON.stringify(usuarios, null, 2), 'utf8');
      log(
        `Usuario adicionado: ${email} (admin: ${isAdmin}, cod_cliente: ${cod_cliente})`,
      );
      console.log('✅ Usuário adicionado com sucesso.');
    } else if (action === 'update') {
      if (!email || !senha) {
        console.error('❌ Email e nova senha são obrigatórios para atualizar.');
        return;
      }

      const index = usuarios.findIndex((u: any) => u.email === email);
      if (index === -1) {
        console.error('❌ Usuário não encontrado.');
        return;
      }

      usuarios[index].password = await bcrypt.hash(senha, 10);
      fs.writeFileSync(filePath, JSON.stringify(usuarios, null, 2), 'utf8');
      log(`Senha atualizada para: ${email}`);
      console.log('✅ Senha atualizada com sucesso.');
    } else if (action === 'delete') {
      if (!email) {
        console.error('❌ Email é obrigatório para deletar.');
        return;
      }

      const existe = usuarios.some((u: any) => u.email === email);
      if (!existe) {
        console.error('❌ Usuário não encontrado.');
        return;
      }

      const novaLista = usuarios.filter((u: any) => u.email !== email);
      fs.writeFileSync(filePath, JSON.stringify(novaLista, null, 2), 'utf8');
      log(`Usuario deletado: ${email}`);
      console.log('✅ Usuário deletado com sucesso.');
    }
  } catch (error) {
    console.error('❌ Erro ao gerenciar usuários:', error);
  }
}

main();

// COMO USAR:
// scripts\gerenciador_usuario.bat
