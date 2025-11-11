import bcrypt from 'bcryptjs';

// Lê a senha da linha de comando
const senha = process.argv[2];

if (!senha) {
  console.error(
    '❌ Informe a senha como argumento.\nExemplo: npx ts-node scripts/hash-senha.ts minhaSenha123',
  );
  process.exit(1);
}

bcrypt
  .hash(senha, 10)
  .then((hash) => {
    console.log(`🔐 Hash gerado para a senha "${senha}":\n`);
    console.log(hash);
  })
  .catch((err) => {
    console.error('❌ Erro ao gerar hash:', err);
  });

// COMO USAR:
// npx ts-node scripts/gerador_hash_senha.ts 'informe sua senha aqui'
