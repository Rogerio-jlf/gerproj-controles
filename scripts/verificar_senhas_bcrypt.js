import bcrypt from 'bcryptjs';

async function test() {
  const senha = 'tirol123'; // Coloque a senha que você quer testar aqui
  const hash = '$2b$10$jgz8SyL0cDTHiPVm6sHOou9jFfK/vvuBVQPMFEGiN6lgU7GEGO83u'; // Cole seu hash aqui

  const valid = await bcrypt.compare(senha, hash);

  if (valid) {
    console.log('Senha CONFERE com o hash!');
  } else {
    console.log('Senha NÃO confere com o hash.');
  }
}

test();

// COMO USAR:
// 1. Instale o bcryptjs: npm install bcryptjs
// 2. Cole o código acima em um arquivo chamado verificar_senhas_bcrypt.js
// 3. Substitua a variável 'senha' pela senha que você quer testar
// 4. Substitua a variável 'hash' pelo hash que você quer verificar
// 5. Execute o script: node verificar_senhas_bcrypt.js
