// test-pg-connection.ts
import { Client } from 'pg';

async function testConnection() {
  const client = new Client({
    host: 'localhost',
    port: 5432,
    user: 'postgres',
    password: 'postgres',
    database: 'GERPROJ',
  });

  try {
    await client.connect();
    console.log('Conexão bem-sucedida ao banco GERPROJ!');
  } catch (error) {
    console.error('Erro ao conectar no banco:', error);
  } finally {
    await client.end();
  }
}

testConnection();

// como executar este script:
// 1. Salve este código em um arquivo chamado `test-pg-connection.ts
// 2. Execute o comando `ts-node test-pg-connection.ts` no terminal
